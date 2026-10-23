import api from "@/lib/api";
import {
  formatStatusLabel,
  getOrderStatusTone,
  getPaymentStatusTone,
} from "@/lib/commerce";
import type {
  Notification,
  NotificationListResponse,
  NotificationOrder,
  UnreadCountResponse,
} from "@/types/notification";

type RawNotification = {
  _id?: string;
  type?: string;
  title?: string;
  message?: string;
  isRead?: boolean;
  readAt?: string | null;
  createdAt?: string;
  statusSnapshot?: string;
  paymentSnapshot?: string;
  previousOrderStatus?: string;
  previousPaymentStatus?: string;
  metadata?: Record<string, string | number | boolean | null>;
  order?: {
    _id?: string;
    orderNumber?: string;
    orderStatus?: string;
    paymentStatus?: string;
    total?: number;
  } | null;
};

const normalizeOrder = (
  order?: RawNotification["order"],
): NotificationOrder | null => {
  if (!order?._id) return null;

  return {
    _id: order._id,
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    total: order.total,
  };
};

export const normalizeNotification = (
  notification: RawNotification,
): Notification => ({
  _id: notification._id || "",
  type: notification.type || "system",
  title: notification.title || "Notification",
  message: notification.message || "",
  isRead: Boolean(notification.isRead),
  readAt: notification.readAt ?? null,
  createdAt: notification.createdAt,
  statusSnapshot: notification.statusSnapshot,
  paymentSnapshot: notification.paymentSnapshot,
  previousOrderStatus: notification.previousOrderStatus,
  previousPaymentStatus: notification.previousPaymentStatus,
  metadata: notification.metadata || {},
  order: normalizeOrder(notification.order),
});

export const getNotifications = async (): Promise<NotificationListResponse> => {
  const response = await api.get("/notifications");
  const notifications: RawNotification[] =
    response.data.notifications || response.data || [];

  return {
    notifications: notifications.map(normalizeNotification),
  };
};

export const getUnreadNotificationCount = async (): Promise<UnreadCountResponse> => {
  const response = await api.get("/notifications/unread-count");
  return {
    unreadCount:
      response.data.unreadCount ??
      response.data.count ??
      response.data.unread ??
      0,
  };
};

export const markNotificationAsRead = async (id: string): Promise<Notification> => {
  const response = await api.put(`/notifications/${id}/read`);
  return normalizeNotification(response.data.notification || response.data);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await api.put("/notifications/read-all");
};

export const formatNotificationTime = (value?: string): string => {
  if (!value) return "Just now";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Just now";

  const diffMs = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "Just now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}d ago`;

  return new Date(value).toLocaleDateString();
};

export const getNotificationOrderStatusDisplay = (
  notification: Notification,
): string => {
  const current =
    notification.statusSnapshot || notification.order?.orderStatus || "";
  const previous = notification.previousOrderStatus || "";

  if (
    (notification.type === "order_status_changed" ||
      notification.type === "order_status_updated") &&
    previous &&
    current &&
    previous !== current
  ) {
    return `${formatStatusLabel(previous)} -> ${formatStatusLabel(current)}`;
  }

  return formatStatusLabel(current);
};

export const getNotificationPaymentStatusDisplay = (
  notification: Notification,
): string => {
  const current =
    notification.paymentSnapshot || notification.order?.paymentStatus || "";
  const previous = notification.previousPaymentStatus || "";

  if (
    (notification.type === "payment_status_changed" ||
      notification.type === "payment_status_updated") &&
    previous &&
    current &&
    previous !== current
  ) {
    return `${formatStatusLabel(previous)} -> ${formatStatusLabel(current)}`;
  }

  return formatStatusLabel(current);
};

export const getNotificationOrderStatusTone = (
  notification: Notification,
): string =>
  getOrderStatusTone(
    notification.statusSnapshot || notification.order?.orderStatus,
  );

export const getNotificationPaymentStatusTone = (
  notification: Notification,
): string =>
  getPaymentStatusTone(
    notification.paymentSnapshot || notification.order?.paymentStatus,
  );
