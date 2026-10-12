import { Request, Response } from "express";
import CityPage from "../models/CityPage";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeText = (value: string) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const countWords = (value: string) =>
  normalizeText(value)
    .split(" ")
    .filter(Boolean).length;

const tokenize = (value: string) => {
  const words = normalizeText(value)
    .split(" ")
    .filter((word) => word.length > 2);
  return new Set(words);
};

const jaccardSimilarity = (a: Set<string>, b: Set<string>) => {
  if (a.size === 0 || b.size === 0) return 0;

  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
};

const buildContentBlob = (payload: any) => {
  const sectionText = Array.isArray(payload.sections)
    ? payload.sections.map((section: any) => `${section?.title || ""} ${section?.body || ""}`).join(" ")
    : "";
  const faqText = Array.isArray(payload.faqs)
    ? payload.faqs.map((faq: any) => `${faq?.question || ""} ${faq?.answer || ""}`).join(" ")
    : "";
  const highlightText = Array.isArray(payload.highlights) ? payload.highlights.join(" ") : "";
  const serviceAreaText = Array.isArray(payload.serviceAreas) ? payload.serviceAreas.join(" ") : "";
  const seoText = payload.citySeoContent || "";

  return [payload.heroTitle, payload.heroSubtitle, payload.intro, sectionText, faqText, highlightText, serviceAreaText, seoText]
    .filter(Boolean)
    .join(" ");
};

const getNumericFactCount = (deliveryTimelines: any[]) => {
  if (!Array.isArray(deliveryTimelines)) return 0;
  return deliveryTimelines.filter((item) => /\d/.test(String(item?.estimate || ""))).length;
};

const hasCitySpecificFaqSignal = (faq: any, city: string, serviceAreas: string[]) => {
  const text = normalizeText(`${faq?.question || ""} ${faq?.answer || ""}`);
  const normalizedCity = normalizeText(city);
  const hasCity = normalizedCity.length > 0 && text.includes(normalizedCity);
  const hasLocality = serviceAreas.some((area) => {
    const normalizedArea = normalizeText(area);
    return normalizedArea.length > 2 && text.includes(normalizedArea);
  });
  const hasTimeline = /\b\d+\s?(hour|hours|hr|hrs|day|days)\b/.test(text) || /same day|next day|dispatch|lead time/.test(text);
  return hasCity || hasLocality || hasTimeline;
};

const getFaqPairs = (faqs: any[]) =>
  (Array.isArray(faqs) ? faqs : [])
    .map((faq) => `${normalizeText(faq?.question || "")}::${normalizeText(faq?.answer || "")}`)
    .filter((pair) => pair !== "::");

const validatePayload = (payload: any) => {
  if (
    !payload.city ||
    !payload.heroTitle ||
    !payload.heroSubtitle ||
    !payload.intro ||
    !payload.metaTitle ||
    !payload.metaDescription ||
    !payload.citySeoContent
  ) {
    return "Missing required fields";
  }

  const seoWordCount = countWords(payload.citySeoContent);
  if (seoWordCount < 350 || seoWordCount > 650) {
    return "City SEO content must be between 350 and 650 words.";
  }

  const serviceAreas = Array.isArray(payload.serviceAreas) ? payload.serviceAreas.filter(Boolean) : [];
  if (serviceAreas.length < 3) {
    return "Please add at least 3 service areas/localities.";
  }

  const faqs = Array.isArray(payload.faqs)
    ? payload.faqs.filter((faq: any) => faq?.question && faq?.answer)
    : [];
  if (faqs.length < 4) {
    return "Please add at least 4 FAQs.";
  }

  const citySpecificFaqCount = faqs.filter((faq: any) =>
    hasCitySpecificFaqSignal(faq, payload.city, serviceAreas),
  ).length;
  if (citySpecificFaqCount < 3) {
    return "At least 3 FAQs must include city-specific or locality/timeline details.";
  }

  const numericFactCount = getNumericFactCount(payload.deliveryTimelines);
  if (numericFactCount < 2) {
    return "Please add at least 2 numeric delivery timeline facts.";
  }

  return null;
};

