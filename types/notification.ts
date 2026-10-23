export type NotificationType =
  | "order_created"
  | "order_status_updated"
  | "payment_status_updated"
  | "system"
  | string;

export interface NotificationOrder {
  _id: string;
  orderNumber?: string;
  orderStatus?: string;
  paymentStatus?: string;
  total?: number;
}

export interface Notification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt?: string;
  statusSnapshot?: string;
  paymentSnapshot?: string;
  previousOrderStatus?: string;
  previousPaymentStatus?: string;
  metadata?: Record<string, string | number | boolean | null>;
  order?: NotificationOrder | null;
}

export interface NotificationListResponse {
  notifications: Notification[];
}

export interface UnreadCountResponse {
  unreadCount: number;
}
