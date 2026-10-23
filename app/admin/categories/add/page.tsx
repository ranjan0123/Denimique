"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import Image from "@/components/ui/AppImage";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/api";
import { buildCatalogFormData, getCatalogImage } from "@/lib/storefront";
import type { MainCategory } from "@/lib/catalog";

interface CategoryForm {
  mainCategory: string;
  name: string;
  description: string;
  image: string;
}

export default function AddCategoryPage() {
  const { checkAuth } = useAuthStore();
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const router = useRouter();

  const [formData, setFormData] = useState<CategoryForm>({
    mainCategory: "",
    name: "",
    description: "",
    image: "",
  });

  const fetchMainCategories = async () => {
    try {
      const response = await api.get("/main-categories");
      setMainCategories(response.data.mainCategories || response.data);
    } catch (error) {
      console.error("Error fetching main categories:", error);
      toast.error("Failed to load main categories");
    }
  };

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
        await fetchMainCategories();
        setIsLoading(false);
      }, 100);
    };

    verifyAuth();
  }, [checkAuth, router]);

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

      await api.post("/categories", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Category added successfully");
      router.push("/admin/categories");
    } catch (error: unknown) {
      console.error("Error adding category:", error);
      toast.error(getApiErrorMessage(error, "Failed to add category"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 text-black">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">Add New Category</h1>
          <p className="mt-2 text-black">Create a new product category</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-lg p-6 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Main Category *
            </label>
            <select
              required
              value={formData.mainCategory}
              onChange={(e) => handleInputChange("mainCategory", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select Main Category</option>
              {mainCategories.map((mainCategory) => (
                <option key={mainCategory._id} value={mainCategory._id}>
                  {mainCategory.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter category name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Optional description of the category"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Image URL
            </label>
            <input
              type="text"
              value={formData.image}
              onChange={(e) => handleInputChange("image", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Optional image URL"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Upload Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageFileChange(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {(imagePreview || formData.image) && (
              <div className="mt-3">
                <Image
                  src={imagePreview || getCatalogImage(formData, "")}
                  alt="Category preview"
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
              href="/admin/categories"
              className="px-4 py-2 border border-gray-300 rounded-md text-black hover:bg-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Adding Category..." : "Add Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


