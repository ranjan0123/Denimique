"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "@/components/ui/AppImage";
import { ShoppingBag, Star, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import toast from "react-hot-toast";
import { Product } from "@/types/product";
import { getApiErrorMessage } from "@/lib/api";
import {
  formatProductPrice,
  getProductPrimaryImage,
  getProducts,
} from "@/lib/storefront";

interface BestSellersProps {
  initialProducts?: Product[];
}

export default function BestSellers({ initialProducts = [] }: BestSellersProps) {
  const [bestSellerProducts, setBestSellerProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(initialProducts.length === 0);
  const { addToCart } = useCartStore();
  const { items: wishlistItems, loadWishlist, addToWishlist, removeFromWishlist } =
    useWishlistStore();

  useEffect(() => {
    if (initialProducts.length > 0) {
      return;
    }

    const loadBestSellers = async () => {
      try {
        const products = await getProducts({ limit: 100, isBestSeller: true });
        setBestSellerProducts(products);
      } catch (error) {
        console.error(getApiErrorMessage(error, "Failed to load best sellers"));
      } finally {
        setIsLoading(false);
      }
    };

    loadBestSellers();
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
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 animate-pulse">
          <div className="h-10 w-56 bg-gray-200 rounded mb-4"></div>
          <div className="h-5 w-72 bg-gray-200 rounded mb-12"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[430px] rounded-2xl bg-gray-200"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (bestSellerProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-5 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="flex items-start justify-between mb-10 md:mb-12 gap-4"
        >
          <div className="max-w-[75%]">
            <h2 className="text-2xl md:text-4xl font-bold text-black">
              Our Best Sellers!
            </h2>
            <p className="text-black mt-2 text-sm md:text-base">
              Discover the styles Denimique customers come back for.
            </p>
          </div>

          <Link
            href="/shop"
            className="whitespace-nowrap bg-[#102B50] text-white border border-[#102B50] px-4 md:px-5 py-2 rounded-full text-sm md:text-base font-semibold hover:bg-[#1F2822] transition"
          >
            View All {"->"}
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {bestSellerProducts.map((product) => {
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
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                whileHover={{ y: -4 }}
              >
                <Link
                  href={`/products/${product.slug}`}
                  className="relative overflow-hidden bg-white rounded-2xl p-4 md:p-5 border border-gray-200 shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.12)] transition-all duration-300 group block"
                >
                <div className="absolute left-3 top-3 z-20 flex flex-wrap gap-2">
                  {product.isBestSeller && (
                    <span className="bg-[#F2545B] text-white text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-sm">
                      Best Seller
                    </span>
                  )}
                </div>

                <div className="absolute right-3 top-3 z-20 flex flex-wrap gap-2">
                  {isSoldOut && (
                    <span className="bg-gray-200 text-black text-[11px] font-semibold px-2.5 py-1 rounded-md">
                      Sold out
                    </span>
                  )}
                  {(discount ?? 0) > 0 && !isSoldOut && (
                    <span className="bg-white border border-[#173F70]/30 text-black text-[11px] font-semibold px-2.5 py-1 rounded-md">
                      On sale
                    </span>
                  )}
                </div>      

                <button
                  onClick={(e) => toggleWishlist(product._id || product.id, e)}
                  className="absolute right-3 top-3 z-20 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-[#55779E]/10"
                >
                  <Heart
                    size={16}
                    className={`transition-all duration-300 ${
                      isWishlisted
                        ? "fill-[#55779E] text-black"
                        : "text-black"
                    }`}
                  />
                </button>

                <div className="relative -mx-4 -mt-4 md:-mx-5 md:-mt-5 mb-4 aspect-[4/5] overflow-hidden rounded-t-2xl bg-[#F1F4F8]">
                  {getProductPrimaryImage(product) && (
                    <Image
                      src={getProductPrimaryImage(product)}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <button
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={isSoldOut}
                    className={`absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-2 py-2.5 text-xs md:text-sm font-semibold transition-all duration-300 ${
                      isSoldOut
                        ? "bg-gray-200 text-black cursor-not-allowed"
                        : "bg-[#233B32] text-white hover:bg-[#1B2E27]"
                    }`}
                  >
                    <ShoppingBag size={14} />
                    {isSoldOut ? "Sold Out" : "Add to Cart"}
                  </button>
                </div>

                <h3 className="text-black font-semibold mb-2 text-[13px] md:text-sm min-h-[40px] md:min-h-[44px]">
                  {product.name}
                </h3>

                {product.rating ? (
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={`${
                          i < Math.round(product.rating || 0)
                            ? "fill-[#55779E] text-black"
                            : "text-black"
                        }`}
                      />
                    ))}
                    <span className="text-xs text-black ml-1">
                      {product.reviewCount || 0} | Ratings
                    </span>
                  </div>
                ) : null}

                <div className="border border-gray-200 rounded-lg px-3 py-2 text-center text-xs md:text-sm text-black mb-3">
                  {primaryVariant?.label ? `${primaryVariant.label} - ` : ""}
                  {formatProductPrice(primaryVariant?.discountPrice || primaryVariant?.price || price)}
                </div>

                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="text-[13px] md:text-sm font-semibold text-black whitespace-nowrap">
                      {formatProductPrice(price)}
                    </div>
                    {product.discountPrice && (
                      <div className="text-[11px] md:text-xs text-black line-through whitespace-nowrap">
                        MRP {formatProductPrice(product.basePrice)}
                      </div>
                    )}
                  </div>
                  {product.rating ? (
                    <div className="text-[11px] md:text-xs text-black whitespace-nowrap">
                      {product.rating.toFixed(1)} {"\u2605"}
                    </div>
                  ) : null}
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









