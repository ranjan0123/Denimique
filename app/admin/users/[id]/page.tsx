"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "@/components/ui/AppImage";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Heart,
  Users,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage, resolveApiAssetUrl } from "@/lib/api";
import { formatStatusLabel } from "@/lib/commerce";
import { getAdminUserOverview } from "@/lib/admin";
import type { AdminUserOverview } from "@/types/admin";
import type { CartApiItem, WishlistApiItem } from "@/types/commerce";

const TABS = ["Profile", "Addresses", "Cart", "Wishlist", "Orders"] as const;
type TabKey = (typeof TABS)[number];

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const getCartItemName = (item: CartApiItem) =>
  item.name || item.product?.name || "Product";

const getCartItemImage = (item: CartApiItem) => {
  const rawImage =
    item.image || item.productImage || item.product?.image || item.product?.images?.[0];
  const image = typeof rawImage === "string" ? rawImage : rawImage?.src || rawImage?.url;
  const resolved = resolveApiAssetUrl(image);
  return resolved || "./Suitable_logo__1_-removebg-preview.png";
};

const getWishlistItemName = (item: WishlistApiItem) =>
  item.name || item.product?.name || "Product";

const getWishlistItemImage = (item: WishlistApiItem) => {
  const resolved = resolveApiAssetUrl(
    item.image || item.product?.image || item.product?.images?.[0],
  );
  return resolved || "./Suitable_logo__1_-removebg-preview.png";
};

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const { hasInitialized, checkAuth } = useAuthStore();
  const [overview, setOverview] = useState<AdminUserOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("Profile");
  const [ordersPage, setOrdersPage] = useState(1);
  const [cartPage, setCartPage] = useState(1);
  const [wishlistPage, setWishlistPage] = useState(1);
  const ordersLimit = 5;
  const cartLimit = 5;
  const wishlistLimit = 6;

  useEffect(() => {
    if (!hasInitialized) return;
    if (!userId) return;
    let isActive = true;

    const loadOverview = async () => {
      setIsLoading(true);
      setError(null);

      const isAuthenticated = await checkAuth();
      const currentUser = useAuthStore.getState().user;

      if (!isAuthenticated) {
        router.replace("/login");
        return;
      }

      if (!currentUser || currentUser.role !== "superadmin") {
        if (isActive) {
          setAccessDenied(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        const data = await getAdminUserOverview(userId, {
          ordersPage,
          ordersLimit,
          cartPage,
          cartLimit,
          wishlistPage,
          wishlistLimit,
        });
        if (!isActive) return;
        setOverview(data);
        setAccessDenied(false);
      } catch (err) {
        if (!isActive) return;
        const message = getApiErrorMessage(err, "Unable to load user overview.");
        setError(message);
        if (message.toLowerCase().includes("super admin")) {
          setAccessDenied(true);
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadOverview();
    return () => {
      isActive = false;
    };
  }, [
    cartPage,
    checkAuth,
    hasInitialized,
    ordersPage,
    router,
    userId,
    wishlistPage,
  ]);

  const summaryCards = useMemo(() => {
    if (!overview) return [];
    return [
      {
        label: "Total Orders",
        value: overview.summary.totalOrders,
        icon: ShoppingBag,
        tone: "bg-amber-50 text-black border-amber-200",
      },
      {
        label: "Total Spent",
        value: `Rs. ${overview.summary.totalSpent}`,
        icon: ShoppingCart,
        tone: "bg-emerald-50 text-black border-emerald-200",
      },
      {
        label: "Cart Items",
        value: overview.summary.cartItems,
        icon: ShoppingCart,
        tone: "bg-sky-50 text-black border-sky-200",
      },
      {
        label: "Wishlist Items",
        value: overview.summary.wishlistItems,
        icon: Heart,
        tone: "bg-rose-50 text-black border-rose-200",
      },
    ];
  }, [overview]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-24 w-24 rounded-full border-4 border-slate-200 border-t-[#0B0F6B] animate-spin" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-black">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-black">
            Super admin access only
          </h1>
          <p className="mt-2 text-sm text-black">
            You don&apos;t have permission to view this user. Please contact the
            primary administrator if you need access.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-xl bg-[#0B0F6B] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-black">
            <Users className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-black">
            User data unavailable
          </h1>
          <p className="mt-2 text-sm text-black">{error || "Try again later."}</p>
          <button
            onClick={() => router.push("/admin/users")}
            className="mt-6 rounded-xl bg-[#0B0F6B] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  const { user, cart, wishlist, orders } = overview;

  return (
    <div className="min-h-screen bg-white py-8 text-black">
      <div className="w-full px-4 sm:px-6 lg:px-10 space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                href="/admin/users"
                className="inline-flex items-center gap-2 text-sm font-semibold text-black hover:text-black"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Users
              </Link>
              <h1 className="mt-4 text-3xl font-semibold text-black">
                {user.name || "User Overview"}
              </h1>
              <p className="mt-2 text-sm text-black">
                {user.email} • {user.role}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {summaryCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className="min-w-[160px] rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black">
                        {card.label}
                      </p>
                      <span className={`inline-flex rounded-2xl border p-2 ${card.tone}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-black">
                      {card.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap gap-2 border-b border-slate-100 px-6 py-4">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab
                    ? "bg-[#0B0F6B] text-white"
                    : "bg-slate-50 text-black hover:bg-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {activeTab === "Profile" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-black">
                    Name
                  </p>
                  <p className="mt-2 text-lg font-semibold text-black">
                    {user.name || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-black">
                    Email
                  </p>
                  <p className="mt-2 text-lg font-semibold text-black">
                    {user.email || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-black">
                    Role
                  </p>
                  <p className="mt-2 text-lg font-semibold text-black">
                    {user.role}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-black">
                    Phone
                  </p>
                  <p className="mt-2 text-lg font-semibold text-black">
                    {user.phone || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-black">
                    Created At
                  </p>
                  <p className="mt-2 text-lg font-semibold text-black">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
            )}

            {activeTab === "Addresses" && (
              <div className="grid gap-4 md:grid-cols-2">
                {(user.addresses || []).length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-black md:col-span-2">
                    No addresses available.
                  </div>
                )}
                {(user.addresses || []).map((address) => (
                  <div
                    key={address._id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-black">
                        {address.label}
                      </p>
                      {address.isDefault && (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-black">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-black">
                      {address.fullName} • {address.phone}
                    </p>
                    <p className="mt-2 text-sm text-black">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                    </p>
                    <p className="text-sm text-black">
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                    <p className="text-sm text-black">{address.country}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "Cart" && (
              <div className="space-y-4">
                {cart.items.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-black">
                    No items in cart.
                  </div>
                )}

                {cart.items.map((item) => (
                  <div
                    key={item._id || item.productId || item.id}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
                  >
                    <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                      <Image
                        src={getCartItemImage(item)}
                        alt={getCartItemName(item)}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-black">
                        {getCartItemName(item)}
                      </p>
                      <p className="mt-1 text-xs text-black">
                        Qty: {item.quantity || 0} • Price: Rs.{" "}
                        {item.unitPrice ?? item.price ?? 0}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-black">
                      Rs. {item.lineTotal ?? (item.unitPrice ?? 0) * (item.quantity ?? 0)}
                    </div>
                  </div>
                ))}

                <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-black">
                    Subtotal: Rs. {cart.subtotal}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setCartPage((prev) => Math.max(1, prev - 1))}
                      disabled={cart.pagination.page <= 1}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCartPage((prev) => prev + 1)}
                      disabled={cart.pagination.page >= cart.pagination.totalPages}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Wishlist" && (
              <div className="space-y-4">
                {wishlist.items.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-black">
                    No items in wishlist.
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  {wishlist.items.map((item) => (
                    <div
                      key={item._id || item.productId || item.id}
                      className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                        <Image
                          src={getWishlistItemImage(item)}
                          alt={getWishlistItemName(item)}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-black">
                          {getWishlistItemName(item)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => setWishlistPage((prev) => Math.max(1, prev - 1))}
                    disabled={wishlist.pagination.page <= 1}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setWishlistPage((prev) => prev + 1)}
                    disabled={wishlist.pagination.page >= wishlist.pagination.totalPages}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {activeTab === "Orders" && (
              <div className="space-y-4">
                {orders.items.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-black">
                    No orders found.
                  </div>
                )}

                <div className="space-y-3">
                  {orders.items.map((order) => (
                    <div
                      key={order._id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-black">
                            {order.orderNumber || order._id}
                          </p>
                          <p className="mt-1 text-xs text-black">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-black">
                            Rs. {order.total}
                          </span>
                          <span className="rounded-full bg-amber-50 px-3 py-1.5 font-semibold text-black">
                            {formatStatusLabel(order.orderStatus)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => setOrdersPage((prev) => Math.max(1, prev - 1))}
                    disabled={orders.pagination.page <= 1}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setOrdersPage((prev) => prev + 1)}
                    disabled={orders.pagination.page >= orders.pagination.totalPages}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
