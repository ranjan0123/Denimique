"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage } from "@/lib/api";
import { getStoreSettings, updateStoreSettings } from "@/lib/commerce";

export default function AdminSettingsPage() {
  const { checkAuth } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [codEnabled, setCodEnabled] = useState(true);
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(false);
  const [freeShippingMinAmount, setFreeShippingMinAmount] = useState("");
  const [flatShippingFee, setFlatShippingFee] = useState("");

  useEffect(() => {
    const verifyAuth = async () => {
      const isAuth = await checkAuth();
      if (!isAuth) {
        router.push("/login");
        return;
      }

      setTimeout(async () => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser || !["admin", "superadmin"].includes(currentUser.role || "")) {
          router.push("/");
          return;
        }

        try {
          const settings = await getStoreSettings();
          setCodEnabled(settings.codEnabled);
          setFreeShippingEnabled(settings.freeShippingEnabled);
          setFreeShippingMinAmount(
            settings.freeShippingMinAmount ? String(settings.freeShippingMinAmount) : "",
          );
          setFlatShippingFee(
            settings.flatShippingFee ? String(settings.flatShippingFee) : "",
          );
        } catch (error) {
          toast.error(getApiErrorMessage(error, "Unable to load settings."));
        } finally {
          setIsLoading(false);
        }
      }, 100);
    };

    verifyAuth();
  }, [checkAuth, router]);

  const handleToggle = async () => {
    const nextValue = !codEnabled;
    setCodEnabled(nextValue);
    setIsSaving(true);

    try {
      const updated = await updateStoreSettings({ codEnabled: nextValue });
      setCodEnabled(updated.codEnabled);
      toast.success(
        updated.codEnabled ? "COD enabled for checkout." : "COD disabled storewide.",
      );
    } catch (error) {
      setCodEnabled(!nextValue);
      toast.error(getApiErrorMessage(error, "Unable to update COD setting."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFreeShippingSave = async () => {
    const parsedAmount = Number(freeShippingMinAmount);

    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      toast.error("Enter a valid minimum amount.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateStoreSettings({
        codEnabled,
        freeShippingEnabled,
        freeShippingMinAmount: parsedAmount,
      });
      setFreeShippingEnabled(updated.freeShippingEnabled);
      setFreeShippingMinAmount(
        updated.freeShippingMinAmount ? String(updated.freeShippingMinAmount) : "",
      );
      toast.success("Free shipping settings updated.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update free shipping."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFlatShippingFeeSave = async () => {
    const parsedFee = Number(flatShippingFee);

    if (!Number.isFinite(parsedFee) || parsedFee < 0) {
      toast.error("Enter a valid shipping fee.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateStoreSettings({ flatShippingFee: parsedFee });
      setFlatShippingFee(
        updated.flatShippingFee ? String(updated.flatShippingFee) : "",
      );
      toast.success("Shipping fee updated.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update shipping fee."));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-20 w-20 rounded-full border-4 border-slate-200 border-t-[#0D4D3B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-10 text-black">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-black">Store Settings</h1>
          <p className="mt-2 text-sm text-black">
            Control how checkout behaves for all customers.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-black">
                Cash on Delivery
              </h2>
              <p className="mt-1 text-sm text-black">
                Toggle COD availability for the entire store.
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggle}
              disabled={isSaving}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${
                codEnabled
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-slate-200 text-black hover:bg-slate-300"
              } ${isSaving ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {codEnabled ? "COD Enabled" : "COD Disabled"}
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-semibold text-black">
                Shipping Fee
              </h2>
              <p className="mt-1 text-sm text-black">
                Flat shipping fee charged at checkout (before any free
                shipping threshold applies below).
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-black mb-2">
                  Flat Shipping Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={flatShippingFee}
                  onChange={(e) => setFlatShippingFee(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D4D3B]/20"
                  placeholder="e.g., 79"
                />
              </div>
              <button
                type="button"
                onClick={handleFlatShippingFeeSave}
                disabled={isSaving}
                className="inline-flex justify-center rounded-xl bg-[#0D4D3B] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0B3E2F] disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Shipping Fee"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-black">
                  Free Shipping Threshold
                </h2>
                <p className="mt-1 text-sm text-black">
                  Offer free shipping when cart subtotal crosses this amount.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFreeShippingEnabled((prev) => !prev)}
                disabled={isSaving}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${
                  freeShippingEnabled
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-slate-200 text-black hover:bg-slate-300"
                } ${isSaving ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {freeShippingEnabled ? "Free Shipping On" : "Free Shipping Off"}
              </button>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-black mb-2">
                  Minimum Order Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={freeShippingMinAmount}
                  onChange={(e) => setFreeShippingMinAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D4D3B]/20"
                  placeholder="e.g., 499"
                />
              </div>
              <button
                type="button"
                onClick={handleFreeShippingSave}
                disabled={isSaving}
                className="inline-flex justify-center rounded-xl bg-[#0D4D3B] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0B3E2F] disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Free Shipping"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
