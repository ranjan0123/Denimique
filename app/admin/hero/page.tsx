"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "@/components/ui/AppImage";
import toast from "react-hot-toast";
import api, { getApiErrorMessage, resolveApiAssetUrl } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type {
  HeroContent,
  HeroHeadlineLine,
  HeroTrustItem,
  HeroRecord,
} from "@/types/hero";

interface ImageFile {
  file: File;
  preview: string;
}

interface HeroForm
  extends Omit<HeroContent, "headlineLines" | "trustItems"> {
  headlineLines: HeroHeadlineLine[];
  trustItems: HeroTrustItem[];
}

const emptyHeadlineLine: HeroHeadlineLine = { text: "", color: "" };
const emptyTrustItem: HeroTrustItem = { label: "", icon: "Truck" };

const createEmptyForm = (): HeroForm => ({
  badgeText: "",
  headlinePrefix: "",
  headlineLines: [emptyHeadlineLine],
  description: "",
  startingPrice: "",
  ctaLabel: "",
  ctaHref: "",
  trustItems: [emptyTrustItem],
  sliderImages: [],
  isActive: true,
});

const toJsonField = (value: unknown) => JSON.stringify(value ?? []);

export default function AdminHeroPage() {
  const { checkAuth } = useAuthStore();
  const router = useRouter();
  const [heroId, setHeroId] = useState<string | null>(null);
  const [formData, setFormData] = useState<HeroForm>(createEmptyForm());
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingImages = useMemo(
    () => formData.sliderImages.map(resolveApiAssetUrl),
    [formData.sliderImages],
  );

  const fetchHero = async () => {
    setError(null);
    try {
      const response = await api.get<HeroRecord | { hero?: HeroRecord; data?: HeroRecord }>(
        "/hero",
      );
      const hero =
        (response.data as { hero?: HeroRecord; data?: HeroRecord })?.hero ||
        (response.data as { hero?: HeroRecord; data?: HeroRecord })?.data ||
        (response.data as HeroRecord);
      const normalizedHeadlineLines: HeroHeadlineLine[] = (
        hero?.headlineLines || []
      ).map((line) => {
        if (typeof line === "string") {
          return { text: line, color: "" };
        }
        return { text: line.text || "", color: line.color || "" };
      });
      const normalizedTrustItems: HeroTrustItem[] = (hero?.trustItems || []).map(
        (item) => ({
          label: item.label || "",
          icon:
            item.icon === "ShieldCheck" || item.icon === "Leaf"
              ? item.icon
              : "Truck",
        }),
      );
      if (hero && hero._id) {
        setHeroId(hero._id);
      }
      setFormData({
        badgeText: hero?.badgeText || "",
        headlinePrefix: hero?.headlinePrefix || "",
        headlineLines:
          normalizedHeadlineLines.length > 0
            ? normalizedHeadlineLines
            : [emptyHeadlineLine],
        description: hero?.description || "",
        startingPrice: hero?.startingPrice || "",
        ctaLabel: hero?.ctaLabel || "",
        ctaHref: hero?.ctaHref || "",
        trustItems:
          normalizedTrustItems.length > 0
            ? normalizedTrustItems
            : [emptyTrustItem],
        sliderImages: hero?.sliderImages || [],
        isActive: hero?.isActive ?? true,
      });
    } catch (err) {
      setFormData(createEmptyForm());
      setHeroId(null);
      const isNotFound = (err as { response?: { status?: number } })?.response?.status === 404;
      setError(
        isNotFound
          ? null
          : getApiErrorMessage(err, "Failed to load hero content."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const verifyAuth = async () => {
      const isAuth = await checkAuth();
      if (!isAuth) {
        router.push("/login");
        return;
      }

      setTimeout(async () => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser || !['admin', 'superadmin'].includes(currentUser.role || "")) {
          router.push("/");
          return;
        }
        await fetchHero();
      }, 100);
    };

    verifyAuth();
  }, [checkAuth, router]);

  const handleInputChange = (
    field: keyof HeroForm,
    value: HeroForm[keyof HeroForm],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleHeadlineChange = (
    index: number,
    field: keyof HeroHeadlineLine,
    value: string,
  ) => {
    setFormData((prev) => {
      const updated = [...prev.headlineLines];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, headlineLines: updated };
    });
  };

  const addHeadlineLine = () => {
    setFormData((prev) => ({
      ...prev,
      headlineLines: [...prev.headlineLines, { ...emptyHeadlineLine }],
    }));
  };

  const removeHeadlineLine = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      headlineLines: prev.headlineLines.filter((_, i) => i !== index),
    }));
  };

  const handleTrustItemChange = (
    index: number,
    field: keyof HeroTrustItem,
    value: string,
  ) => {
    setFormData((prev) => {
      const updated = [...prev.trustItems];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, trustItems: updated };
    });
  };

  const addTrustItem = () => {
    setFormData((prev) => ({
      ...prev,
      trustItems: [...prev.trustItems, { ...emptyTrustItem }],
    }));
  };

  const removeTrustItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      trustItems: prev.trustItems.filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: ImageFile[] = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        newFiles.push({
          file,
          preview: URL.createObjectURL(file),
        });
      }
    }

    setImageFiles((prev) => [...prev, ...newFiles]);
  };

  const removeNewImage = (preview: string) => {
    setImageFiles((prev) => {
      const updated = prev.filter((item) => item.preview !== preview);
      const removed = prev.find((item) => item.preview === preview);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  const removeExistingImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sliderImages: prev.sliderImages.filter((_, i) => i !== index),
    }));
  };

  const buildFormData = () => {
    const payload = new FormData();
    payload.append("badgeText", formData.badgeText);
    payload.append("headlinePrefix", formData.headlinePrefix);
    payload.append("description", formData.description);
    payload.append("startingPrice", String(formData.startingPrice || 0));
    payload.append("ctaLabel", formData.ctaLabel);
    payload.append("ctaHref", formData.ctaHref);
    payload.append("isActive", String(formData.isActive));
    payload.append("headlineLines", toJsonField(formData.headlineLines));
    payload.append("trustItems", toJsonField(formData.trustItems));
    payload.append("sliderImages", toJsonField(formData.sliderImages));

    imageFiles.forEach((file) => {
      payload.append("sliderImages", file.file);
    });

    return payload;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = buildFormData();

      if (heroId) {
        await api.put(`/hero/${heroId}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Hero updated successfully");
      } else {
        const response = await api.post("/hero", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const created = response.data as HeroRecord;
        if (created?._id) {
          setHeroId(created._id);
        }
        toast.success("Hero created successfully");
      }

      setImageFiles([]);
      await fetchHero();
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to save hero");
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!heroId) return;
    const confirmed = window.confirm("Delete this hero? This cannot be undone.");
    if (!confirmed) return;

    try {
      await api.delete(`/hero/${heroId}`);
      toast.success("Hero deleted");
      setHeroId(null);
      setFormData(createEmptyForm());
      setImageFiles([]);
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to delete hero");
      setError(message);
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="h-24 w-24 rounded-full border-4 border-slate-200 border-t-[#0B0F6B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 text-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Hero Content</h1>
            <p className="mt-2 text-sm text-slate-600">
              Manage the storefront hero copy, badges, and slider visuals.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Back to dashboard
            </Link>
            {heroId && (
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
              >
                Delete Hero
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-[24px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-8"
        >
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Core Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Badge Text
                </label>
                <input
                  type="text"
                  value={formData.badgeText}
                  onChange={(e) => handleInputChange("badgeText", e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="Premium Fabrics - Timeless Style"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Headline Prefix
                </label>
                <input
                  type="text"
                  value={formData.headlinePrefix}
                  onChange={(e) =>
                    handleInputChange("headlinePrefix", e.target.value)
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="Vastra That"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                placeholder="Short hero description"
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Headline Lines
            </h2>
            <div className="space-y-3">
              {formData.headlineLines.map((line, index) => (
                <div
                  key={`headline-${index}`}
                  className="grid grid-cols-1 md:grid-cols-[1.6fr_0.6fr_auto] gap-3 items-end rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-2">
                      Text
                    </label>
                    <input
                      type="text"
                      value={line.text}
                      onChange={(e) =>
                        handleHeadlineChange(index, "text", e.target.value)
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                      placeholder="Suits You."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-2">
                      Color
                    </label>
                    <input
                      type="text"
                      value={line.color || ""}
                      onChange={(e) =>
                        handleHeadlineChange(index, "color", e.target.value)
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                      placeholder="#D4AF37"
                    />
                  </div>
                  <div className="flex gap-2">
                    {formData.headlineLines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeHeadlineLine(index)}
                        className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addHeadlineLine}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Add Headline Line
            </button>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">CTA + Price</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Starting Price
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.startingPrice}
                  onChange={(e) =>
                    handleInputChange(
                      "startingPrice",
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  CTA Label
                </label>
                <input
                  type="text"
                  value={formData.ctaLabel}
                  onChange={(e) => handleInputChange("ctaLabel", e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="Shop Now"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  CTA Href
                </label>
                <input
                  type="text"
                  value={formData.ctaHref}
                  onChange={(e) => handleInputChange("ctaHref", e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="/shop"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Trust Items
            </h2>
            <div className="space-y-3">
              {formData.trustItems.map((item, index) => (
                <div
                  key={`trust-${index}`}
                  className="grid grid-cols-1 md:grid-cols-[1.2fr_0.6fr_auto] gap-3 items-end rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-2">
                      Label
                    </label>
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) =>
                        handleTrustItemChange(index, "label", e.target.value)
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                      placeholder="Free Shipping"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-2">
                      Icon
                    </label>
                    <select
                      value={item.icon}
                      onChange={(e) =>
                        handleTrustItemChange(index, "icon", e.target.value)
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="Truck">Truck</option>
                      <option value="ShieldCheck">ShieldCheck</option>
                      <option value="Leaf">Leaf</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    {formData.trustItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTrustItem(index)}
                        className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addTrustItem}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Add Trust Item
            </button>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Slider Images
            </h2>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50/70">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="hero-slider-images"
              />
              <label
                htmlFor="hero-slider-images"
                className="cursor-pointer flex flex-col items-center"
              >
                <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                  +
                </div>
                <p className="mt-3 text-sm font-medium text-slate-700">
                  Upload slider images
                </p>
                <p className="text-xs text-slate-500">PNG or JPG up to 10MB</p>
              </label>
            </div>

            {imageFiles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">
                  New Images ({imageFiles.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imageFiles.map((imageFile) => (
                    <div key={imageFile.preview} className="relative group">
                      <img
                        src={imageFile.preview}
                        alt="New slider preview"
                        className="w-full h-28 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(imageFile.preview)}
                        className="absolute top-2 right-2 rounded-full bg-rose-600 text-white w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {existingImages.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">
                  Current Images ({existingImages.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingImages.map((imageUrl, index) => (
                    <div key={imageUrl} className="relative group">
                      <Image
                        src={imageUrl}
                        alt="Current slider image"
                        width={240}
                        height={180}
                        className="w-full h-28 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute top-2 right-2 rounded-full bg-rose-600 text-white w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Status</h2>
            <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleInputChange("isActive", e.target.checked)}
                className="rounded border-slate-300 text-slate-800 focus:ring-slate-500"
              />
              Hero is active
            </label>
          </section>

          <div className="flex flex-wrap justify-end gap-4 border-t border-slate-200 pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#7A3511] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#5A260F] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "Save Hero"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