const collectSeoWarnings = async (payload: any, excludeId?: string) => {
  const warnings: string[] = [];
  const pages = await CityPage.find(excludeId ? { _id: { $ne: excludeId } } : {}).select(
    "city heroTitle heroSubtitle intro citySeoContent sections faqs highlights serviceAreas",
  );

  const candidateTokens = tokenize(buildContentBlob(payload));

  let highestSimilarity = 0;
  let highestCity = "";
  for (const page of pages) {
    const score = jaccardSimilarity(candidateTokens, tokenize(buildContentBlob(page)));
    if (score > highestSimilarity) {
      highestSimilarity = score;
      highestCity = page.city;
    }
  }

  if (highestSimilarity >= 0.85) {
    return {
      warnings,
      blockingError: `Content is too similar (${Math.round(highestSimilarity * 100)}%) to ${highestCity}. Please rewrite with more city-specific details.`,
    };
  }
  if (highestSimilarity >= 0.7) {
    warnings.push(
      `High content similarity detected (${Math.round(highestSimilarity * 100)}%) vs ${highestCity}. Add more unique local details.`,
    );
  }

  const otherFaqs = new Set(
    pages.flatMap((page) => getFaqPairs((page as any).faqs)),
  );
  const duplicateFaqCount = getFaqPairs(payload.faqs).filter((pair) => otherFaqs.has(pair)).length;

  if (duplicateFaqCount >= 2) {
    return {
      warnings,
      blockingError: `Detected ${duplicateFaqCount} duplicated FAQs from other city pages. Please provide unique local FAQs.`,
    };
  }
  if (duplicateFaqCount > 0) {
    warnings.push(
      `${duplicateFaqCount} FAQ item matches another city page. Consider rewriting to improve uniqueness.`,
    );
  }

  return { warnings, blockingError: null };
};

// Public: get by slug
export const getCityPageBySlug = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const page = await CityPage.findOne({ slug, isActive: true });
    if (!page) {
      return res.status(404).json({ message: "City page not found" });
    }
    res.json(page);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Public: list active pages
