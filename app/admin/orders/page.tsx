"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { getAdminOrders, updateOrderStatus } from "@/lib/commerce";
import { getApiErrorMessage } from "@/lib/api";
import type { Order } from "@/types/commerce";

const ORDER_STATUSES = [
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded", "cod_pending"];

export default function AdminOrdersPage() {
  const router = useRouter();
  const { hasInitialized, checkAuth } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!hasInitialized) return;

    let isMounted = true;

    const loadOrders = async () => {
      const isAuthenticated = await checkAuth();
      const currentUser = useAuthStore.getState().user;
      if (!isAuthenticated || !['admin', 'superadmin'].includes(currentUser?.role || "")) {
        router.replace("/login");
        return;
      }

      try {
        const nextOrders = await getAdminOrders();
        if (!isMounted) return;
        setOrders(nextOrders);
      } catch (error: unknown) {
        if (!isMounted) return;
        toast.error(getApiErrorMessage(error, "Unable to load orders."));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadOrders();

    const intervalId = setInterval(async () => {
      try {
        const nextOrders = await getAdminOrders();
        if (!isMounted) return;
        setOrders(nextOrders);
      } catch {
        // Silent polling failure to avoid toast spam.
      }
    }, 30000);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [checkAuth, hasInitialized, router]);

  const handleStatusChange = (
    id: string,
    field: "orderStatus" | "paymentStatus",
    value: string,
  ) => {
    setOrders((current) =>
      current.map((order) =>
        order._id === id ? { ...order, [field]: value } : order,
      ),
    );
  };

  const handleSave = async (order: Order) => {
    setIsSaving(order._id);
    try {
      const updated = await updateOrderStatus(order._id, {
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
      });
      setOrders((current) =>
        current.map((item) => (item._id === order._id ? updated : item)),
      );
      toast.success(`Updated ${order.orderNumber}`);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to update order status."));
    } finally {
      setIsSaving(null);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white py-8 text-black">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">Orders Management</h1>
          <p className="mt-2 text-black">
            Review customer orders and update payment or fulfillment state.
          </p>
        </div>

        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                <div className="space-y-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-black">
                      Order Number
                    </p>
                    <h2 className="text-xl font-semibold text-black">
                      {order.orderNumber}
                    </h2>
                  </div>
                  <div className="text-sm text-black">
                    <p>{order.user?.name || order.shippingAddress.fullName}</p>
                    <p>{order.user?.email || order.shippingAddress.email}</p>
                  </div>
                  <div className="text-sm text-black">
                    <p>{order.items.length} items</p>
                    <p>Promo: {order.promoCode || "None"}</p>
                    <p>Total: Rs. {order.total}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[180px_180px_120px]">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-[0.16em] text-black mb-2">
                      Order Status
                    </label>
                    <select
                      value={order.orderStatus}
                      onChange={(e) =>
                        handleStatusChange(order._id, "orderStatus", e.target.value)
                      }
                      className="w-full rounded-xl border border-gray-300 px-3 py-2"
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-[0.16em] text-black mb-2">
                      Payment Status
                    </label>
                    <select
                      value={order.paymentStatus}
                      onChange={(e) =>
                        handleStatusChange(order._id, "paymentStatus", e.target.value)
                      }
                      className="w-full rounded-xl border border-gray-300 px-3 py-2"
                    >
                      {PAYMENT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => handleSave(order)}
                      disabled={isSaving === order._id}
                      className="w-full rounded-xl bg-[#1B2E27] px-4 py-2 text-white disabled:opacity-50"
                    >
                      {isSaving === order._id ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-black">
              No orders yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
