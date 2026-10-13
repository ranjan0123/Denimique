"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Send } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api, { getApiErrorMessage } from "@/lib/api";

type BroadcastResult = {
  total: number;
  sent: number;
};

export default function AdminPushPage() {
  const router = useRouter();
  const { hasInitialized, checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  const [lastResult, setLastResult] = useState<BroadcastResult | null>(null);

  useEffect(() => {
    if (!hasInitialized) return;

    const init = async () => {
      const isAuthenticated = await checkAuth();
      const currentUser = useAuthStore.getState().user;
      if (
        !isAuthenticated ||
        !["admin", "superadmin"].includes(currentUser?.role || "")
      ) {
        router.replace("/login");
        return;
      }
      setIsLoading(false);
    };

    init();
  }, [checkAuth, hasInitialized, router]);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required.");
      return;
    }

    setIsSending(true);
    setLastResult(null);

    try {
      const response = await api.post("/admin/push/broadcast", {
        title: title.trim(),
        message: message.trim(),
        url: url.trim() || undefined,
      });

      setLastResult(response.data);
      toast.success(
        `Sent to ${response.data.sent} of ${response.data.total} subscribed devices.`,
      );
      setTitle("");
      setMessage("");
      setUrl("");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to send notification."));
    } finally {
      setIsSending(false);
    }
  };

  if (!hasInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 text-gray-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">
            Push Notification
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Send a custom browser push notification to every customer who has
            enabled notifications. Only devices with notifications turned on
            will receive it.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={65}
                placeholder="e.g. Weekend Sale is live!"
                className="w-full rounded-xl border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={200}
                rows={3}
                placeholder="e.g. Get 20% off all styles, today only."
                className="w-full rounded-xl border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link when tapped (optional)
              </label>
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="/shop"
                className="w-full rounded-xl border border-gray-300 px-3 py-2"
              />
              <p className="mt-1 text-xs text-gray-500">
                A path on your website, e.g. /shop or /products/some-product.
                Defaults to the homepage.
              </p>
            </div>

            <button
              onClick={handleSend}
              disabled={isSending}
              className="inline-flex items-center gap-2 rounded-xl bg-[#7A3511] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#5A260F] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isSending ? "Sending..." : "Send Notification"}
            </button>
          </div>
        </div>

        {lastResult && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Last Delivery
            </h2>
            <div className="mt-3 flex gap-6">
              <div>
                <p className="text-2xl font-semibold text-slate-950">
                  {lastResult.total}
                </p>
                <p className="text-sm text-gray-500">Subscribed devices</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-emerald-700">
                  {lastResult.sent}
                </p>
                <p className="text-sm text-gray-500">Delivered</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
