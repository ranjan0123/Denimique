"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import Image from "@/components/ui/AppImage";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/api";
import { buildCatalogFormData, getCatalogImage } from "@/lib/storefront";
import type { Category } from "@/lib/catalog";
import { getMainCategoryName } from "@/lib/catalog";

interface SubcategoryForm {
  name: string;
  description: string;
  category: string;
  image: string;
}

export default function EditSubcategoryPage() {
  const { checkAuth } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const router = useRouter();
  const params = useParams();
  const subcategoryId = params.id as string;

  const [formData, setFormData] = useState<SubcategoryForm>({
    name: "",
    description: "",
    category: "",
    image: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const [categoriesRes, subcategoryRes] = await Promise.all([
        api.get("/categories"),
        api.get(`/subcategories/${subcategoryId}`),
      ]);

      setCategories(categoriesRes.data.categories || categoriesRes.data);

      const subcategory =
        subcategoryRes.data.subcategory || subcategoryRes.data;
      setFormData({
        name: subcategory.name || "",
        description: subcategory.description || "",
        category: subcategory.category?._id || subcategory.category || "",
        image: subcategory.image || "",
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load subcategory data");
      router.push("/admin/subcategories");
    } finally {
      setIsLoading(false);
    }
  }, [router, subcategoryId]);

  useEffect(() => {
    const verifyAuth = async () => {
      const isAuth = await checkAuth();
      if (!isAuth) {
        router.push("/login");
        return;
      }

      // Wait a bit for the user state to update
      setTimeout(async () => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser || !['admin', 'superadmin'].includes(currentUser.role || "")) {
          router.push("/");
          return;
        }
        await fetchData();
      }, 100);
    };

    verifyAuth();
  }, [checkAuth, fetchData, router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageFileChange = (file: File | null) => {
    setImageFile(file);
    setImagePreview((currentPreview) => {
      if (currentPreview.startsWith("blob:")) {
        URL.revokeObjectURL(currentPreview);
      }
      return file ? URL.createObjectURL(file) : "";
    });
  };

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Generate slug from name
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const payload = buildCatalogFormData(
        { ...formData, slug },
        imageFile,
      );

      await api.put(`/subcategories/${subcategoryId}`, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Subcategory updated successfully");
      router.push("/admin/subcategories");
    } catch (error: unknown) {
      console.error("Error updating subcategory:", error);
      toast.error(getApiErrorMessage(error, "Failed to update subcategory"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 text-gray-800">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Subcategory</h1>
          <p className="mt-2 text-gray-600">Update subcategory information</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-lg p-6 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategory Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter subcategory name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => handleInputChange("category", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {getMainCategoryName(category)
                    ? `${getMainCategoryName(category)} / ${category.name}`
                    : category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Optional description of the subcategory"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <input
              type="text"
              value={formData.image}
              onChange={(e) => handleInputChange("image", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Optional image URL"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageFileChange(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {(imagePreview || formData.image) && (
              <div className="mt-3">
                <Image
                  src={imagePreview || getCatalogImage(formData, "")}
                  alt="Subcategory preview"
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-lg object-cover border border-gray-200"
                />
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Link
              href="/admin/subcategories"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-[#FDFBF7] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Updating Subcategory..." : "Update Subcategory"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

