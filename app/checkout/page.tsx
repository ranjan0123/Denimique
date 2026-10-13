"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Banknote,
  CreditCard,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Tag,
  User,
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage } from "@/lib/api";
import api from "@/lib/api";
import {
  createOrder,
  getCheckoutSummary,
  getStoreSettings,
  getShippingQuote,
  verifyOrderPayment,
} from "@/lib/commerce";
import type {
  CheckoutSummaryResponse,
  PaymentMethod,
  ShippingAddress,
} from "@/types/commerce";
import type { Address } from "@/types/user";

const emptyAddress: ShippingAddress = {
  fullName: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

const loadRazorpayCheckout = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;
  if (window.Razorpay) return true;

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="${RAZORPAY_SCRIPT_SRC}"]`,
  );

  if (existingScript) {
    return new Promise((resolve) => {
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
    });
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

type CheckoutPhase = "idle" | "creating" | "opening" | "verifying";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart, hasHydrated, loadCart } = useCartStore();
  const { user, hasInitialized, checkAuth, isAuthenticated } = useAuthStore();
  const [isAccessValidated, setIsAccessValidated] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(emptyAddress);
  const [promoCode, setPromoCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [summary, setSummary] = useState<CheckoutSummaryResponse | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingQuoteError, setShippingQuoteError] = useState<string | null>(null);
  const [isShippingQuoteLoading, setIsShippingQuoteLoading] = useState(false);
  const [freeShippingApplied, setFreeShippingApplied] = useState(false);
  const [freeShippingMinAmount, setFreeShippingMinAmount] = useState<number | null>(
    null,
  );
  const [isCodEnabled, setIsCodEnabled] = useState(true);
  const [isFreeShippingEnabled, setIsFreeShippingEnabled] = useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(0);
  const [checkoutPhase, setCheckoutPhase] = useState<CheckoutPhase>("idle");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [hasPrefilledAddress, setHasPrefilledAddress] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  const isFreeShippingEligible =
    isFreeShippingEnabled &&
    freeShippingThreshold > 0 &&
    (summary?.subtotal || 0) >= freeShippingThreshold;

  useEffect(() => {
    if (!hasInitialized) return;

    const guardCheckout = async () => {
      const authenticated = await checkAuth();
      if (!authenticated) {
        router.replace("/login?redirect=/checkout");
        return;
      }
      setIsAccessValidated(true);
    };

    guardCheckout();
  }, [checkAuth, hasInitialized, router]);

  useEffect(() => {
    if (hasInitialized && isAccessValidated) {
      loadCart();
    }
  }, [hasInitialized, isAccessValidated, loadCart]);

  useEffect(() => {
    if (!hasInitialized) return;

    let ignore = false;

    const loadSettings = async () => {
      try {
        const settings = await getStoreSettings();
        if (!ignore) {
          setIsCodEnabled(settings.codEnabled);
          setIsFreeShippingEnabled(settings.freeShippingEnabled);
          setFreeShippingThreshold(settings.freeShippingMinAmount || 0);
          if (!settings.codEnabled && paymentMethod === "cod") {
            setPaymentMethod("online");
          }
        }
      } catch {
        if (!ignore) {
          setIsCodEnabled(true);
          setIsFreeShippingEnabled(false);
          setFreeShippingThreshold(0);
        }
      }
    };

    loadSettings();

    return () => {
      ignore = true;
    };
  }, [hasInitialized, paymentMethod]);

  useEffect(() => {
    if (user) {
      // Merges into existing address state (keeps whatever the user has
      // already typed) rather than mirroring a prop 1:1.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShippingAddress((current) => ({
        ...current,
        fullName: current.fullName || user.name || "",
        email: current.email || user.email || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!hasInitialized || hasPrefilledAddress || !isAuthenticated) return;

    let isActive = true;

    const loadDefaultAddress = async () => {
      try {
        const response = await api.get("/users/me");
        const payload = response.data?.user || response.data;
        const addresses: Address[] = payload?.addresses || [];
        const defaultAddress =
          addresses.find((address) => address.isDefault) || addresses[0];

        if (!isActive) return;

        setSavedAddresses(addresses);
        if (defaultAddress?._id) {
          setSelectedAddressId(defaultAddress._id);
        }

        if (!defaultAddress) return;

        setShippingAddress((current) => ({
          ...current,
          fullName:
            current.fullName || defaultAddress.fullName || user?.name || "",
          email: current.email || user?.email || "",
          phone: current.phone || defaultAddress.phone || "",
          line1: current.line1 || defaultAddress.line1 || "",
          line2: current.line2 || defaultAddress.line2 || "",
          city: current.city || defaultAddress.city || "",
          state: current.state || defaultAddress.state || "",
          postalCode: current.postalCode || defaultAddress.postalCode || "",
          country: current.country || defaultAddress.country || "India",
        }));
        setHasPrefilledAddress(true);
      } catch (error) {
        // Silent fail to avoid blocking checkout; manual entry remains.
        console.error("Failed to prefill default address:", error);
      }
    };

    loadDefaultAddress();

    return () => {
      isActive = false;
    };
  }, [hasInitialized, hasPrefilledAddress, isAuthenticated, user]);

  useEffect(() => {
    if (!selectedAddressId) return;
    const selected = savedAddresses.find(
      (address) => address._id === selectedAddressId,
    );
    if (!selected) return;

    // Merges the selected saved address into existing form state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShippingAddress((current) => ({
      ...current,
      fullName: selected.fullName || current.fullName,
      email: current.email || user?.email || "",
      phone: selected.phone || "",
      line1: selected.line1 || "",
      line2: selected.line2 || "",
      city: selected.city || "",
      state: selected.state || "",
      postalCode: selected.postalCode || "",
      country: selected.country || "India",
    }));
  }, [savedAddresses, selectedAddressId, user]);

  const checkoutItems = useMemo(
    () =>
      cart.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
    [cart],
  );

  useEffect(() => {
    if (!hasHydrated || cart.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSummary(null);
      setSummaryError(null);
      return;
    }

    let ignore = false;

    const loadSummary = async () => {
      setIsSummaryLoading(true);
      setSummaryError(null);

      try {
        const nextSummary = await getCheckoutSummary({
          items: checkoutItems,
          promoCode: promoCode.trim() || undefined,
          shippingFee,
        });

        if (!ignore) {
          setSummary(nextSummary);
        }
      } catch (error: unknown) {
        if (!ignore) {
          setSummary(null);
          setSummaryError(
            getApiErrorMessage(
              error,
              "Unable to validate checkout totals right now.",
            ),
          );
        }
      } finally {
        if (!ignore) {
          setIsSummaryLoading(false);
        }
      }
    };

    loadSummary();

    return () => {
      ignore = true;
    };
  }, [cart.length, checkoutItems, hasHydrated, promoCode, shippingFee]);

  useEffect(() => {
    if (!hasHydrated || cart.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShippingFee(0);
      setShippingQuoteError(null);
      return;
    }

    const postalCode = shippingAddress.postalCode.trim();
    if (!postalCode || postalCode.length < 6) {
      setShippingFee(0);
      setShippingQuoteError(null);
      return;
    }

    let ignore = false;
    const timer = setTimeout(async () => {
      setIsShippingQuoteLoading(true);
      setShippingQuoteError(null);
      setShippingFee(0);
      setFreeShippingApplied(false);
      setFreeShippingMinAmount(null);

      try {
        const quote = await getShippingQuote({
          items: checkoutItems,
          promoCode: promoCode.trim() || undefined,
          paymentMethod,
          shippingAddress: { postalCode },
        });

        if (!ignore) {
          setShippingFee(quote.shippingFee || 0);
          setFreeShippingApplied(Boolean(quote.freeShippingApplied));
          setFreeShippingMinAmount(
            typeof quote.freeShippingMinAmount === "number"
              ? quote.freeShippingMinAmount
              : null,
          );
          if (!quote.serviceable) {
            setShippingQuoteError(
              quote.message || "Shipping is not available for this pincode.",
            );
          }
        }
      } catch (error: unknown) {
        if (!ignore) {
          setShippingFee(0);
          setFreeShippingApplied(false);
          setFreeShippingMinAmount(null);
          setShippingQuoteError(
            getApiErrorMessage(
              error,
              "Unable to fetch shipping rate right now.",
            ),
          );
        }
      } finally {
        if (!ignore) {
          setIsShippingQuoteLoading(false);
        }
      }
    }, 400);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [
    cart.length,
    checkoutItems,
    hasHydrated,
    paymentMethod,
    promoCode,
    shippingAddress.postalCode,
  ]);

  // Preload Razorpay SDK as soon as online payment is selected so the modal
  // opens instantly after order creation instead of waiting for the CDN load.
  useEffect(() => {
    if (paymentMethod === "online") {
      loadRazorpayCheckout();
    }
  }, [paymentMethod]);

  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress((current) => ({ ...current, [field]: value }));
  };

  const handlePlaceOrder = async (event: React.FormEvent) => {
    event.preventDefault();

    const authenticated = await checkAuth();
    if (!authenticated) {
      toast.error("Please sign in to continue checkout.");
      router.push("/login?redirect=/checkout");
      return;
    }

    if (!summary) {
      toast.error("Checkout summary is not ready yet.");
      return;
    }

    setCheckoutError(null);
    setCheckoutPhase("creating");

    try {
      const { order, razorpay } = await createOrder({
        items: checkoutItems,
        promoCode: promoCode.trim() || undefined,
        shippingFee: summary.shippingFee,
        paymentMethod,
        shippingAddress,
      });

      if (paymentMethod === "cod") {
        await clearCart();
        toast.success(`Order ${order.orderNumber} placed successfully`);
        router.replace(`/orders/${order._id}?placed=1`);
        return;
      }

      if (!razorpay?.keyId || !razorpay.orderId || !razorpay.amount || !razorpay.currency) {
        throw new Error("Online payment session could not be created.");
      }

      const razorpayLoaded = await loadRazorpayCheckout();
      if (!razorpayLoaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay checkout right now.");
      }

      setCheckoutPhase("opening");
      let paymentSettled = false;

      const razorpayInstance = new window.Razorpay({
        key: razorpay.keyId,
        order_id: razorpay.orderId,
        amount: razorpay.amount,
        currency: razorpay.currency,
        name: "Denimique",
        description: `Order ${order.orderNumber}`,
        prefill: {
          name: shippingAddress.fullName,
          email: shippingAddress.email,
          contact: shippingAddress.phone,
        },
        modal: {
          ondismiss: () => {
            if (paymentSettled) return;
            setCheckoutPhase("idle");
            setCheckoutError("Payment was cancelled before completion.");
            toast.error("Payment was cancelled.");
          },
        },
        theme: {
          color: "#4A230F",
        },
        handler: async (response) => {
          paymentSettled = true;
          setCheckoutPhase("verifying");

          try {
            const verifiedOrder = await verifyOrderPayment(order._id, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            await clearCart();
            toast.success(`Payment verified for order ${verifiedOrder.orderNumber}`);
            router.replace(`/orders/${verifiedOrder._id}?placed=1`);
          } catch (verificationError: unknown) {
            const message = getApiErrorMessage(
              verificationError,
              "Payment verification failed. Please contact support if money was debited.",
            );
            setCheckoutError(message);
            setCheckoutPhase("idle");
            toast.error(message);
          }
        },
      });

      razorpayInstance.on("payment.failed", (response) => {
        paymentSettled = true;
        const message =
          response.error?.description ||
          "Payment failed. No success confirmation was recorded.";
        setCheckoutError(message);
        setCheckoutPhase("idle");
        toast.error(message);
      });

      razorpayInstance.open();
    } catch (error: unknown) {
      // AxiosError is also `instanceof Error`, so that check must come
      // second — otherwise its generic "Request failed with status code
      // ###" message wins over the backend's actual error message.
      const message = axios.isAxiosError(error)
        ? getApiErrorMessage(error, "Unable to place your order right now.")
        : error instanceof Error
          ? error.message
          : "Unable to place your order right now.";
      setCheckoutError(message);
      toast.error(message);
      setCheckoutPhase("idle");
    }
  };

  if (!hasHydrated || !hasInitialized || !isAccessValidated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] to-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-16 animate-pulse">
          <div className="h-4 w-28 rounded bg-[#F0E4D6] mb-4"></div>
          <div className="h-10 bg-[#F0E4D6] rounded-xl w-2/3 md:w-1/3 mb-10"></div>
          <div className="grid lg:grid-cols-[1.4fr_0.9fr] gap-8">
            <div className="space-y-4">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="h-12 bg-[#F0E4D6] rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 bg-[#F0E4D6] rounded-[28px]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] to-white flex items-center">
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#7A3511]/10">
            <Tag className="h-7 w-7 text-[#7A3511]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#4A230F]">
            Your cart is empty
          </h1>
          <p className="mt-3 text-gray-500">
            Add products before starting checkout.
          </p>
          <Link
            href="/shop"
            className="inline-flex mt-8 rounded-full bg-[#7A3511] px-7 py-3.5 font-semibold text-white shadow-[0_8px_20px_rgba(122,53,17,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#5A260F] hover:shadow-[0_12px_28px_rgba(122,53,17,0.35)]"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const inputFieldMeta: Record<
    string,
    { label: string; icon?: typeof User; placeholder?: string }
  > = {
    fullName: { label: "Full Name *", icon: User, placeholder: "Your full name" },
    email: { label: "Email *", icon: Mail, placeholder: "you@example.com" },
    phone: { label: "Phone *", icon: Phone, placeholder: "10-digit mobile number" },
    city: { label: "City *", placeholder: "City" },
    state: { label: "State *", placeholder: "State" },
    postalCode: { label: "Postal Code *", placeholder: "6-digit PIN code" },
    country: { label: "Country *", placeholder: "Country" },
  };

  const inputClass =
    "w-full rounded-xl border border-[#EADFD3] bg-white px-4 py-3 text-sm text-[#2F2018] outline-none transition focus:border-[#7A3511] focus:ring-2 focus:ring-[#7A3511]/15";

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#FDFBF7] to-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-14 text-gray-800">
        <div className="mb-6 md:mb-10">
          <p className="text-xs font-semibold text-[#7A3511] uppercase tracking-[0.22em]">
            Checkout
          </p>
          <h1 className="mt-2 text-2xl md:text-4xl font-bold text-[#4A230F]">
            Review your order and delivery details
          </h1>
        </div>

        <form
          onSubmit={handlePlaceOrder}
          className="grid gap-6 md:gap-8 lg:grid-cols-[1.4fr_0.9fr]"
        >
          <div className="space-y-6 md:space-y-8">
            <div className="rounded-[28px] border border-[#F0E4D6] bg-white p-6 md:p-8 shadow-[0_10px_30px_rgba(122,53,17,0.06)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7A3511]/10 text-[#7A3511]">
                  <MapPin className="h-5 w-5" />
                </div>
                <h2 className="text-xl md:text-2xl font-semibold text-[#4A230F]">
                  Shipping Address
                </h2>
              </div>

              {savedAddresses.length > 0 && (
                <div className="mt-5 rounded-2xl border border-[#7A3511]/12 bg-[#FFF8EE] px-4 py-4">
                  <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#7A3511] mb-2">
                    Saved Addresses
                  </label>
                  <select
                    value={selectedAddressId}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                    className="w-full rounded-xl border border-[#7A3511]/20 bg-white px-4 py-3 text-sm text-[#4A230F] outline-none transition focus:border-[#7A3511] focus:ring-2 focus:ring-[#7A3511]/15"
                  >
                    {savedAddresses.map((address) => (
                      <option key={address._id} value={address._id}>
                        {address.label} • {address.line1}, {address.city}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-[#7A3511]/80">
                    Selecting an address will fill the form. You can still edit
                    the fields below.
                  </p>
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(inputFieldMeta).map(([field, meta]) => {
                  const Icon = meta.icon;
                  return (
                    <div key={field}>
                      <label className="block text-sm font-medium text-[#5B4636] mb-2">
                        {meta.label}
                      </label>
                      <div className="relative">
                        {Icon && (
                          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A1816C]" />
                        )}
                        <input
                          required
                          type="text"
                          placeholder={meta.placeholder}
                          value={shippingAddress[field as keyof ShippingAddress]}
                          onChange={(e) =>
                            handleAddressChange(
                              field as keyof ShippingAddress,
                              e.target.value,
                            )
                          }
                          className={`${inputClass} ${Icon ? "pl-10" : ""}`}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#5B4636] mb-2">
                    Address Line 1 *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="House no., street, area"
                    value={shippingAddress.line1}
                    onChange={(e) => handleAddressChange("line1", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#5B4636] mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    placeholder="Landmark, apartment (optional)"
                    value={shippingAddress.line2}
                    onChange={(e) => handleAddressChange("line2", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#F0E4D6] bg-white p-6 md:p-8 shadow-[0_10px_30px_rgba(122,53,17,0.06)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7A3511]/10 text-[#7A3511]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="text-xl md:text-2xl font-semibold text-[#4A230F]">
                  Payment Method
                </h2>
              </div>

              <div className="mt-5 space-y-3">
                <label
                  className={`flex items-start gap-3 rounded-2xl border-2 px-4 py-4 transition-all duration-200 ${
                    paymentMethod === "cod"
                      ? "border-[#7A3511] bg-[#7A3511]/[0.06] shadow-[0_6px_16px_rgba(122,53,17,0.1)]"
                      : "border-[#EADFD3] bg-white hover:border-[#7A3511]/40"
                  } ${
                    isCodEnabled ? "" : "opacity-60 cursor-not-allowed"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="mt-1 accent-[#7A3511]"
                    disabled={!isCodEnabled}
                  />
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7A3511]/10 text-[#7A3511]">
                    <Banknote className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-[#4A230F]">
                        Cash on Delivery
                      </p>
                      {paymentMethod === "cod" && (
                        <span className="rounded-full bg-[#7A3511] px-2.5 py-0.5 text-[10px] font-semibold text-white">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {isCodEnabled
                        ? "Pay when the order reaches you."
                        : "COD is temporarily unavailable. Please use online payment."}
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 rounded-2xl border-2 px-4 py-4 transition-all duration-200 ${
                    paymentMethod === "online"
                      ? "border-[#7A3511] bg-[#7A3511]/[0.06] shadow-[0_6px_16px_rgba(122,53,17,0.1)]"
                      : "border-[#EADFD3] bg-white hover:border-[#7A3511]/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "online"}
                    onChange={() => setPaymentMethod("online")}
                    className="mt-1 accent-[#7A3511]"
                  />
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7A3511]/10 text-[#7A3511]">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-[#4A230F]">Online Payment</p>
                      {paymentMethod === "online" && (
                        <span className="rounded-full bg-[#7A3511] px-2.5 py-0.5 text-[10px] font-semibold text-white">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Pay securely with Razorpay after the order is created.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#F0E4D6] bg-[#FFFBF6] p-6 md:p-7 shadow-[0_14px_36px_rgba(122,53,17,0.08)] h-fit lg:sticky lg:top-24">
            <h2 className="text-xl md:text-2xl font-semibold text-[#4A230F]">
              Order Summary
            </h2>

            <div className="mt-4 space-y-3 max-h-64 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 border-b border-[#F0E4D6] pb-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[#2F2018] truncate">{item.name}</p>
                    {item.variantLabel && (
                      <p className="text-xs text-gray-500">{item.variantLabel}</p>
                    )}
                    <p className="text-xs text-gray-500">Qty {item.quantity}</p>
                  </div>
                  <p className="whitespace-nowrap font-semibold text-[#4A230F]">
                    Rs. {item.unitPrice * item.quantity}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 mb-2">
                Promo Code
              </label>
              <div className="relative">
                <Tag className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A1816C]" />
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Enter promo code"
                  className="w-full rounded-xl border border-[#EADFD3] bg-white pl-10 pr-3 py-2.5 text-sm uppercase outline-none transition focus:border-[#7A3511] focus:ring-2 focus:ring-[#7A3511]/15"
                />
              </div>
            </div>

            {summaryError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {summaryError}
              </div>
            )}

            {shippingQuoteError && !summaryError && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {shippingQuoteError}
              </div>
            )}

            {checkoutError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {checkoutError}
              </div>
            )}

            <div className="mt-6 space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>Rs. {summary?.subtotal || 0}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Discount</span>
                <span className="text-emerald-600">- Rs. {summary?.discount || 0}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping Fee</span>
                <span>
                  {isShippingQuoteLoading ? "Calculating..." : `Rs. ${summary?.shippingFee || 0}`}
                </span>
              </div>
              {(freeShippingApplied || isFreeShippingEligible) && (
                <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  You&apos;ve got free shipping on this order!
                </div>
              )}
              <div className="border-t border-[#F0E4D6] pt-3 flex justify-between text-lg font-bold text-[#4A230F]">
                <span>Total</span>
                <span>Rs. {summary?.total || 0}</span>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between rounded-xl border border-[#7A3511]/10 bg-white px-4 py-3 text-sm">
              <span className="font-medium text-gray-600">Payment Method</span>
              <span className="font-semibold text-[#4A230F]">
                {paymentMethod === "online" ? "Online Payment" : "Cash on Delivery"}
              </span>
            </div>

            <button
              type="submit"
              disabled={checkoutPhase !== "idle" || isSummaryLoading || !!summaryError}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#7A3511] px-4 py-3.5 font-semibold text-white shadow-[0_8px_20px_rgba(122,53,17,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#5A260F] hover:shadow-[0_12px_28px_rgba(122,53,17,0.35)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {checkoutPhase !== "idle" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {checkoutPhase === "creating"
                ? paymentMethod === "online"
                  ? "Creating Order..."
                  : "Placing Order..."
                : checkoutPhase === "opening"
                  ? "Opening Razorpay..."
                  : checkoutPhase === "verifying"
                    ? "Verifying Payment..."
                : isSummaryLoading
                  ? "Refreshing Totals..."
                  : paymentMethod === "online"
                    ? "Pay Now"
                    : "Place Order"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}


