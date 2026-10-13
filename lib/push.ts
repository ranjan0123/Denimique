import api from "@/lib/api";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export const isPushSupported = (): boolean =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window &&
  Boolean(VAPID_PUBLIC_KEY);

export const getPushPermission = (): NotificationPermission | null =>
  isPushSupported() ? Notification.permission : null;

// Web Push requires the VAPID key as a Uint8Array, not the base64url string it's stored as.
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const getExistingPushSubscription =
  async (): Promise<PushSubscription | null> => {
    if (!isPushSupported()) return null;

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return null;

    return registration.pushManager.getSubscription();
  };

export const subscribeToPush = async (): Promise<boolean> => {
  if (!isPushSupported()) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      VAPID_PUBLIC_KEY as string,
    ) as BufferSource,
  });

  const json = subscription.toJSON();
  await api.post("/push/subscribe", {
    endpoint: json.endpoint,
    keys: json.keys,
  });

  return true;
};

export const unsubscribeFromPush = async (): Promise<void> => {
  const subscription = await getExistingPushSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await api.post("/push/unsubscribe", { endpoint });
};
