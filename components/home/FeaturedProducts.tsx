"use client";

import { useEffect, useState } from "react";
import Image from "@/components/ui/AppImage";
import Link from "next/link";
import { ShoppingBag, Star, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/api";
import {
  formatProductPrice,
  getProductPrimaryImage,
  getProducts,
} from "@/lib/storefront";
import { Product } from "@/types/product";

interface FeaturedFlavorsProps {
  initialProducts?: Product[];
}

export default function FeaturedFlavors({
  initialProducts = [],
}: FeaturedFlavorsProps) {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(initialProducts.length === 0);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCartStore();
  const { items: wishlistItems, loadWishlist, addToWishlist, removeFromWishlist } =
    useWishlistStore();

  useEffect(() => {
    if (initialProducts.length > 0) {
      return;
    }

    const loadFeaturedProducts = async () => {
      try {
        setError(null);
        const products = await getProducts({ limit: 100, isFeatured: true });
        setFeaturedProducts(products);
      } catch (loadError) {
        setError(
          getApiErrorMessage(
            loadError,
            "Unable to load featured products right now.",
          ),
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedProducts();
  }, [initialProducts.length]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const toggleWishlist = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const existing = wishlistItems.find((item) => item.productId === productId);

    try {
      if (existing) {
        await removeFromWishlist(existing.id);
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(productId);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      toast.error("Unable to update wishlist");
    }
  };

  const handleAddToCart = async (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await addToCart(product._id || product.id, 1);
      toast.success("Added to cart");
    } catch (error) {
      toast.error("Unable to add to cart");
    }
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-[#FAF8F6]">
        <div className="max-w-7xl mx-auto px-6 animate-pulse">
          <div className="h-10 w-56 bg-gray-200 rounded mb-4"></div>
          <div className="h-5 w-72 bg-gray-200 rounded mb-12"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-[520px] rounded-3xl bg-gray-200"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-[248px] rounded-2xl bg-gray-200"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || featuredProducts.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-white py-16 md:py-20">
      <div className="pointer-events-none absolute inset-0 z-0 bg-white" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-5 md:px-6 relative z-10">
        <div className="flex items-start justify-between mb-10 md:mb-12 gap-4">
          <div className="max-w-[75%]">
            <h2 className="text-2xl md:text-4xl font-bold text-[#102B50]">
              Featured Styles
            </h2>
            <p className="text-gray-600 mt-2 text-sm md:text-base">
              Curated picks with a bold, premium fashion profile.
            </p>
          </div>

          <Link
            href="/shop"
            className="whitespace-nowrap bg-[#102B50] text-white border border-[#102B50] px-4 md:px-5 py-2 rounded-full text-sm md:text-base font-semibold hover:bg-[#1F2822] transition"
          >
            View All {"->"}
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {featuredProducts.slice(0, 8).map((product) => {
            const isWishlisted = wishlistItems.some(
              (item) => item.productId === (product._id || product.id),
            );
            const price = product.price ?? product.discountPrice ?? product.basePrice;
            const discount =
              product.discountPrice &&
              Math.round(
                ((product.basePrice - product.discountPrice) / product.basePrice) *
                  100,
              );
            const hasVariants = Boolean(product.variants && product.variants.length);
            const primaryVariant = hasVariants ? product.variants![0] : undefined;
            const isSoldOut = hasVariants
              ? product.variants!.every((variant) => variant.stock <= 0)
              : false;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <Link
                  href={`/products/${product.slug}`}
                  className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#173F70]/10 bg-white p-4 shadow-[0_8px_24px_rgba(23,63,112,0.08)] transition-all duration-300 hover:shadow-[0_14px_34px_rgba(23,63,112,0.14)] group md:p-5"
                >
                  <div className="absolute left-0 top-4 z-20 h-8 w-[3px] rounded-full bg-[#173F70]" />

                  <div className="relative -mx-4 -mt-4 mb-4 aspect-[4/5] overflow-hidden rounded-t-xl bg-[#FFF4E3] md:-mx-5 md:-mt-5">
                    {getProductPrimaryImage(product) && (
                      <Image
                        src={getProductPrimaryImage(product)}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    )}

                    <div className="absolute left-2 top-2 z-20 flex flex-wrap gap-2 md:left-3 md:top-3">
                      <span className="bg-[#F2545B] text-white text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-sm">
                        Featured
                      </span>
                    </div>

                    <div className="absolute right-2 top-2 z-20 flex flex-wrap gap-2 md:right-3 md:top-3">
                      {isSoldOut && (
                        <span className="bg-gray-200 text-gray-700 text-[11px] font-semibold px-2.5 py-1 rounded-md">
                          Sold out
                        </span>
                      )}
                      {(discount ?? 0) > 0 && !isSoldOut && (
                        <span className="border border-[#173F70]/30 bg-white text-[#173F70] text-[11px] font-semibold px-2.5 py-1 rounded-md">
                          On sale
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => toggleWishlist(product._id || product.id, e)}
                      className="absolute right-2 bottom-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white md:right-3 md:bottom-3"
                    >
                      <Heart
                        size={16}
                        className={`transition-all duration-300 ${
                          isWishlisted
                            ? "fill-[#173F70] text-[#173F70]"
                            : "text-[#102B50]"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col">
                    <h3 className="mb-2 min-h-[40px] text-[13px] font-semibold text-[#102B50] md:min-h-[44px] md:text-sm">
                      {product.name}
                    </h3>

                    <div className="mb-3 flex min-h-[20px] items-center gap-1">
                      {product.rating ? (
                        <>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={`${
                                i < Math.round(product.rating || 0)
                                  ? "fill-[#55779E] text-[#55779E]"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-xs text-gray-500">
                            {product.reviewCount || 0} | Ratings
                          </span>
                        </>
                      ) : null}
                    </div>

                    <div className="mb-3 rounded-lg border border-[#173F70]/15 bg-white px-3 py-2 text-center text-xs text-gray-700 md:text-sm">
                      {primaryVariant?.label ? `${primaryVariant.label} - ` : ""}
                      {"\u20B9"} {primaryVariant?.discountPrice || primaryVariant?.price || price}
                    </div>

                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="whitespace-nowrap text-[13px] font-semibold text-[#173F70] md:text-sm">
                          {"\u20B9"} {price}
                        </div>
                        {product.discountPrice && (
                          <div className="whitespace-nowrap text-[11px] text-gray-400 line-through md:text-xs">
                            MRP {"\u20B9"} {product.basePrice}
                          </div>
                        )}
                      </div>
                      {product.rating ? (
                        <div className="whitespace-nowrap text-[11px] text-gray-600 md:text-xs">
                          {product.rating.toFixed(1)} {"\u2605"}
                        </div>
                      ) : null}
                    </div>

                    <button
                      onClick={(e) => handleAddToCart(product, e)}
                      disabled={isSoldOut}
                      className={`mt-auto flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold transition-all duration-300 ${
                        isSoldOut
                          ? "cursor-not-allowed bg-gray-200 text-gray-500"
                          : "bg-[#102B50] text-white hover:bg-[#0C2446]"
                      }`}
                    >
                      {isSoldOut ? "Sold Out" : "Add to Cart"}
                    </button>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}



