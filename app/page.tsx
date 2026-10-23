import CategoryShowcase from "@/components/home/CategoryShowcase";
import CustomerReviews, {
  type GoogleReviewItem,
} from "@/components/home/CustomerReviews";
import {
  BrandStory,
  EditorialCollections,
  SignatureCampaign,
} from "@/components/home/EditorialHomeSections";
import Hero from "@/components/home/Hero";
import LuxuryProductRail from "@/components/home/LuxuryProductRail";
import Newsletter from "@/components/home/Newsletter";
import TrustBadgesBar from "@/components/home/TrustBadgesBar";
import { getProducts } from "@/lib/storefront";
import type { Metadata } from "next";
import type { Product } from "@/types/product";

export const metadata: Metadata = {
  title: "Denimique | The Modern Denim House",
  description:
    "Discover Denimique's considered edit of modern denim and everyday essentials, designed for a life in motion.",
  applicationName: "Denimique",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Denimique | The Modern Denim House",
    siteName: "Denimique",
    description: "Modern denim and everyday essentials, designed for a life in motion.",
    url: "/",
    type: "website",
    images: ["/logo-removebg-preview.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Denimique | The Modern Denim House",
    description: "Modern denim and everyday essentials, designed for a life in motion.",
    images: ["/logo-removebg-preview.png"],
  },
};

const FEATURABLE_WIDGET_ID = process.env.NEXT_PUBLIC_FEATURABLE_WIDGET_ID;

const GOOGLE_REVIEWS_DISPLAY_LIMIT = 6;
const HOMEPAGE_PRODUCT_ORDER = [
  "womens-stylish-high-waist-wide-leg-straight-jeans",
  "womens-fashionable-washed-high-waist-straight-jeans",
  "smokey-blue-denim-loose-fit-straight-jeans-for-women",
  "womens-forest-green-one-piece-dress",
  "glamorous-blue-satin-slip-midi-dress",
  "navy-satin-cowl-neck-midi-dress",
  "silken-comfort-knee-length-lounge-dress",
  "rosewood-pintuck-pleated-cotton-top",
  "teal-pintuck-detail-cotton-tunic-top",
  "stylish-sheer-net-top-and-skirt-set",
];

const HOMEPAGE_INTIMATE_PRODUCT_PATTERN =
  /\b(?:bras?|bralettes?|brassieres?|pant(?:y|ies)|briefs?|thongs?|underwear|lingerie|bikini|g[-\s]?strings?|boyshorts?|pantyhose|value\s*packs?)\b/i;

const fetchGoogleReviews = async (): Promise<{
  reviews: GoogleReviewItem[];
  profileUrl: string | null;
}> => {
  const empty = { reviews: [], profileUrl: null };
  if (!FEATURABLE_WIDGET_ID) return empty;
  try {
    const response = await fetch(
      `https://api.featurable.com/v2/widgets/${FEATURABLE_WIDGET_ID}`,
      { next: { revalidate: 3600 } },
    );
    if (!response.ok) return empty;
    const data = await response.json();
    const rawReviews = data?.widget?.reviews;
    if (!data?.success || !Array.isArray(rawReviews)) return empty;

    interface RawGoogleReview {
      id: string;
      author?: { name?: string; avatarUrl?: string };
      rating?: { value?: number };
      text?: string;
      publishedAt?: string;
    }

    const reviews = (rawReviews as RawGoogleReview[])
      .map((review) => ({
        id: review.id,
        name: review.author?.name ?? "Google User",
        avatarUrl: review.author?.avatarUrl ?? null,
        rating: review.rating?.value ?? 5,
        text: review.text ?? "",
        publishedAt: review.publishedAt ?? null,
      }))
      .filter((review: GoogleReviewItem) => Boolean(review.text))
      .sort((a: GoogleReviewItem, b: GoogleReviewItem) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return (
          new Date(b.publishedAt ?? 0).getTime() -
          new Date(a.publishedAt ?? 0).getTime()
        );
      })
      .slice(0, GOOGLE_REVIEWS_DISPLAY_LIMIT);

    const profileUrl =
      data?.widget?.gbpLocationSummary?.writeAReviewUri ?? null;

    return { reviews, profileUrl };
  } catch {
    return empty;
  }
};

const getHomeServerData = async () => {
  const [featured, bestSellers, allProducts, additionalProducts, googleReviewsData] =
    await Promise.all([
      getProducts({ limit: 100, isFeatured: true }).catch(() => []),
      getProducts({ limit: 100, isBestSeller: true }).catch(() => []),
      getProducts({ limit: 100 }).catch(() => []),
      getProducts({ limit: 100, page: 5 }).catch(() => []),
      fetchGoogleReviews(),
    ]);

  return {
    featured,
    bestSellers,
    allProducts,
    additionalProducts,
    googleReviews: googleReviewsData.reviews,
    googleReviewsUrl: googleReviewsData.profileUrl,
  };
};

