"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { getMyOrders } from "@/lib/commerce";
import { getApiErrorMessage } from "@/lib/api";
import {
  formatStatusLabel,
  getOrderStatusTone,
  getPaymentStatusTone,
} from "@/lib/commerce";
import type { Order } from "@/types/commerce";
import { ArrowRightIcon } from "lucide-react";

export default function OrdersPage() {
  const router = useRouter();
  const { hasInitialized, checkAuth } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasInitialized) return;

    let isMounted = true;

    const loadOrders = async () => {
      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) {
        router.replace("/login");
        return;
      }

      try {
        setError(null);
        const data = await getMyOrders();
        if (!isMounted) return;
        setOrders(data);
      } catch (loadError) {
        if (!isMounted) return;
        setError(
          getApiErrorMessage(
            loadError,
            "Unable to load your orders right now.",
          ),
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadOrders();

    const intervalId = setInterval(async () => {
      try {
        const data = await getMyOrders();
        if (!isMounted) return;
        setOrders(data);
      } catch {
        // Silent polling failure to keep UX clean.
      }
    }, 30000);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [checkAuth, hasInitialized, router]);

  const summary = useMemo(() => {
    const delivered = orders.filter(
      (order) => order.orderStatus === "delivered",
    ).length;
    const inProgress = orders.filter((order) =>
      ["pending", "confirmed", "processing", "shipped"].includes(
        order.orderStatus,
      ),
    ).length;
    const needsPayment = orders.filter((order) =>
      ["pending", "failed", "cod_pending"].includes(order.paymentStatus),
    ).length;
    const totalSpent = orders.reduce(
      (total, order) => total + (Number(order.total) || 0),
      0,
    );

    return {
      delivered,
      inProgress,
      needsPayment,
      totalSpent,
    };
  }, [orders]);

  const formatRupees = (value: number | string | undefined) =>
    new Intl.NumberFormat("en-IN").format(Number(value) || 0);

  if (!hasInitialized || isLoading) {
    return (
      <div className="relative overflow-hidden bg-[#f6f2ea]">
        <div className="pointer-events-none absolute -top-32 right-10 h-72 w-72 rounded-full bg-[#1B2E27]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-8 h-72 w-72 rounded-full bg-[#4A230F]/15 blur-3xl" />
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="h-10 w-48 rounded-full bg-white/70 shadow-sm animate-pulse" />
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((card) => (
              <div
                key={card}
                className="h-24 rounded-2xl bg-white/70 shadow-sm animate-pulse"
              />
            ))}
          </div>
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((row) => (
              <div
                key={row}
                className="h-32 rounded-3xl bg-white/70 shadow-sm animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative overflow-hidden bg-[#f6f2ea]">
        <div className="pointer-events-none absolute -top-32 right-10 h-72 w-72 rounded-full bg-[#1B2E27]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-8 h-72 w-72 rounded-full bg-[#4A230F]/15 blur-3xl" />
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black">
            Orders
          </p>
          <h1 className="mt-3 text-3xl font-bold text-black">My Orders</h1>
          <p className="mt-4 text-black">{error}</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="relative overflow-hidden bg-[#f6f2ea]">
        <div className="pointer-events-none absolute -top-32 right-10 h-72 w-72 rounded-full bg-[#1B2E27]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-8 h-72 w-72 rounded-full bg-[#4A230F]/15 blur-3xl" />
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black">
            Orders
          </p>
          <h1 className="mt-3 text-3xl font-bold text-black">My Orders</h1>
          <p className="mt-4 text-black">
            You have not placed any orders yet.
          </p>
          <Link
            href="/shop"
            className="inline-flex mt-8 rounded-full bg-[#4A230F] px-6 py-3 text-white shadow-lg shadow-[#4A230F]/20 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden bg-[#f6f2ea] text-black">
      <div className="pointer-events-none absolute -top-40 right-20 h-96 w-96 rounded-full bg-[#1B2E27]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-10 h-96 w-96 rounded-full bg-[#4A230F]/15 blur-3xl" />
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black">
              Orders
            </p>
            <h1 className="mt-3 text-4xl md:text-5xl font-bold text-black">
              My Orders
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-black">
              Check order status, manage payments, and revisit your favorite
              items in one place.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-full border border-[#4A230F]/20 bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              Continue shopping
            </Link>
            <Link
              href="/notifications"
              className="inline-flex items-center justify-center rounded-full bg-[#4A230F] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#4A230F]/25 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Order updates
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-white/50 bg-white/80 p-5 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black">
              Total Orders
            </p>
            <p className="mt-4 text-3xl font-semibold text-black">
              {orders.length}
            </p>
            <p className="mt-2 text-sm text-black">Lifetime count</p>
          </div>
          <div className="rounded-3xl border border-white/50 bg-white/80 p-5 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black">
              In Progress
            </p>
            <p className="mt-4 text-3xl font-semibold text-black">
              {summary.inProgress}
            </p>
            <p className="mt-2 text-sm text-black">Packing to delivery</p>
          </div>
          <div className="rounded-3xl border border-white/50 bg-white/80 p-5 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black">
              Delivered
            </p>
            <p className="mt-4 text-3xl font-semibold text-black">
              {summary.delivered}
            </p>
            <p className="mt-2 text-sm text-black">Arrived at your door</p>
          </div>
          <div className="rounded-3xl border border-white/50 bg-white/80 p-5 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black">
              Total Spent
            </p>
            <p className="mt-4 text-3xl font-semibold text-black">
              Rs. {formatRupees(summary.totalSpent)}
            </p>
            <p className="mt-2 text-sm text-black">All-time purchases</p>
          </div>
        </div>

        {summary.needsPayment > 0 && (
          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50/70 p-5 text-sm text-black">
            <p className="font-semibold">
              Payment attention needed on {summary.needsPayment} order
              {summary.needsPayment > 1 ? "s" : ""}.
            </p>
            <p className="mt-1 text-black/80">
              Open the order to retry payment or confirm COD details.
            </p>
          </div>
        )}

        <div className="mt-10 space-y-5">
          {orders.map((order) => (
            <Link
              key={order._id}
              href={`/orders/${order._id}`}
              className="group block rounded-[28px] border border-white/60 bg-white/90 p-6 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black">
                    Order Number
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-black">
                    {order.orderNumber}
                  </h2>
                  <p className="mt-2 text-sm text-black">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "Recently placed"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs font-semibold">
                  <span
                    className={`rounded-full px-3 py-1.5 ${getOrderStatusTone(
                      order.orderStatus,
                    )}`}
                  >
                    {formatStatusLabel(order.orderStatus)}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1.5 ${getPaymentStatusTone(
                      order.paymentStatus,
                    )}`}
                  >
                    {formatStatusLabel(order.paymentStatus)}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1.5 text-black">
                    {order.paymentMethod.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3 text-sm text-black">
                <div>
                  <p className="font-semibold text-black">
                    {order.items.length} items
                  </p>
                  <p>
                    {order.items.length > 0
                      ? order.items
                          .map((item) => item.name)
                          .slice(0, 2)
                          .join(", ")
                      : "No items listed"}
                    {order.items.length > 2
                      ? ` +${order.items.length - 2} more`
                      : ""}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-black">Shipping to</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}
                  </p>
                </div>
                <div className="md:text-right">
                  <p className="font-semibold text-black">Total</p>
                  <p className="text-lg font-semibold text-black">
                    Rs. {formatRupees(order.total)}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-black">
                    View details
                    <ArrowRightIcon className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


