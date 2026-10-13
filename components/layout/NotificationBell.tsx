"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, BellRing, CheckCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import {
  formatNotificationTime,
  getNotificationOrderStatusDisplay,
  getNotificationOrderStatusTone,
  getNotificationPaymentStatusDisplay,
  getNotificationPaymentStatusTone,
} from "@/lib/notifications";
import {
  getExistingPushSubscription,
  getPushPermission,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push";

const badgeLabel = (count: number) => {
  if (count > 9) return "9+";
  return String(count);
};

export default function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [isPushBusy, setIsPushBusy] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { isAuthenticated } = useAuthStore();
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    hasFetched,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    reset,
  } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated) {
      reset();
      return;
    }

    fetchUnreadCount();

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount();
      }
    }, 60000);

    return () => window.clearInterval(interval);
  }, [fetchUnreadCount, isAuthenticated, reset]);

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;
    fetchNotifications({ silent: hasFetched });
  }, [fetchNotifications, hasFetched, isAuthenticated, isOpen]);

  useEffect(() => {
    if (!isAuthenticated || !isPushSupported()) return;

    getExistingPushSubscription()
      .then((subscription) => setIsPushSubscribed(Boolean(subscription)))
      .catch(() => setIsPushSubscribed(false));
  }, [isAuthenticated]);

  const handleTogglePush = async () => {
    if (isPushBusy) return;
    setIsPushBusy(true);

    try {
      if (isPushSubscribed) {
        await unsubscribeFromPush();
        setIsPushSubscribed(false);
        toast.success("Push notifications turned off.");
      } else {
        const subscribed = await subscribeToPush();
        setIsPushSubscribed(subscribed);
        if (subscribed) {
          toast.success("Push notifications enabled for this device.");
        } else if (getPushPermission() === "denied") {
          toast.error(
            "Notifications are blocked in your browser settings for this site.",
          );
        }
      }
    } catch (error) {
      console.error("Push toggle failed:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsPushBusy(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = async (notificationId: string, orderId?: string) => {
    await markAsRead(notificationId);
    setIsOpen(false);

    if (orderId) {
      router.push(`/orders/${orderId}`);
    } else {
      router.push("/notifications");
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div ref={panelRef} className="relative notification-menu-container">
      <button
        onClick={() => setIsOpen((current) => !current)}
        className="relative rounded-full p-2 text-[#4A230F] hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#7A3511] text-white text-[10px] font-bold shadow-sm">
            {badgeLabel(unreadCount)}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed left-1/2 top-20 z-50 w-[min(420px,calc(100vw-1.5rem))] -translate-x-1/2 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)] md:absolute md:left-auto md:right-0 md:top-full md:mt-3 md:w-[360px] md:translate-x-0"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-[#4A230F]">
                  Notifications
                </h3>
                <p className="text-xs text-gray-500">
                  {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => markAllAsRead()}
                disabled={unreadCount === 0}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                <CheckCheck size={14} />
                Mark all
              </button>
            </div>

            {isPushSupported() && (
              <button
                type="button"
                onClick={handleTogglePush}
                disabled={isPushBusy}
                className="flex w-full items-center gap-3 border-b border-gray-100 bg-[#FFF7EA] px-5 py-3 text-left transition-colors hover:bg-[#FFF0D6] disabled:opacity-60"
              >
                <BellRing size={18} className="flex-shrink-0 text-[#7A3511]" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-[#4A230F]">
                    {isPushSubscribed
                      ? "Push notifications enabled"
                      : "Get order updates on this device"}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {isPushSubscribed
                      ? "Tap to turn off"
                      : "Tap to enable browser push notifications"}
                  </span>
                </span>
              </button>
            )}

            <div className="max-h-[60vh] overflow-y-auto md:max-h-[420px]">
              {isLoading && !hasFetched ? (
                <div className="px-5 py-8 text-sm text-gray-500">
                  Loading notifications...
                </div>
              ) : error && notifications.length === 0 ? (
                <div className="px-5 py-8 text-sm text-red-600">
                  Unable to load notifications right now.
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm font-medium text-gray-700">
                    No notifications yet
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Order updates will appear here.
                  </p>
                </div>
              ) : (
                notifications.slice(0, 8).map((notification) => {
                  const orderStatus =
                    getNotificationOrderStatusDisplay(notification);
                  const paymentStatus =
                    getNotificationPaymentStatusDisplay(notification);

                  return (
                    <button
                      key={notification._id}
                      type="button"
                      onClick={() =>
                        handleNotificationClick(
                          notification._id,
                          notification.order?._id,
                        )
                      }
                      className={`w-full border-b border-gray-100 px-5 py-4 text-left transition-colors hover:bg-gray-50 ${
                        notification.isRead ? "bg-white" : "bg-[#7A3511]/8"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-[#4A230F]">
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#7A3511]" />
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {notification.message}
                          </p>
                          {notification.order?.orderNumber && (
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              <span className="font-medium text-gray-500">
                                Order {notification.order.orderNumber}
                              </span>
                              {orderStatus && (
                                <span
                                  className={`rounded-full px-2.5 py-1 ${getNotificationOrderStatusTone(
                                    notification,
                                  )}`}
                                >
                                  {orderStatus}
                                </span>
                              )}
                              {paymentStatus && (
                                <span
                                  className={`rounded-full px-2.5 py-1 ${getNotificationPaymentStatusTone(
                                    notification,
                                  )}`}
                                >
                                  {paymentStatus}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="flex-shrink-0 text-xs text-gray-400">
                          {formatNotificationTime(notification.createdAt)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="border-t border-gray-100 px-5 py-3">
              <Link
                href="/notifications"
                className="block rounded-2xl bg-gray-50 px-4 py-3 text-center text-sm font-medium text-[#4A230F] hover:bg-gray-100 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


