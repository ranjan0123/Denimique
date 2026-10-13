"use client";

import { useEffect, useState } from "react";
import Image from "@/components/ui/AppImage";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
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

  useEffect(() => {
    if (initialHotProduct !== undefined) {
      return;
    }

    const fetchHotProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/hot-product`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 404) {
            setHotProduct(null);
            setError(null);
            return;
          }
          throw new Error(`Failed to fetch hot product: ${response.status}`);
        }

        const data: IHotProduct = await response.json();
        setHotProduct(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to fetch hot product");
        console.error("Error fetching hot product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHotProduct();
  }, [initialHotProduct]);

  useEffect(() => {
    if (!hotProduct) return;

    const calculateTimeLeft = () => {
      const startDate = new Date(hotProduct.displayDuration.startDate).getTime();
      const endDate = new Date(hotProduct.displayDuration.endDate).getTime();
      const now = new Date().getTime();
      const difference = endDate - now;

      if (Number.isFinite(startDate) && Number.isFinite(endDate) && endDate > startDate) {
        const elapsed = now - startDate;
        const total = endDate - startDate;
        const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
        setLiveProgress(progress);
      } else {
        setLiveProgress(hotProduct.progressPercentage || 0);
      }

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
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
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [hotProduct]);

  const handleCopyCoupon = () => {
    if (hotProduct?.couponCode) {
      navigator.clipboard.writeText(hotProduct.couponCode);
      toast.success("Coupon code copied!");
    }
  };

  if (!loading && !hotProduct) {
    return null;
  }

  if (loading) {
    return (
      <section className="py-10 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl p-8 animate-pulse">
            <div className="h-40 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    console.error("Error loading hot product:", error);
    return null;
  }

  if (!hotProduct) {
    return null;
  }

  return (
    <section className="relative py-12 md:py-16 bg-[#FAF8F6] overflow-hidden">
      {/* Unique ambient background for Hot Product */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -left-24 -top-24 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(111,138,69,0.24),transparent_65%)] animate-[featured-glow_10s_ease-in-out_infinite]" />
        <div className="absolute right-[-120px] bottom-[-80px] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(245,200,86,0.35),transparent_70%)] animate-[featured-glow_12s_ease-in-out_infinite]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(23,63,112,0.08),rgba(255,255,255,0))] bg-[length:300%_100%] animate-[featured-sweep_16s_ease-in-out_infinite]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex items-start justify-between mb-8 gap-4">
          <div className="max-w-[70%]">
            <h2 className="text-2xl md:text-3xl font-bold text-[#102B50]">
              Hot Product for <span className="text-[#6F8A45]">This Week</span>
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Limited time exclusive offer.
            </p>
          </div>

          <Link
            href="/shop"
            className="bg-[#102B50] text-white border border-[#102B50] px-4 sm:px-5 py-2 rounded-full text-sm sm:text-base font-semibold whitespace-nowrap hover:bg-[#1F2822] transition inline-flex items-center gap-2"
          >
            View All
            <ArrowRight size={16} />
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative bg-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-8 shadow-[0_14px_36px_rgba(23,63,112,0.14)] border border-[#C9783D]/20 backdrop-blur-md"
        >
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#6F8A45]/10 via-[#55779E]/10 to-[#55779E]/10 blur-xl -z-10"></div>

          <div className="absolute -top-5 -left-5 bg-[#C9783D] text-white text-sm font-bold px-4 py-3 rounded-full shadow-lg">
            {hotProduct.discountPercentage}% OFF
          </div>

          <div className="flex-shrink-0">
            <Image
              src={resolveApiAssetUrl(hotProduct.productImage)}
              alt={hotProduct.productName}
              width={160}
              height={220}
              className="drop-shadow-xl object-contain rounded-lg"
              priority
            />
          </div>

          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg md:text-xl font-semibold text-[#102B50] mb-2">
              {hotProduct.productName}
            </h3>

            <div className="flex justify-center md:justify-start items-center gap-3 mb-4">
              <span className="text-gray-400 line-through text-sm">
                Rs {hotProduct.originalPrice}
              </span>
              <span className="text-[#55779E] font-bold text-xl">
                Rs {hotProduct.discountedPrice}
              </span>
            </div>

            <div className="w-full bg-gray-200 h-2 rounded-full mb-5">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-[#6F8A45] via-[#55779E] to-[#173F70] transition-all duration-500"
                style={{ width: `${liveProgress}%` }}
              ></div>
            </div>

            <div className="flex justify-center md:justify-start gap-3 mb-5 flex-wrap">
              {Object.entries(timeLeft).map(([label, value]) => (
                <div
                  key={label}
                  className="bg-[#F7F7F7] px-3 py-2 rounded-lg text-center min-w-[55px] border border-[#6F8A45]/20"
                >
                  <div className="text-sm font-bold text-[#102B50]">
                    {String(value).padStart(2, "0")}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">
                    {label}
                  </div>
                </div>
              ))}
            </div>

            <Link
              href={`/products/${hotProduct.productSlug}`}
              className="inline-block bg-[#55779E] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:scale-105 hover:bg-[#0C2446] transition"
            >
              Shop Now
            </Link>
          </div>
        </motion.div>

        {hotProduct.couponCode && (
          <div className="mt-6 bg-white rounded-2xl border border-[#173F70]/25 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <p className="text-sm text-[#173F70] font-medium text-center sm:text-left">
              {hotProduct.couponDescription ||
                "Extra discount for your first purchase"}
            </p>

            <button
              onClick={handleCopyCoupon}
              className="border-2 border-dashed border-[#6F8A45] px-5 py-1.5 rounded-full text-sm font-bold text-[#6F8A45] hover:bg-[#6F8A45]/10 transition"
            >
              {hotProduct.couponCode}
            </button>

            <span className="text-xs text-gray-500">Apply at checkout</span>
          </div>
        )}
      </div>
    </section>
  );
}



