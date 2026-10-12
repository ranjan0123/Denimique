import mongoose from "mongoose";
import Notification, { NotificationType } from "../models/Notification";
import { sendPushToUser } from "./push";

export const createNotification = async ({
  userId,
  orderId,
  type,
  title,
  message,
  metadata,
  session,
}: {
  userId: string | mongoose.Types.ObjectId;
  orderId?: string | mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  session?: mongoose.ClientSession;
}) => {
  const payload = {
    user: userId,
    order: orderId,
    type,
    title,
    message,
    metadata,
  };

  const notification = session
    ? (await Notification.create([payload], { session }))[0]
    : await Notification.create(payload);

  // Fire-and-forget: a push delivery failure should never break the caller's flow.
  sendPushToUser(userId.toString(), {
    title,
    message,
    url: orderId ? `/orders/${orderId}` : "/notifications",
  }).catch((error) => {
    console.error("Failed to send push notification:", error);
  });

  return notification;
};
