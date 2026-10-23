"use client";

import { useEffect, useState } from "react";
import Image from "@/components/ui/AppImage";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  Copy,
  Sparkles,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "@/lib/apiConfig";
import { resolveApiAssetUrl } from "@/lib/api";

export interface IHotProduct {
  _id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  progressPercentage: number;
  couponCode: string;
  couponDescription: string;
  isEnabled: boolean;
  displayDuration: {
    startDate: string;
    endDate: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface HotProductProps {
  initialHotProduct?: IHotProduct | null;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(price);

export default function HotProduct({ initialHotProduct }: HotProductProps) {
  const [hotProduct, setHotProduct] = useState<IHotProduct | null>(
    initialHotProduct ?? null,
  );

  const [loading, setLoading] = useState(initialHotProduct === undefined);

  const [error, setError] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [liveProgress, setLiveProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  const shouldReduceMotion = useReducedMotion();

  // Fetch the currently featured product.
  useEffect(() => {
    if (initialHotProduct !== undefined) {
      setLoading(false);
      setHotProduct(initialHotProduct);
      return;
    }

    let cancelled = false;

    async function fetchHotProduct() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/hot-product`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 404) {
            if (!cancelled) {
              setHotProduct(null);
              setError(null);
            }
            return;
          }

          throw new Error(`Failed to fetch hot product: ${response.status}`);
        }

        const data: IHotProduct = await response.json();

        if (!cancelled) {
          setHotProduct(data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch hot product",
          );

          console.error("Error fetching hot product:", err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchHotProduct();

    return () => {
      cancelled = true;
    };
  }, [initialHotProduct]);

  // Update the countdown and promotion progress every second.
  useEffect(() => {
    if (!hotProduct) return;

    const calculateTimeLeft = () => {
      const startDate = new Date(
        hotProduct.displayDuration.startDate,
      ).getTime();

      const endDate = new Date(hotProduct.displayDuration.endDate).getTime();

      const now = Date.now();

      const validDates =
        Number.isFinite(startDate) &&
        Number.isFinite(endDate) &&
        endDate > startDate;

      if (validDates) {
        const elapsed = now - startDate;
        const total = endDate - startDate;

        setLiveProgress(Math.min(100, Math.max(0, (elapsed / total) * 100)));
      } else {
        setLiveProgress(
          Math.min(100, Math.max(0, hotProduct.progressPercentage || 0)),
        );
      }

      const difference = endDate - now;

      if (Number.isFinite(difference) && difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / 86400000),
          hours: Math.floor((difference / 3600000) % 24),
          minutes: Math.floor((difference / 60000) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
      }
    };

    calculateTimeLeft();

    const interval = window.setInterval(calculateTimeLeft, 1000);

    return () => window.clearInterval(interval);
  }, [hotProduct]);

  // Copy the promotion code.
  const handleCopyCoupon = async () => {
    if (!hotProduct?.couponCode) return;

    try {
      await navigator.clipboard.writeText(hotProduct.couponCode);

      setCopied(true);
      toast.success("Coupon code copied!");

      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Unable to copy. Please copy the code manually.");
    }
  };

  if (loading) {
    return (
      <section className="bg-[#F8F6F1] px-4 py-16 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-8 h-8 w-64 animate-pulse bg-[#E8E0D3]" />

          <div className="grid min-h-[420px] animate-pulse bg-white md:grid-cols-2">
            <div className="min-h-[300px] bg-[#E9E4DA]" />

            <div className="flex flex-col justify-center gap-5 p-8 sm:p-12">
              <div className="h-3 w-28 bg-[#E9E4DA]" />
              <div className="h-10 w-3/4 bg-[#E9E4DA]" />
              <div className="h-4 w-full bg-[#E9E4DA]" />
              <div className="h-12 w-40 bg-[#E9E4DA]" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !hotProduct) {
    return null;
  }

  const countdownItems = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  const hasActiveCountdown =
    new Date(hotProduct.displayDuration.endDate).getTime() > Date.now();

  const savings = Math.max(
    0,
    hotProduct.originalPrice - hotProduct.discountedPrice,
  );

  return (
    <section
      aria-labelledby="hot-product-heading"
      className="relative isolate overflow-hidden bg-[#F8F6F1] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-28"
    >
      {/* Subtle, premium background details */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-36 top-20 -z-10 h-96 w-96 rounded-full bg-[#B49A70]/10 blur-[100px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 right-0 -z-10 h-96 w-96 rounded-full bg-[#102B50]/[0.06] blur-[100px]"
      />

      <div className="mx-auto max-w-[1240px]">
        {/* Section heading */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55 }}
          className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-black">
              <Sparkles size={14} strokeWidth={1.5} />
              The weekly edit
            </p>

            <h2
              id="hot-product-heading"
              className="mt-4 font-heading text-4xl leading-[1.02] tracking-[-0.045em] text-black sm:text-5xl lg:text-6xl"
            >
              The one to
              <br className="sm:hidden" /> know.
            </h2>

            <p className="mt-4 max-w-md text-sm leading-7 text-black sm:text-base">
              A considered favourite, available for a limited time.
            </p>
          </div>

          <Link
            href="/shop"
            className="group inline-flex w-fit items-center gap-3 border-b border-[#92764A]/50 pb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-black transition-colors hover:border-[#92764A] hover:text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#92764A] sm:text-[11px]"
          >
            Discover the collection
            <ArrowUpRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
            />
          </Link>
        </motion.div>

        {/* Featured product */}
        <motion.article
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="relative grid overflow-hidden border border-[#191714]/10 bg-white shadow-[0_20px_70px_rgba(25,23,20,0.07)] lg:grid-cols-[1.02fr_0.98fr]"
        >
          {/* Product image panel */}
          <div className="relative flex min-h-[340px] items-center justify-center overflow-hidden bg-[#EAE5DC] px-8 py-12 sm:min-h-[470px] sm:px-12 lg:min-h-[600px]">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.8)_0%,_rgba(234,229,220,0.15)_68%,_rgba(220,211,196,0.3)_100%)]"
            />

            <div
              aria-hidden="true"
              className="absolute inset-5 border border-[#92764A]/20 sm:inset-8"
            />

            <div className="absolute left-8 top-8 z-10 sm:left-12 sm:top-12">
              <span className="inline-flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-black">
                <span className="h-1.5 w-1.5 rounded-full bg-[#92764A]" />
                Selected for you
              </span>
            </div>

            {hotProduct.discountPercentage > 0 && (
              <div className="absolute right-8 top-8 z-10 flex h-[68px] w-[68px] flex-col items-center justify-center rounded-full bg-[#102B50] text-white shadow-lg sm:right-12 sm:top-12 sm:h-[78px] sm:w-[78px]">
                <span className="text-lg font-semibold leading-none">
                  {hotProduct.discountPercentage}%
                </span>
                <span className="mt-1 text-[8px] uppercase tracking-[0.17em]">
                  Off
                </span>
              </div>
            )}

            <div className="relative z-0 flex h-full w-full items-center justify-center py-8">
              <Image
                src={resolveApiAssetUrl(hotProduct.productImage)}
                alt={hotProduct.productName}
                width={420}
                height={500}
                priority
                className="max-h-[380px] w-auto max-w-full object-contain drop-shadow-[0_22px_25px_rgba(25,23,20,0.13)] sm:max-h-[440px] lg:max-h-[480px]"
              />
            </div>

            <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between sm:bottom-12 sm:left-12 sm:right-12">
              <p className="text-[9px] uppercase tracking-[0.2em] text-black">
                Denimique / Featured
              </p>

              <Sparkles size={17} strokeWidth={1} className="text-black" />
            </div>
          </div>

          {/* Product details */}
          <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16 xl:px-16">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.23em] text-black">
              <Tag size={13} strokeWidth={1.6} />
              This week's highlight
            </p>

            <h3 className="mt-5 font-heading text-3xl leading-[1.12] tracking-[-0.035em] text-black sm:text-4xl lg:text-[2.8rem]">
              {hotProduct.productName}
            </h3>

            <p className="mt-4 max-w-md text-sm leading-7 text-black">
              Discover a standout piece selected for the Denimique collection. A
              special price, available for a limited time.
            </p>

            {/* Pricing */}
            <div className="mt-7 flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <span className="font-heading text-3xl text-black sm:text-4xl">
                ₹{formatPrice(hotProduct.discountedPrice)}
              </span>

              {hotProduct.originalPrice > hotProduct.discountedPrice && (
                <>
                  <span className="text-sm text-black line-through">
                    ₹{formatPrice(hotProduct.originalPrice)}
                  </span>

                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-black">
                    Save ₹{formatPrice(savings)}
                  </span>
                </>
              )}
            </div>

            <div className="my-8 h-px w-full bg-[#191714]/10" />

            {/* Offer countdown */}
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black">
                  Limited-time offer
                </p>

                <span className="inline-flex items-center gap-1.5 text-[10px] text-black">
                  <Clock3 size={13} />
                  {hasActiveCountdown ? "Offer ends in" : "Offer ended"}
                </span>
              </div>

              <div
                className="grid grid-cols-4 gap-2 sm:gap-3"
                aria-label={`Time remaining: ${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, ${timeLeft.seconds} seconds`}
              >
                {countdownItems.map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex min-w-0 flex-col items-center justify-center border border-[#191714]/10 bg-[#F8F6F1] px-1 py-3 sm:py-4"
                  >
                    <span className="font-heading text-2xl tabular-nums text-black sm:text-3xl">
                      {String(value).padStart(2, "0")}
                    </span>

                    <span className="mt-1 text-[8px] font-medium uppercase tracking-[0.12em] text-black sm:text-[9px]">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Promotion progress */}
              <div className="mt-5">
                <div
                  className="h-[3px] overflow-hidden bg-[#EAE5DC]"
                  role="progressbar"
                  aria-label="Promotion duration elapsed"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(liveProgress)}
                >
                  <div
                    className="h-full bg-[#92764A] transition-[width] duration-700"
                    style={{
                      width: `${liveProgress}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-[9px] text-black">
                  {hasActiveCountdown
                    ? "Make the most of this special offer."
                    : "This promotion has ended."}
                </p>
              </div>
            </div>

            {/* CTA */}
            <Link
              href={`/products/${hotProduct.productSlug}`}
              className="group mt-8 inline-flex min-h-[54px] w-full items-center justify-between gap-4 bg-[#102B50] px-6 py-4 text-white transition-colors duration-300 hover:bg-[#92764A] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#102B50] sm:w-fit sm:min-w-[250px]"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.17em]">
                Discover this piece
              </span>

              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>

            <p className="mt-4 text-[9px] uppercase tracking-[0.13em] text-black">
              Thoughtfully selected. Made for your everyday.
            </p>
          </div>
        </motion.article>

        {/* Coupon offer */}
        {hotProduct.couponCode && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45 }}
            className="mt-5 flex flex-col gap-5 border border-[#92764A]/25 bg-white px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8"
          >
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center border border-[#92764A]/25 bg-[#F8F6F1] text-black">
                <Tag size={19} strokeWidth={1.5} />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black">
                  A little something extra
                </p>

                <p className="mt-1 text-sm leading-6 text-black">
                  {hotProduct.couponDescription ||
                    "Enjoy an additional discount at checkout."}
                </p>

                <p className="mt-1 text-[10px] text-black">
                  Enter your code at checkout.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyCoupon}
              aria-label={`Copy coupon code ${hotProduct.couponCode}`}
              className="group inline-flex min-h-[48px] items-center justify-between gap-5 border border-dashed border-[#92764A]/60 bg-[#F8F6F1] px-5 py-3 text-left transition-colors hover:border-[#102B50] hover:bg-[#102B50]/[0.04] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#92764A] sm:min-w-[210px]"
            >
              <span>
                <span className="block text-[9px] uppercase tracking-[0.15em] text-black">
                  Coupon code
                </span>

                <span className="mt-1 block text-sm font-semibold tracking-[0.12em] text-black">
                  {hotProduct.couponCode}
                </span>
              </span>

              {copied ? (
                <span className="text-xs font-semibold text-black">
                  Copied
                </span>
              ) : (
                <Copy
                  size={16}
                  className="shrink-0 text-black transition-transform group-hover:scale-110"
                />
              )}
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
