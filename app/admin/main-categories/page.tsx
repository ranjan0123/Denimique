"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import Image from "@/components/ui/AppImage";
import api from "@/lib/api";
import toast from "react-hot-toast";
import type { MainCategory } from "@/lib/catalog";
import { getCatalogImage } from "@/lib/storefront";

export default function AdminMainCategoriesPage() {
  const { checkAuth } = useAuthStore();
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
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

      setTimeout(() => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser || !['admin', 'superadmin'].includes(currentUser.role || "")) {
          router.push("/");
          return;
        }
        fetchMainCategories();
      }, 100);
    };

    verifyAuth();
  }, [checkAuth, router]);

  const handleDelete = async (mainCategoryId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this main category? This may affect linked categories.",
      )
    ) {
      return;
    }

    setIsDeleting(mainCategoryId);
    try {
      await api.delete(`/main-categories/${mainCategoryId}`);
      setMainCategories((prev) =>
        prev.filter((mainCategory) => mainCategory._id !== mainCategoryId),
      );
      toast.success("Main category deleted successfully");
    } catch (error) {
      console.error("Error deleting main category:", error);
      toast.error("Failed to delete main category");
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 text-gray-800">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Main Categories Management
            </h1>
            <p className="mt-2 text-gray-600">
              Manage the top-level catalog hierarchy
            </p>
          </div>
          <Link
            href="/admin/main-categories/add"
            className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
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
            Add Main Category
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#FDFBF7]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Main Category Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mainCategories.map((mainCategory) => (
                  <tr key={mainCategory._id} className="hover:bg-[#FDFBF7]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {mainCategory.image ? (
                        <Image
                          src={getCatalogImage(mainCategory, "")}
                          alt={mainCategory.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400">
                          No image
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {mainCategory.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {mainCategory.slug}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {mainCategory.createdAt
                          ? new Date(mainCategory.createdAt).toLocaleDateString()
                          : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          href={`/admin/main-categories/edit/${mainCategory._id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(mainCategory._id)}
                          disabled={isDeleting === mainCategory._id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {isDeleting === mainCategory._id
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

          {mainCategories.length === 0 && (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No main categories
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding a new main category.
              </p>
              <div className="mt-6">
                <Link
                  href="/admin/main-categories/add"
                  className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
                >
                  Add Main Category
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
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

