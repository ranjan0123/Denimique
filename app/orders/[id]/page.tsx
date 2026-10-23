"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "@/components/ui/AppImage";
import { useAuthStore } from "@/store/authStore";
import { getOrderById } from "@/lib/commerce";
import { getApiErrorMessage } from "@/lib/api";
import {
  formatStatusLabel,
  getOrderStatusTone,
  getPaymentStatusTone,
} from "@/lib/commerce";
import type { Order } from "@/types/commerce";
import PushOptInPrompt from "@/components/orders/PushOptInPrompt";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasInitialized, checkAuth } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasInitialized) return;

    let isMounted = true;

    const loadOrder = async () => {
      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) {
        router.replace("/login");
        return;
      }

      try {
        const nextOrder = await getOrderById(params.id as string);
        if (!isMounted) return;
        setOrder(nextOrder);
      } catch (loadError) {
        if (!isMounted) return;
        setError(
          getApiErrorMessage(loadError, "Unable to load this order right now."),
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [checkAuth, hasInitialized, params.id, router]);

  const refreshOrder = async () => {
    const nextOrder = await getOrderById(params.id as string);
    setOrder(nextOrder);
    return nextOrder;
  };

  // Keeps the page in sync while admin updates the order status elsewhere.
  useEffect(() => {
    if (!order) return;
    if (["delivered", "cancelled"].includes(order.orderStatus)) return;

    const intervalId = setInterval(async () => {
      try {
        await refreshOrder();
      } catch {
        // Silent polling failure to avoid noisy UX.
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [order?._id, order?.orderStatus]);

  if (!hasInitialized || isLoading) {
    return <div className="max-w-6xl mx-auto px-6 py-16">Loading order...</div>;
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-black">Order Details</h1>
        <p className="mt-4 text-black">{error || "Order not found."}</p>
      </div>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-16 text-black">
      {searchParams.get("placed") === "1" && (
        <>
          <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-black">
            Order placed successfully. Your order number is{" "}
            <span className="font-semibold">{order.orderNumber}</span>.
          </div>
          <PushOptInPrompt />
        </>
      )}

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-black">
            Order Number
          </p>
          <h1 className="mt-2 text-4xl font-bold text-black">
            {order.orderNumber}
          </h1>
          <p className="mt-3 text-black">
            {order.createdAt
              ? new Date(order.createdAt).toLocaleString()
              : "Recently placed"}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
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

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-black">Items</h2>
          <div className="mt-6 space-y-5">
            {order.items.map((item) => (
              <div
                key={`${item.productId}:${item.variantId || "default"}`}
                className="flex items-center gap-4 border-b border-gray-200 pb-5"
              >
                <Image
                  src={item.image || "/logo-removebg-preview.png"}
                  alt={item.name}
                  width={88}
                  height={88}
                  className="h-[88px] w-[88px] rounded-xl object-cover"
                />
                <div className="flex-1">
                  <p className="font-semibold text-black">{item.name}</p>
                  {item.variantLabel && (
                    <p className="text-sm text-black">{item.variantLabel}</p>
                  )}
                  <p className="text-sm text-black">
                    Qty {item.quantity} x Rs. {item.unitPrice}
                  </p>
                </div>
                <p className="font-semibold text-black">
                  Rs. {item.lineTotal}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-[#FFF8EE] p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-black">Summary</h2>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between text-black">
                <span>Subtotal</span>
                <span>Rs. {order.subtotal}</span>
              </div>
              <div className="flex justify-between text-black">
                <span>Discount</span>
                <span className="text-black">- Rs. {order.discount}</span>
              </div>
              <div className="flex justify-between text-black">
                <span>Shipping Fee</span>
                <span>Rs. {order.shippingFee}</span>
              </div>
              {order.promoCode && (
                <div className="flex justify-between text-black">
                  <span>Promo Code</span>
                  <span>{order.promoCode}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-black">
                <span>Total</span>
                <span>Rs. {order.total}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-black">
              Shipping Address
            </h2>
            <div className="mt-4 space-y-2 text-sm text-black">
              <p className="font-semibold text-black">
                {order.shippingAddress.fullName}
              </p>
              <p>{order.shippingAddress.email}</p>
              <p>{order.shippingAddress.phone}</p>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>
        </div>
      </div>

      <Link
        href="/orders"
        className="inline-flex mt-8 rounded-xl border border-gray-300 px-5 py-3 text-black hover:bg-gray-50"
      >
        Back to My Orders
      </Link>
    </section>
  );
}
