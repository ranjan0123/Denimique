"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { deletePromoCode, getPromoCodes } from "@/lib/commerce";
import { getApiErrorMessage } from "@/lib/api";
import type { PromoCode } from "@/types/commerce";

export default function AdminPromoCodesPage() {
  const router = useRouter();
  const { hasInitialized, checkAuth } = useAuthStore();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!hasInitialized) return;

    const loadPromoCodes = async () => {
      const isAuthenticated = await checkAuth();
      const currentUser = useAuthStore.getState().user;
      if (!isAuthenticated || !['admin', 'superadmin'].includes(currentUser?.role || "")) {
        router.replace("/login");
        return;
      }

      try {
        const data = await getPromoCodes();
        setPromoCodes(data);
      } catch (error: unknown) {
        toast.error(
          getApiErrorMessage(error, "Unable to load promo codes right now."),
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadPromoCodes();
  }, [checkAuth, hasInitialized, router]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promo code?")) return;
    setIsDeleting(id);
    try {
      await deletePromoCode(id);
      setPromoCodes((current) => current.filter((promoCode) => promoCode._id !== id));
      toast.success("Promo code deleted");
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(error, "Unable to delete promo code right now."),
      );
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white py-8 text-black">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black">
              Promo Codes Management
            </h1>
            <p className="mt-2 text-black">
              Create and maintain discount rules for checkout.
            </p>
          </div>
          <Link
            href="/admin/promocodes/add"
            className="inline-flex items-center px-4 py-2 bg-[#1B2E27] text-white rounded-md hover:bg-[#5A260F] transition-colors"
          >
            Add Promo Code
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Limits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {promoCodes.map((promoCode) => (
                  <tr key={promoCode._id} className="hover:bg-white">
                    <td className="px-6 py-4">
                      <div className="font-medium text-black">{promoCode.code}</div>
                      <div className="text-sm text-black">
                        {promoCode.description || "No description"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {promoCode.type}
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {promoCode.type === "percentage"
                        ? `${promoCode.value}%`
                        : `Rs. ${promoCode.value}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      <div>Min order: Rs. {promoCode.minOrderAmount || 0}</div>
                      <div>Per user: {promoCode.perUserLimit || "-"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          promoCode.isActive
                            ? "bg-green-100 text-black"
                            : "bg-gray-100 text-black"
                        }`}
                      >
                        {promoCode.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex gap-3">
                        <Link
                          href={`/admin/promocodes/edit/${promoCode._id}`}
                          className="text-black hover:text-black"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(promoCode._id)}
                          disabled={isDeleting === promoCode._id}
                          className="text-black hover:text-black disabled:opacity-50"
                        >
                          {isDeleting === promoCode._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {promoCodes.length === 0 && (
            <div className="text-center py-12 text-black">
              No promo codes created yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