export default async function Home() {
  const {
    featured,
    bestSellers,
    allProducts,
    additionalProducts,
    googleReviews,
    googleReviewsUrl,
  } = await getHomeServerData();

  const catalogProducts = [
    ...bestSellers,
    ...featured,
    ...allProducts,
    ...additionalProducts,
  ].filter(
    (product, index, items) =>
      Boolean(product.images[0]) &&
      items.findIndex((item) => item.slug === product.slug) === index,
  );
  const homepageProducts = catalogProducts
    .filter(
      (product) =>
        Boolean(product.images[0]) &&
        !HOMEPAGE_INTIMATE_PRODUCT_PATTERN.test(
          `${product.name} ${product.category?.name ?? ""} ${product.subcategory?.name ?? ""}`,
        ),
    )
    .sort((a, b) => {
      const aOrder = HOMEPAGE_PRODUCT_ORDER.indexOf(a.slug);
      const bOrder = HOMEPAGE_PRODUCT_ORDER.indexOf(b.slug);
      const aRank = aOrder < 0 ? HOMEPAGE_PRODUCT_ORDER.length : aOrder;
      const bRank = bOrder < 0 ? HOMEPAGE_PRODUCT_ORDER.length : bOrder;
      if (aRank !== bRank) return aRank - bRank;
      if (Boolean(a.isBestSeller) !== Boolean(b.isBestSeller)) {
        return Number(Boolean(b.isBestSeller)) - Number(Boolean(a.isBestSeller));
      }
      if (Boolean(a.isFeatured) !== Boolean(b.isFeatured)) {
        return Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
      }
      return (b.rating ?? 0) - (a.rating ?? 0);
    })
    .slice(0, 60);

  const usedHomepageProductKeys = new Set<string>();
  const getHomepageProductKeys = (product: Product) => [
    `slug:${product.slug}`,
    `name:${product.name.trim().toLocaleLowerCase().replace(/\s+/g, " ")}`,
    `image:${product.images[0]}`,
  ];
  const takeUniqueHomepageProducts = (
    candidates: Product[],
    limit: number,
    predicate: (product: Product) => boolean = () => true,
  ) => {
    const selected = candidates
      .filter(
        (product) =>
          getHomepageProductKeys(product).every(
            (key) => !usedHomepageProductKeys.has(key),
          ) && predicate(product),
      )
      .slice(0, limit);
    selected.forEach((product) =>
      getHomepageProductKeys(product).forEach((key) =>
        usedHomepageProductKeys.add(key),
      ),
    );
    return selected;
  };

  const isDenimProduct = (product: Product) =>
    /\b(jeans?|denim|cargo)\b/i.test(product.name);
  const denimProducts = homepageProducts.filter(isDenimProduct);
  const otherProducts = homepageProducts.filter((product) => !isDenimProduct(product));
  const mixedShowcaseProducts = [
    ...takeUniqueHomepageProducts(denimProducts, 2),
    ...takeUniqueHomepageProducts(otherProducts, 2),
  ];
  const editorialProducts = takeUniqueHomepageProducts(homepageProducts, 10);
  const storyProducts = takeUniqueHomepageProducts(
    homepageProducts,
    8,
    (product) =>
      !isDenimProduct(product) &&
      !/\b(?:bras?|bralettes?|brassieres?|pant(?:y|ies)|briefs?|thongs?|underwear|lingerie|g[-\s]?strings?)\b/i.test(
        `${product.name} ${product.category?.name ?? ""} ${product.subcategory?.name ?? ""}`,
      ),
  );
  const campaignProducts = takeUniqueHomepageProducts(
    homepageProducts,
    4,
    (product) => !isDenimProduct(product),
  );
  const homepageProductSlugs = new Set(homepageProducts.map((product) => product.slug));
  const featuredProducts = takeUniqueHomepageProducts(
    [
      ...featured.filter((product) => homepageProductSlugs.has(product.slug)),
      ...homepageProducts,
    ],
    10,
  );
  const categoryProducts = takeUniqueHomepageProducts(homepageProducts, 8);

  return (
    <main className="denimique-home-theme bg-[var(--denimique-paper)] text-[var(--denimique-ink)]">
      <Hero initialHero={null} initialSliderFallbackImages={[]} />
      <CategoryShowcase products={categoryProducts} />
      <LuxuryProductRail
        products={mixedShowcaseProducts}
        eyebrow="Customer favorites"
        title="Denim & more"
        description="A mix of denim and other favorites from the collection."
        alwaysShow
        gridOnly
      />
      <TrustBadgesBar />
      <EditorialCollections products={editorialProducts} />
      <BrandStory products={storyProducts} />
      <SignatureCampaign products={campaignProducts} />
      <LuxuryProductRail
        products={featuredProducts}
        eyebrow="The considered edit"
        title="Featured Products"
        description="A focused selection of our most expressive, everyday pieces."
      />
      <CustomerReviews
        googleReviews={googleReviews}
        googleReviewsUrl={googleReviewsUrl}
      />
      <Newsletter />
    </main>
  );
}
