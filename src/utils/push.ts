import webpush from "web-push";
import PushSubscription, { IPushSubscription } from "../models/PushSubscription";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:support@suitablevastra.com";

const isConfigured = Boolean(vapidPublicKey && vapidPrivateKey);

if (isConfigured) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey!, vapidPrivateKey!);
} else {
  console.warn(
    "VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY not set - push notifications are disabled.",
  );
}

interface PushPayload {
  title: string;
  message: string;
  url?: string;
}

const deliver = async (
  subscription: IPushSubscription,
  payload: PushPayload,
): Promise<boolean> => {
  const body = JSON.stringify({
    title: payload.title,
    message: payload.message,
    url: payload.url || "/",
  });

  try {
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: subscription.keys },
      body,
    );
    return true;
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode;

    // 404/410 mean the subscription is gone (browser unsubscribed, expired, etc).
    if (statusCode === 404 || statusCode === 410) {
      await PushSubscription.deleteOne({ _id: subscription._id });
    } else {
      console.error("Push send failed:", error);
    }
    return false;
  }
};

export const sendPushToUser = async (
  userId: string,
  payload: PushPayload,
): Promise<void> => {
  if (!isConfigured) return;

  const subscriptions = await PushSubscription.find({ user: userId });
  if (subscriptions.length === 0) return;

  await Promise.all(
    subscriptions.map((subscription) => deliver(subscription, payload)),
  );
};

export const broadcastPush = async (
  payload: PushPayload,
): Promise<{ total: number; sent: number }> => {
  if (!isConfigured) return { total: 0, sent: 0 };

  const subscriptions = await PushSubscription.find();
  const results = await Promise.all(
    subscriptions.map((subscription) => deliver(subscription, payload)),
  );

  return {
    total: subscriptions.length,
    sent: results.filter(Boolean).length,
  };
};
