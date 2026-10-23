"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage } from "@/lib/api";
import { getCategories, getProducts } from "@/lib/storefront";
import {
  createPromoCode,
  getPromoCodeById,
  updatePromoCode,
} from "@/lib/commerce";
import type { Category } from "@/lib/catalog";
import type { Product } from "@/types/product";
import type { PromoCodeForm } from "@/types/commerce";

const emptyForm: PromoCodeForm = {
  code: "",
  description: "",
  type: "percentage",
  value: 0,
  minOrderAmount: 0,
  maxDiscount: 0,
  usageLimit: 0,
  perUserLimit: 0,
  startsAt: "",
  expiresAt: "",
  isActive: true,
  applicableProducts: [],
  applicableCategories: [],
  excludedProducts: [],
};

const toDateTimeLocal = (value?: string) =>
  value ? new Date(value).toISOString().slice(0, 16) : "";

export default function PromoCodeEditor({ mode }: { mode: "create" | "edit" }) {
  const router = useRouter();
  const params = useParams();
  const { hasInitialized, checkAuth } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<PromoCodeForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = mode === "edit";
  const promoCodeId = params.id as string | undefined;

  useEffect(() => {
    if (!hasInitialized) return;

    const loadData = async () => {
      const isAuthenticated = await checkAuth();
      const currentUser = useAuthStore.getState().user;
      if (
        !isAuthenticated ||
        !["admin", "superadmin"].includes(currentUser?.role || "")
      ) {
        router.replace("/login");
        return;
      }

      try {
        const [categoryData, productData] = await Promise.all([
          getCategories(),
          getProducts({ limit: 1000 }),
        ]);

        setCategories(categoryData);
        setProducts(productData);

        if (isEdit && promoCodeId) {
          const promoCode = await getPromoCodeById(promoCodeId);
          setFormData({
            code: promoCode.code,
            description: promoCode.description || "",
            type: promoCode.type,
            value: promoCode.value,
            minOrderAmount: promoCode.minOrderAmount || 0,
            maxDiscount: promoCode.maxDiscount || 0,
            usageLimit: promoCode.usageLimit || 0,
            perUserLimit: promoCode.perUserLimit || 0,
            startsAt: toDateTimeLocal(promoCode.startsAt),
            expiresAt: toDateTimeLocal(promoCode.expiresAt),
            isActive: promoCode.isActive,
            applicableProducts: promoCode.applicableProducts,
            applicableCategories: promoCode.applicableCategories,
            excludedProducts: promoCode.excludedProducts,
          });
        }
      } catch (error: unknown) {
        toast.error(
          getApiErrorMessage(error, "Unable to load promo code editor."),
        );
        router.replace("/admin/promocodes");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [checkAuth, hasInitialized, isEdit, promoCodeId, router]);

  const groupedProducts = useMemo(() => products.slice(0, 24), [products]);

  const handleArrayToggle = (
    field: "applicableProducts" | "applicableCategories" | "excludedProducts",
    value: string,
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value],
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEdit && promoCodeId) {
        await updatePromoCode(promoCodeId, formData);
        toast.success("Promo code updated successfully");
      } else {
        await createPromoCode(formData);
        toast.success("Promo code created successfully");
      }

      router.push("/admin/promocodes");
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(error, "Unable to save promo code right now."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-24 w-24 rounded-full border-4 border-slate-200 border-t-[#0B0F6B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 text-black">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">
            {isEdit ? "Edit Promo Code" : "Add Promo Code"}
          </h1>
          <p className="mt-2 text-black">
            Manage discount rules, limits, and applicability.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-lg p-6 space-y-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Promo Code *
              </label>
              <input
                required
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData((current) => ({
                    ...current,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData((current) => ({
                    ...current,
                    type: e.target.value as PromoCodeForm["type"],
                  }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>

            {[
              ["value", "Value *"],
              ["minOrderAmount", "Minimum Order Amount"],
              ["maxDiscount", "Maximum Discount"],
              ["usageLimit", "Usage Limit"],
              ["perUserLimit", "Per User Limit"],
            ].map(([field, label]) => (
              <div key={field}>
                <label className="block text-sm font-medium text-black mb-2">
                  {label}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData[field as keyof PromoCodeForm] as number}
                  onChange={(e) =>
                    setFormData((current) => ({
                      ...current,
                      [field]: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Starts At
              </label>
              <input
                type="datetime-local"
                value={formData.startsAt}
                onChange={(e) =>
                  setFormData((current) => ({
                    ...current,
                    startsAt: e.target.value,
                  }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Expires At
              </label>
              <input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) =>
                  setFormData((current) => ({
                    ...current,
                    expiresAt: e.target.value,
                  }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData((current) => ({
                  ...current,
                  description: e.target.value,
                }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <label className="inline-flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData((current) => ({
                  ...current,
                  isActive: e.target.checked,
                }))
              }
            />
            <span className="text-sm font-medium text-black">Active</span>
          </label>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-200 p-4">
              <h2 className="font-semibold text-black mb-3">
                Applicable Categories
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {categories.map((category) => (
                  <label
                    key={category._id}
                    className="flex items-center gap-2 text-sm text-black"
                  >
                    <input
                      type="checkbox"
                      checked={formData.applicableCategories.includes(category._id)}
                      onChange={() =>
                        handleArrayToggle("applicableCategories", category._id)
                      }
                    />
                    <span>{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <h2 className="font-semibold text-black mb-3">
                Applicable Products
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {groupedProducts.map((product) => (
                  <label
                    key={product.id}
                    className="flex items-center gap-2 text-sm text-black"
                  >
                    <input
                      type="checkbox"
                      checked={formData.applicableProducts.includes(product._id || product.id)}
                      onChange={() =>
                        handleArrayToggle(
                          "applicableProducts",
                          product._id || product.id,
                        )
                      }
                    />
                    <span>{product.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <h2 className="font-semibold text-black mb-3">
                Excluded Products
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {groupedProducts.map((product) => (
                  <label
                    key={`excluded-${product.id}`}
                    className="flex items-center gap-2 text-sm text-black"
                  >
                    <input
                      type="checkbox"
                      checked={formData.excludedProducts.includes(product._id || product.id)}
                      onChange={() =>
                        handleArrayToggle(
                          "excludedProducts",
                          product._id || product.id,
                        )
                      }
                    />
                    <span>{product.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 border-t pt-6">
            <Link
              href="/admin/promocodes"
              className="rounded-md border border-gray-300 px-4 py-2 text-black hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isSubmitting
                ? isEdit
                  ? "Updating..."
                  : "Creating..."
                : isEdit
                  ? "Update Promo Code"
                  : "Create Promo Code"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

