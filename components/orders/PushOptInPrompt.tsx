"use client";

import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  getExistingPushSubscription,
  getPushPermission,
  isPushSupported,
  subscribeToPush,
} from "@/lib/push";

const SNOOZE_KEY = "push_prompt_snoozed_until";
const SNOOZE_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // re-ask after 14 days

// Shown right after an order is placed - the one moment the value of "get
// notified when this ships" is completely self-evident to the user. Uses a
// custom banner instead of calling the native permission prompt cold, since
// browsers only let JS ask once: if that native prompt gets denied here
// before the user understands why, there's no second chance without them
// digging into browser site settings.
export default function PushOptInPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if (!isPushSupported() || getPushPermission() === "denied") return;

    const snoozedUntil = Number(localStorage.getItem(SNOOZE_KEY) || 0);
    if (snoozedUntil > Date.now()) return;

    getExistingPushSubscription()
      .then((subscription) => setIsVisible(!subscription))
      .catch(() => setIsVisible(true));
  }, []);

  const dismiss = () => {
    // Snooze rather than suppress forever - a decline on one order shouldn't
    // block the ask on every future order too.
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DURATION_MS));
    setIsVisible(false);
  };

  const handleEnable = async () => {
    setIsSubscribing(true);
    try {
      const subscribed = await subscribeToPush();
      if (subscribed) {
        toast.success("You'll be notified as this order progresses.");
        setIsVisible(false);
      } else {
        // Permission denied or dismissed at the native prompt - don't nag again.
        dismiss();
      }
    } catch (error) {
      console.error("Push subscribe failed:", error);
      toast.error("Couldn't enable notifications. You can try again later.");
    } finally {
      setIsSubscribing(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="mb-8 flex items-start gap-4 rounded-2xl border border-[#1B2E27]/40 bg-[#FFF7EA] px-6 py-4">
      <BellRing className="mt-0.5 h-5 w-5 flex-shrink-0 text-black" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-black">
          Want updates on this order?
        </p>
        <p className="mt-1 text-sm text-black">
          Turn on push notifications and we&apos;ll alert you the moment your
          order ships or arrives.
        </p>
        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={handleEnable}
            disabled={isSubscribing}
            className="rounded-xl bg-[#1B2E27] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5A260F] disabled:opacity-60"
          >
            {isSubscribing ? "Enabling..." : "Enable notifications"}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-xl px-4 py-2 text-sm font-medium text-black hover:bg-black/5"
          >
            Not now
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="flex-shrink-0 rounded-full p-1 text-black hover:bg-black/5 hover:text-black"
      >
        <X size={16} />
      </button>
    </div>
  );
}
