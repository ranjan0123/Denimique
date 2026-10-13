"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, CreditCard, PackageCheck, ShoppingBag } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import type { Notification } from "@/types/notification";
import {
  formatNotificationTime,
  getNotificationOrderStatusDisplay,
  getNotificationOrderStatusTone,
  getNotificationPaymentStatusDisplay,
  getNotificationPaymentStatusTone,
} from "@/lib/notifications";

const getNotificationIcon = (notification: Notification) => {
  const key = `${notification.type || ""} ${notification.title || ""}`.toLowerCase();
  if (key.includes("payment")) return CreditCard;
  if (key.includes("placed")) return ShoppingBag;
  return PackageCheck;
};

export default function NotificationsPage() {
  const router = useRouter();
  const { hasInitialized, checkAuth } = useAuthStore();
  const {
    notifications,
    isLoading,
    error,
    hasFetched,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    if (!hasInitialized) return;

    const loadNotifications = async () => {
      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) {
        router.replace("/login");
        return;
      }

      await fetchNotifications();
    };

    loadNotifications();
  }, [checkAuth, fetchNotifications, hasInitialized, router]);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#FDFBF7] to-white">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-16 text-gray-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#7A3511]/10 text-[#7A3511]">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A3511]">
                Account
              </p>
              <h1 className="mt-1 text-2xl md:text-3xl font-bold text-[#4A230F]">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 align-middle rounded-full bg-[#7A3511] px-2.5 py-1 text-xs font-bold text-white">
                    {unreadCount} new
                  </span>
                )}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Track your latest order and payment updates.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => markAllAsRead()}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-2 self-start rounded-full border border-[#7A3511]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#7A3511] transition-colors hover:bg-[#7A3511]/5 disabled:cursor-not-allowed disabled:opacity-40 md:self-auto"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        </div>

        {isLoading && !hasFetched ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-3xl border border-[#F0E4D6] bg-white"
              />
            ))}
          </div>
        ) : error && notifications.length === 0 ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center">
            <p className="text-red-700">Unable to load notifications right now.</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#7A3511]/20 bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#7A3511]/10 text-[#7A3511]">
              <Bell className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-[#4A230F]">No notifications yet</h2>
            <p className="mt-2 text-gray-500">
              When your order is placed or updated, it will show up here.
            </p>
            <Link
              href="/shop"
              className="inline-flex mt-6 rounded-full bg-[#7A3511] px-6 py-3 font-semibold text-white shadow-[0_8px_20px_rgba(122,53,17,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#5A260F]"
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const orderStatus = getNotificationOrderStatusDisplay(notification);
              const paymentStatus = getNotificationPaymentStatusDisplay(notification);
              const Icon = getNotificationIcon(notification);

              return (
                <button
                  key={notification._id}
                  type="button"
                  onClick={async () => {
                    await markAsRead(notification._id);
                    if (notification.order?._id) {
                      router.push(`/orders/${notification.order._id}`);
                    }
                  }}
                  className={`group flex w-full items-start gap-4 rounded-3xl border p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(122,53,17,0.12)] ${
                    notification.isRead
                      ? "border-[#F0E4D6] bg-white"
                      : "border-[#7A3511]/25 bg-[#FFF8EE]"
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                      notification.isRead
                        ? "bg-[#7A3511]/8 text-[#7A3511]/70"
                        : "bg-[#7A3511] text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-[#4A230F] break-words">
                          {notification.title}
                        </h2>
                        {!notification.isRead && (
                          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#7A3511]" />
                        )}
                      </div>
                      <span className="flex-shrink-0 whitespace-nowrap text-xs text-gray-400">
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                    </div>

                    <p className="mt-1.5 text-sm text-gray-600 break-words">
                      {notification.message}
                    </p>

                    {notification.order?.orderNumber && (
                      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                        <span className="rounded-full border border-[#7A3511]/15 bg-white px-3 py-1.5 text-gray-700 break-all">
                          Order {notification.order.orderNumber}
                        </span>
                        {orderStatus && (
                          <span
                            className={`rounded-full px-3 py-1.5 whitespace-nowrap font-medium ${getNotificationOrderStatusTone(
                              notification,
                            )}`}
                          >
                            {orderStatus}
                          </span>
                        )}
                        {paymentStatus && (
                          <span
                            className={`rounded-full px-3 py-1.5 whitespace-nowrap font-medium ${getNotificationPaymentStatusTone(
                              notification,
                            )}`}
                          >
                            {paymentStatus}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