export const getCityPages = async (req: Request, res: Response) => {
  try {
    const pages = await CityPage.find({ isActive: true }).sort({ city: 1 });
    res.json({ data: pages });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Admin: list all
export const getAllCityPages = async (req: Request, res: Response) => {
  try {
    const pages = await CityPage.find().sort({ createdAt: -1 });
    res.json({ data: pages });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Admin: create
export const createCityPage = async (req: Request, res: Response) => {
  try {
    const {
      city,
      state,
      slug,
      canonicalUrl,
      businessName,
      phone,
      email,
      serviceType,
      areaServed,
      geo,
      heroTitle,
      heroSubtitle,
      intro,
      citySeoContent,
      metaTitle,
      metaDescription,
      highlights,
      stats,
      serviceAreas,
      deliveryTimelines,
      productRange,
      deliveryNotes,
      certifications,
      useCases,
      sections,
      faqs,
      internalLinks,
      nearbyCitiesLinks,
      localProof,
      isActive,
    } = req.body;

    const validationError = validatePayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const finalSlug =
      slug && String(slug).trim().length > 0
        ? String(slug).trim()
        : `fashion-wholesale-${slugify(city)}`;
    const finalCanonicalUrl =
      canonicalUrl && String(canonicalUrl).trim().length > 0
        ? String(canonicalUrl).trim()
        : `/${finalSlug}`;

    const exists = await CityPage.findOne({ slug: finalSlug });
    if (exists) {
      return res.status(409).json({ message: "Slug already exists" });
    }

    const { warnings, blockingError } = await collectSeoWarnings(req.body);
    if (blockingError) {
      return res.status(422).json({ message: blockingError });
    }

    const page = await CityPage.create({
      city,
      state,
      slug: finalSlug,
      canonicalUrl: finalCanonicalUrl,
      businessName: businessName || "Denimique",
      phone: phone || "",
      email: email || "",
      serviceType: serviceType || "Wholesale and bulk fashion apparel supply",
      areaServed: areaServed || [],
      geo: geo || null,
      heroTitle,
      heroSubtitle,
      intro,
      citySeoContent,
      metaTitle,
      metaDescription,
      highlights: highlights || [],
      stats: stats || [],
      serviceAreas: serviceAreas || [],
      deliveryTimelines: deliveryTimelines || [],
      productRange: productRange || [],
      deliveryNotes: deliveryNotes || [],
      certifications: certifications || [],
      useCases: useCases || [],
      sections: sections || [],
      faqs: faqs || [],
      internalLinks: internalLinks || [],
      nearbyCitiesLinks: nearbyCitiesLinks || [],
      localProof: localProof || null,
      isActive: isActive ?? true,
    });

    res.status(201).json({
      message: "City page created",
      data: page,
      warnings,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Admin: update
export const updateCityPage = async (req: Request, res: Response) => {
  try {
    const page = await CityPage.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ message: "City page not found" });
    }

    const {
      city,
      state,
      slug,
      canonicalUrl,
      businessName,
      phone,
      email,
      serviceType,
      areaServed,
      geo,
      heroTitle,
      heroSubtitle,
      intro,
      citySeoContent,
      metaTitle,
      metaDescription,
      highlights,
      stats,
      serviceAreas,
      deliveryTimelines,
      productRange,
      deliveryNotes,
      certifications,
      useCases,
      sections,
      faqs,
      internalLinks,
      nearbyCitiesLinks,
      localProof,
      isActive,
    } = req.body;

    const nextPayload = {
      city: city !== undefined ? city : page.city,
      heroTitle: heroTitle !== undefined ? heroTitle : page.heroTitle,
      heroSubtitle: heroSubtitle !== undefined ? heroSubtitle : page.heroSubtitle,
      intro: intro !== undefined ? intro : page.intro,
      metaTitle: metaTitle !== undefined ? metaTitle : page.metaTitle,
      metaDescription: metaDescription !== undefined ? metaDescription : page.metaDescription,
      citySeoContent: citySeoContent !== undefined ? citySeoContent : page.citySeoContent,
      serviceAreas: serviceAreas !== undefined ? serviceAreas : page.serviceAreas,
      deliveryTimelines: deliveryTimelines !== undefined ? deliveryTimelines : page.deliveryTimelines,
      faqs: faqs !== undefined ? faqs : page.faqs,
    };

    const validationError = validatePayload(nextPayload);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (city !== undefined) page.city = city;
    if (state !== undefined) page.state = state;
    if (canonicalUrl !== undefined) page.canonicalUrl = canonicalUrl;
    if (businessName !== undefined) page.businessName = businessName;
    if (phone !== undefined) page.phone = phone;
    if (email !== undefined) page.email = email;
    if (serviceType !== undefined) page.serviceType = serviceType;
    if (areaServed !== undefined) page.areaServed = areaServed;
    if (geo !== undefined) page.geo = geo;
    if (heroTitle !== undefined) page.heroTitle = heroTitle;
    if (heroSubtitle !== undefined) page.heroSubtitle = heroSubtitle;
    if (intro !== undefined) page.intro = intro;
    if (citySeoContent !== undefined) page.citySeoContent = citySeoContent;
    if (metaTitle !== undefined) page.metaTitle = metaTitle;
    if (metaDescription !== undefined) page.metaDescription = metaDescription;
    if (highlights !== undefined) page.highlights = highlights;
    if (stats !== undefined) page.stats = stats;
    if (serviceAreas !== undefined) page.serviceAreas = serviceAreas;
    if (deliveryTimelines !== undefined) page.deliveryTimelines = deliveryTimelines;
    if (productRange !== undefined) page.productRange = productRange;
    if (deliveryNotes !== undefined) page.deliveryNotes = deliveryNotes;
    if (certifications !== undefined) page.certifications = certifications;
    if (useCases !== undefined) page.useCases = useCases;
    if (sections !== undefined) page.sections = sections;
    if (faqs !== undefined) page.faqs = faqs;
    if (internalLinks !== undefined) page.internalLinks = internalLinks;
    if (nearbyCitiesLinks !== undefined) page.nearbyCitiesLinks = nearbyCitiesLinks;
    if (localProof !== undefined) page.localProof = localProof;
    if (isActive !== undefined) page.isActive = isActive;

    if (slug !== undefined) {
      const nextSlug = String(slug).trim();
      if (nextSlug.length > 0 && nextSlug !== page.slug) {
        const exists = await CityPage.findOne({ slug: nextSlug });
        if (exists) {
          return res.status(409).json({ message: "Slug already exists" });
        }
        page.slug = nextSlug;
      }
    }

    if (!page.canonicalUrl || page.canonicalUrl.trim().length === 0) {
      page.canonicalUrl = `/${page.slug}`;
    }

    const { warnings, blockingError } = await collectSeoWarnings(page, page._id.toString());
    if (blockingError) {
      return res.status(422).json({ message: blockingError });
    }

    const updated = await page.save();
    res.json({ message: "City page updated", data: updated, warnings });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Admin: delete
export const deleteCityPage = async (req: Request, res: Response) => {
  try {
    const deleted = await CityPage.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "City page not found" });
    }
    res.json({ message: "City page deleted", data: deleted });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
