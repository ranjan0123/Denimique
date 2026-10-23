"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import Image from "@/components/ui/AppImage";
import api from "@/lib/api";
import toast from "react-hot-toast";
import type { Category, MainCategory } from "@/lib/catalog";
import { getMainCategoryName } from "@/lib/catalog";
import { getCatalogImage } from "@/lib/storefront";

export default function AdminCategoriesPage() {
  const { checkAuth } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();

  const fetchMainCategories = async () => {
    try {
      const response = await api.get("/main-categories");
      setMainCategories(response.data.mainCategories || response.data);
    } catch (error) {
      console.error("Error fetching main categories:", error);
      toast.error("Failed to load main categories");
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/categories");
      setCategories(response.data.categories || response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
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

      // Wait a bit for the user state to update

      setTimeout(async () => {
        const currentUser = useAuthStore.getState().user;
        if (
          !currentUser ||
          !["admin", "superadmin"].includes(currentUser.role || "")
        ) {
          router.push("/");
          return;
        }
        await Promise.all([fetchCategories(), fetchMainCategories()]);
      }, 100);
    };

    verifyAuth();
  }, [checkAuth, router]);

  const handleDelete = async (categoryId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this category? This may affect products using this category.",
      )
    )
      return;

    setIsDeleting(categoryId);
    try {
      await api.delete(`/categories/${categoryId}`);
      setCategories(categories.filter((c) => c._id !== categoryId));
      toast.success("Category deleted successfully");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredCategories = selectedMainCategory
    ? categories.filter(
        (category) =>
          (typeof category.mainCategory === "string"
            ? category.mainCategory
            : category.mainCategory?._id) === selectedMainCategory,
      )
    : categories;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 text-black">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black">
              Categories Management
            </h1>
            <p className="mt-2 text-black">Manage product categories</p>
          </div>
          <Link
            href="/admin/categories/add"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add Category
          </Link>
        </div>

        <div className="mb-6 max-w-sm">
          <label className="block text-sm font-medium text-black mb-2">
            Filter by Main Category
          </label>
          <select
            value={selectedMainCategory}
            onChange={(e) => setSelectedMainCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Main Categories</option>
            {mainCategories.map((mainCategory) => (
              <option key={mainCategory._id} value={mainCategory._id}>
                {mainCategory.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Main Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Category Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCategories.map((category) => (
                  <tr key={category._id} className="hover:bg-white">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {category.image ? (
                        <Image
                          src={getCatalogImage(category, "")}
                          alt={category.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-black">
                          No image
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-black">
                        {getMainCategoryName(category) || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-black">
                        {category.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-black">
                        {category.slug}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-black">
                        {category.createdAt
                          ? new Date(category.createdAt).toLocaleDateString()
                          : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          href={`/admin/categories/edit/${category._id}`}
                          className="text-black hover:text-black"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(category._id)}
                          disabled={isDeleting === category._id}
                          className="text-black hover:text-black disabled:opacity-50"
                        >
                          {isDeleting === category._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-black">
                No categories found
              </h3>
              <p className="mt-1 text-sm text-black">
                {selectedMainCategory
                  ? "No categories match the selected main category."
                  : "Get started by adding a new category."}
              </p>
              <div className="mt-6">
                <Link
                  href="/admin/categories/add"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Add Category
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-black hover:text-black"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
