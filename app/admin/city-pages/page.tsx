"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

type Pair = { label: string; value: string };
type QA = { question: string; answer: string };
type Section = { title: string; body: string };
type LinkItem = { label: string; href: string };
type Timeline = { label: string; estimate: string };
type LocalProof = { name: string; businessType: string; quote: string };

interface CityPage {
  _id: string;
  city: string;
  state?: string;
  slug: string;
  canonicalUrl?: string;
  businessName?: string;
  phone?: string;
  email?: string;
  serviceType?: string;
  areaServed?: string[];
  geo?: { latitude: number; longitude: number } | null;
  heroTitle: string;
  heroSubtitle: string;
  intro: string;
  citySeoContent?: string;
  metaTitle: string;
  metaDescription: string;
  highlights: string[];
  stats?: Pair[];
  serviceAreas?: string[];
  deliveryTimelines?: Timeline[];
  productRange?: string[];
  deliveryNotes?: string[];
  useCases?: string[];
  sections: Section[];
  faqs: QA[];
  internalLinks?: LinkItem[];
  nearbyCitiesLinks?: LinkItem[];
  localProof?: LocalProof | null;
  isActive: boolean;
}

const empty = {
  qa: (): QA => ({ question: "", answer: "" }),
  section: (): Section => ({ title: "", body: "" }),
  pair: (): Pair => ({ label: "", value: "" }),
  timeline: (): Timeline => ({ label: "", estimate: "" }),
  link: (): LinkItem => ({ label: "", href: "" }),
  proof: (): LocalProof => ({ name: "", businessType: "", quote: "" }),
};

function ChipBox({
  title,
  value,
  onValueChange,
  onAdd,
  items,
  onRemoveItem,
}: {
  title: string;
  value: string;
  onValueChange: (value: string) => void;
  onAdd: () => void;
  items: string[];
  onRemoveItem: (index: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <div className="mt-2 flex gap-2">
        <input
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={onAdd}
          className="rounded-xl bg-[#0B0F6B] px-4 py-2 text-sm font-semibold text-white"
        >
          Add
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item, index) => (
          <button
            key={`${item}-${index}`}
            type="button"
            onClick={() => onRemoveItem(index)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
          >
            {item} ×
          </button>
        ))}
      </div>
    </div>
  );
}

const createEmptyForm = () => ({
  city: "",
  state: "",
  slug: "",
  canonicalUrl: "",
  businessName: "Denimique",
  phone: "",
  email: "",
  serviceType: "Wholesale and bulk fashion apparel supply",
  areaServed: [] as string[],
  geo: { latitude: "", longitude: "" } as { latitude: number | ""; longitude: number | "" },
  heroTitle: "",
  heroSubtitle: "",
  intro: "",
  citySeoContent: "",
  metaTitle: "",
  metaDescription: "",
  highlights: [] as string[],
  stats: [empty.pair()],
  serviceAreas: [] as string[],
  deliveryTimelines: [empty.timeline()],
  productRange: [] as string[],
  deliveryNotes: [] as string[],
  useCases: [] as string[],
  sections: [empty.section()],
  faqs: [empty.qa()],
  internalLinks: [empty.link()],
  nearbyCitiesLinks: [empty.link()],
  localProof: empty.proof(),
  isActive: true,
});

const wordsCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export default function AdminCityPages() {
  const { checkAuth } = useAuthStore();
  const router = useRouter();
  const [pages, setPages] = useState<CityPage[]>([]);
  const [formData, setFormData] = useState(createEmptyForm());
  const [selected, setSelected] = useState<CityPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [chips, setChips] = useState({
    highlight: "",
    serviceArea: "",
    areaServed: "",
    productRange: "",
    deliveryNote: "",
    useCase: "",
  });

  const fetchPages = async () => {
    try {
      setLoading(true);
      const response = await api.get("/city-pages/admin/all");
      setPages(response.data.data || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load city pages"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const auth = checkAuth();
    if (!auth) {
      router.push("/login");
      return;
    }
    // Data fetch kicked off on mount; fetchPages sets its own loading flag.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPages();
  }, [checkAuth, router]);

  const onInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const updateArrayObj = <T,>(
    key:
      | "stats"
      | "deliveryTimelines"
      | "sections"
      | "faqs"
      | "internalLinks"
      | "nearbyCitiesLinks",
    index: number,
    field: keyof T,
    value: string,
  ) => {
    setFormData((prev) => {
      const next = [...(prev[key] as T[])];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, [key]: next };
    });
  };

  const pushObj = (
    key:
      | "stats"
      | "deliveryTimelines"
      | "sections"
      | "faqs"
      | "internalLinks"
      | "nearbyCitiesLinks",
  ) => {
    const map = {
      stats: empty.pair(),
      deliveryTimelines: empty.timeline(),
      sections: empty.section(),
      faqs: empty.qa(),
      internalLinks: empty.link(),
      nearbyCitiesLinks: empty.link(),
    };
    setFormData((prev) => ({ ...prev, [key]: [...prev[key], map[key]] }));
  };

  const removeObj = (
    key:
      | "stats"
      | "deliveryTimelines"
      | "sections"
      | "faqs"
      | "internalLinks"
      | "nearbyCitiesLinks",
    index: number,
  ) => setFormData((prev) => ({ ...prev, [key]: prev[key].filter((_, i) => i !== index) }));

  const addChip = (
    list: "highlights" | "serviceAreas" | "areaServed" | "productRange" | "deliveryNotes" | "useCases",
    input: keyof typeof chips,
  ) => {
    const value = chips[input].trim();
    if (!value) return;
    setFormData((prev) => ({ ...prev, [list]: [...prev[list], value] }));
    setChips((prev) => ({ ...prev, [input]: "" }));
  };

  const removeChip = (
    list: "highlights" | "serviceAreas" | "areaServed" | "productRange" | "deliveryNotes" | "useCases",
    index: number,
  ) => setFormData((prev) => ({ ...prev, [list]: prev[list].filter((_, i) => i !== index) }));

  const seoWords = useMemo(() => wordsCount(formData.citySeoContent), [formData.citySeoContent]);

  const validate = () => {
    if (!formData.city || !formData.heroTitle || !formData.metaTitle) return "City, hero and meta title are required.";
    if (seoWords < 350 || seoWords > 650) return "City SEO content must be 350-650 words.";
    if (formData.serviceAreas.length < 3) return "Add at least 3 service areas.";
    if (formData.faqs.filter((faq) => faq.question && faq.answer).length < 4) return "Add at least 4 FAQs.";
    if (formData.deliveryTimelines.filter((row) => /\d/.test(row.estimate)).length < 2) return "Add at least 2 numeric timelines.";
    return null;
  };

  const payload = () => ({
    ...formData,
    stats: formData.stats.filter((x) => x.label || x.value),
    sections: formData.sections.filter((x) => x.title || x.body),
    faqs: formData.faqs.filter((x) => x.question || x.answer),
    deliveryTimelines: formData.deliveryTimelines.filter((x) => x.label || x.estimate),
    internalLinks: formData.internalLinks.filter((x) => x.label || x.href),
    nearbyCitiesLinks: formData.nearbyCitiesLinks.filter((x) => x.label || x.href),
    geo:
      formData.geo.latitude !== "" && formData.geo.longitude !== ""
        ? { latitude: Number(formData.geo.latitude), longitude: Number(formData.geo.longitude) }
        : null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) return void toast.error(err);
    try {
      setSubmitting(true);
      const response = selected
        ? await api.put(`/city-pages/admin/${selected._id}`, payload())
        : await api.post("/city-pages/admin", payload());
      toast.success(selected ? "City page updated" : "City page created");
      if (response.data?.warnings?.length) toast(response.data.warnings[0]);
      resetForm();
      fetchPages();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save city page"));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelected(null);
    setFormData(createEmptyForm());
    setChips({ highlight: "", serviceArea: "", areaServed: "", productRange: "", deliveryNote: "", useCase: "" });
  };

  const handleEdit = (page: CityPage) => {
    setSelected(page);
    setFormData({
      city: page.city || "",
      state: page.state || "",
      slug: page.slug || "",
      canonicalUrl: page.canonicalUrl || "",
      businessName: page.businessName || "Denimique",
      phone: page.phone || "",
      email: page.email || "",
      serviceType: page.serviceType || "Wholesale and bulk fashion apparel supply",
      areaServed: page.areaServed || [],
      geo: { latitude: page.geo?.latitude ?? "", longitude: page.geo?.longitude ?? "" },
      heroTitle: page.heroTitle || "",
      heroSubtitle: page.heroSubtitle || "",
      intro: page.intro || "",
      citySeoContent: page.citySeoContent || "",
      metaTitle: page.metaTitle || "",
      metaDescription: page.metaDescription || "",
      highlights: page.highlights || [],
      stats: page.stats?.length ? page.stats : [empty.pair()],
      serviceAreas: page.serviceAreas || [],
      deliveryTimelines: page.deliveryTimelines?.length ? page.deliveryTimelines : [empty.timeline()],
      productRange: page.productRange || [],
      deliveryNotes: page.deliveryNotes || [],
      useCases: page.useCases || [],
      sections: page.sections?.length ? page.sections : [empty.section()],
      faqs: page.faqs?.length ? page.faqs : [empty.qa()],
      internalLinks: page.internalLinks?.length ? page.internalLinks : [empty.link()],
      nearbyCitiesLinks: page.nearbyCitiesLinks?.length ? page.nearbyCitiesLinks : [empty.link()],
      localProof: page.localProof || empty.proof(),
      isActive: page.isActive,
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this city page?")) return;
    try {
      await api.delete(`/city-pages/admin/${id}`);
      toast.success("City page deleted");
      fetchPages();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete city page"));
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <div className="bg-white border-b border-slate-200">
        <div className="w-full px-6 lg:px-10 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">City Location Pages</h1>
            <p className="text-slate-600 mt-1">Unique local SEO data for each city page.</p>
          </div>
          <Link href="/admin" className="text-[#0B0F6B] hover:text-[#151b87]">{"<-"} Back to Admin</Link>
        </div>
      </div>

      <div className="w-full px-6 lg:px-10 py-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-slate-900">{selected ? "Edit City Page" : "Create City Page"}</h2>
              {selected && <button type="button" onClick={resetForm} className="rounded-full border border-slate-300 px-4 py-2 text-sm">Reset</button>}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <input name="city" value={formData.city} onChange={onInput} placeholder="City *" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" required />
              <input name="state" value={formData.state} onChange={onInput} placeholder="State" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <input name="slug" value={formData.slug} onChange={onInput} placeholder="Slug (optional)" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
              <input name="canonicalUrl" value={formData.canonicalUrl} onChange={onInput} placeholder="Canonical URL (optional)" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            </div>
            <input name="heroTitle" value={formData.heroTitle} onChange={onInput} placeholder="Hero title *" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" required />
            <input name="heroSubtitle" value={formData.heroSubtitle} onChange={onInput} placeholder="Hero subtitle *" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" required />
            <textarea name="intro" value={formData.intro} onChange={onInput} placeholder="Intro *" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" rows={3} required />
            <input name="metaTitle" value={formData.metaTitle} onChange={onInput} placeholder="Meta title *" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" required />
            <textarea name="metaDescription" value={formData.metaDescription} onChange={onInput} placeholder="Meta description *" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" rows={2} required />

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex justify-between text-sm font-semibold"><span>City SEO Content *</span><span>{seoWords} words</span></div>
              <textarea name="citySeoContent" value={formData.citySeoContent} onChange={onInput} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" rows={8} required />
            </div>

            <ChipBox
              title="Highlights"
              value={chips.highlight}
              onValueChange={(value) => setChips((p) => ({ ...p, highlight: value }))}
              onAdd={() => addChip("highlights", "highlight")}
              items={formData.highlights}
              onRemoveItem={(index) => removeChip("highlights", index)}
            />
            <ChipBox
              title="Service Areas"
              value={chips.serviceArea}
              onValueChange={(value) => setChips((p) => ({ ...p, serviceArea: value }))}
              onAdd={() => addChip("serviceAreas", "serviceArea")}
              items={formData.serviceAreas}
              onRemoveItem={(index) => removeChip("serviceAreas", index)}
            />
            <ChipBox
              title="Area Served"
              value={chips.areaServed}
              onValueChange={(value) => setChips((p) => ({ ...p, areaServed: value }))}
              onAdd={() => addChip("areaServed", "areaServed")}
              items={formData.areaServed}
              onRemoveItem={(index) => removeChip("areaServed", index)}
            />
            <ChipBox
              title="Product Range"
              value={chips.productRange}
              onValueChange={(value) => setChips((p) => ({ ...p, productRange: value }))}
              onAdd={() => addChip("productRange", "productRange")}
              items={formData.productRange}
              onRemoveItem={(index) => removeChip("productRange", index)}
            />
            <ChipBox
              title="Delivery Notes"
              value={chips.deliveryNote}
              onValueChange={(value) => setChips((p) => ({ ...p, deliveryNote: value }))}
              onAdd={() => addChip("deliveryNotes", "deliveryNote")}
              items={formData.deliveryNotes}
              onRemoveItem={(index) => removeChip("deliveryNotes", index)}
            />
            <ChipBox
              title="Use Cases"
              value={chips.useCase}
              onValueChange={(value) => setChips((p) => ({ ...p, useCase: value }))}
              onAdd={() => addChip("useCases", "useCase")}
              items={formData.useCases}
              onRemoveItem={(index) => removeChip("useCases", index)}
            />

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <p className="text-sm font-semibold">Delivery Timelines</p>
              {formData.deliveryTimelines.map((row, i) => (
                <div key={i} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
                  <input value={row.label} onChange={(e) => updateArrayObj<Timeline>("deliveryTimelines", i, "label", e.target.value)} placeholder="Label" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  <input value={row.estimate} onChange={(e) => updateArrayObj<Timeline>("deliveryTimelines", i, "estimate", e.target.value)} placeholder="Estimate (24-48 hours)" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  {formData.deliveryTimelines.length > 1 && <button type="button" onClick={() => removeObj("deliveryTimelines", i)} className="text-xs text-rose-600">Remove</button>}
                </div>
              ))}
              <button type="button" onClick={() => pushObj("deliveryTimelines")} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">Add Timeline</button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <p className="text-sm font-semibold">FAQs</p>
              {formData.faqs.map((row, i) => (
                <div key={i} className="space-y-2">
                  <input value={row.question} onChange={(e) => updateArrayObj<QA>("faqs", i, "question", e.target.value)} placeholder="Question" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  <textarea value={row.answer} onChange={(e) => updateArrayObj<QA>("faqs", i, "answer", e.target.value)} placeholder="Answer" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" rows={2} />
                  {formData.faqs.length > 1 && <button type="button" onClick={() => removeObj("faqs", i)} className="text-xs text-rose-600">Remove</button>}
                </div>
              ))}
              <button type="button" onClick={() => pushObj("faqs")} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">Add FAQ</button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <p className="text-sm font-semibold">Sections</p>
              {formData.sections.map((row, i) => (
                <div key={i} className="space-y-2">
                  <input value={row.title} onChange={(e) => updateArrayObj<Section>("sections", i, "title", e.target.value)} placeholder="Section title" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  <textarea value={row.body} onChange={(e) => updateArrayObj<Section>("sections", i, "body", e.target.value)} placeholder="Section body" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" rows={3} />
                  {formData.sections.length > 1 && <button type="button" onClick={() => removeObj("sections", i)} className="text-xs text-rose-600">Remove</button>}
                </div>
              ))}
              <button type="button" onClick={() => pushObj("sections")} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">Add Section</button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <p className="text-sm font-semibold">Stats</p>
              {formData.stats.map((row, i) => (
                <div key={i} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
                  <input value={row.label} onChange={(e) => updateArrayObj<Pair>("stats", i, "label", e.target.value)} placeholder="Label" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  <input value={row.value} onChange={(e) => updateArrayObj<Pair>("stats", i, "value", e.target.value)} placeholder="Value" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  {formData.stats.length > 1 && <button type="button" onClick={() => removeObj("stats", i)} className="text-xs text-rose-600">Remove</button>}
                </div>
              ))}
              <button type="button" onClick={() => pushObj("stats")} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">Add Stat</button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <input name="businessName" value={formData.businessName} onChange={onInput} placeholder="Business Name" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
              <input name="serviceType" value={formData.serviceType} onChange={onInput} placeholder="Service Type" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <input name="phone" value={formData.phone} onChange={onInput} placeholder="Phone" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
              <input name="email" value={formData.email} onChange={onInput} placeholder="Email" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <input
                value={formData.geo.latitude}
                onChange={(e) => setFormData((prev) => ({ ...prev, geo: { ...prev.geo, latitude: e.target.value === "" ? "" : Number(e.target.value) } }))}
                placeholder="Geo Latitude"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
              />
              <input
                value={formData.geo.longitude}
                onChange={(e) => setFormData((prev) => ({ ...prev, geo: { ...prev.geo, longitude: e.target.value === "" ? "" : Number(e.target.value) } }))}
                placeholder="Geo Longitude"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <p className="text-sm font-semibold">Internal Links</p>
              {formData.internalLinks.map((row, i) => (
                <div key={i} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
                  <input value={row.label} onChange={(e) => updateArrayObj<LinkItem>("internalLinks", i, "label", e.target.value)} placeholder="Label" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  <input value={row.href} onChange={(e) => updateArrayObj<LinkItem>("internalLinks", i, "href", e.target.value)} placeholder="/path" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  {formData.internalLinks.length > 1 && <button type="button" onClick={() => removeObj("internalLinks", i)} className="text-xs text-rose-600">Remove</button>}
                </div>
              ))}
              <button type="button" onClick={() => pushObj("internalLinks")} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">Add Link</button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <p className="text-sm font-semibold">Nearby Cities Links</p>
              {formData.nearbyCitiesLinks.map((row, i) => (
                <div key={i} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
                  <input value={row.label} onChange={(e) => updateArrayObj<LinkItem>("nearbyCitiesLinks", i, "label", e.target.value)} placeholder="Label" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  <input value={row.href} onChange={(e) => updateArrayObj<LinkItem>("nearbyCitiesLinks", i, "href", e.target.value)} placeholder="/path" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  {formData.nearbyCitiesLinks.length > 1 && <button type="button" onClick={() => removeObj("nearbyCitiesLinks", i)} className="text-xs text-rose-600">Remove</button>}
                </div>
              ))}
              <button type="button" onClick={() => pushObj("nearbyCitiesLinks")} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">Add Link</button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <p className="text-sm font-semibold">Local Proof</p>
              <input
                value={formData.localProof.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, localProof: { ...prev.localProof, name: e.target.value } }))}
                placeholder="Name"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                value={formData.localProof.businessType}
                onChange={(e) => setFormData((prev) => ({ ...prev, localProof: { ...prev.localProof, businessType: e.target.value } }))}
                placeholder="Business type"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <textarea
                value={formData.localProof.quote}
                onChange={(e) => setFormData((prev) => ({ ...prev, localProof: { ...prev.localProof, quote: e.target.value } }))}
                placeholder="Testimonial quote"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                rows={2}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="isActive" checked={formData.isActive} onChange={onInput} />
              Publish this city page
            </label>

            <button type="submit" disabled={submitting} className="rounded-full bg-[#0B0F6B] px-6 py-3 text-sm font-semibold text-white">
              {submitting ? "Saving..." : selected ? "Update Page" : "Create Page"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4"><h2 className="text-xl font-semibold text-slate-900">City Pages</h2></div>
          {loading ? (
            <div className="p-6 text-center text-slate-500">Loading...</div>
          ) : pages.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No city pages created yet.</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {pages.map((page) => (
                <div key={page._id} className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">{page.city}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${page.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{page.isActive ? "Published" : "Draft"}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">/{page.slug}</p>
                  <div className="flex flex-wrap gap-2 pt-3">
                    <button onClick={() => handleEdit(page)} className="rounded-full bg-[#0B0F6B]/10 px-4 py-2 text-xs font-semibold text-[#0B0F6B]">Edit</button>
                    <button onClick={() => handleDelete(page._id)} className="rounded-full bg-rose-100 px-4 py-2 text-xs font-semibold text-rose-700">Delete</button>
                    <Link href={`/${page.slug}`} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700">View</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
