"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "@/components/ui/AppImage";
import { ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";
import { getProductPrimaryImage, getProducts } from "@/lib/storefront";
import type { Product } from "@/types/product";
import { getMainCategoryId } from "@/lib/catalog";

const RECOMMENDED_LIMIT = 4;

interface RecommendedProductsProps {
  excludeProductIds: string[];
}

export default function RecommendedProducts({
  excludeProductIds,
}: RecommendedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCartStore();

  useEffect(() => {
    let isMounted = true;

    const loadRecommended = async () => {
      try {
        // The API sorts newest-first. A small page therefore kept returning
        // the same recently added jeans instead of considering the full store.
        const items = await getProducts({ limit: 5000 });
        if (!isMounted) return;

        const excluded = new Set(excludeProductIds);
        const notInCart = items.filter(
          (product) => !excluded.has(product._id || product.id),
        );
        const cartProducts = items.filter((product) =>
          excluded.has(product._id || product.id),
        );
        const cartSubcategories = new Set(
          cartProducts.map((product) => product.subcategory?.slug).filter(Boolean),
        );
        const cartCategories = new Set(
          cartProducts.map((product) => product.category?.slug).filter(Boolean),
        );
        const cartMainCategories = new Set(
          cartProducts.map(getMainCategoryId).filter(Boolean),
        );

        const related = notInCart
          .map((product) => {
            const score =
              (product.subcategory?.slug && cartSubcategories.has(product.subcategory.slug) ? 4 : 0) +
              (product.category?.slug && cartCategories.has(product.category.slug) ? 3 : 0) +
              (getMainCategoryId(product.category) && cartMainCategories.has(getMainCategoryId(product.category)) ? 1 : 0);
            return { product, score };
          })
          .filter(({ score }) => score > 0)
          .sort((a, b) =>
            b.score - a.score ||
            Number(Boolean(b.product.isBestSeller || b.product.isFeatured)) -
              Number(Boolean(a.product.isBestSeller || a.product.isFeatured)),
          )
          .map(({ product }) => product);

        // If the cart has no usable category data, show a category-diverse
        // selection from the full catalog instead of its newest records only.
        const fallbackCandidates = [...notInCart].sort(
          (a, b) =>
            Number(Boolean(b.isBestSeller || b.isFeatured)) -
            Number(Boolean(a.isBestSeller || a.isFeatured)),
        );
        const candidates = related.length ? related : fallbackCandidates;
        const seenCategories = new Set<string>();
        const diverseFallback = candidates.filter((product) => {
          const category = product.category?.slug || product.collection || product._id || product.id;
          if (seenCategories.has(category)) return false;
          seenCategories.add(category);
          return true;
        });
        const picks = (related.length ? related : diverseFallback).slice(0, RECOMMENDED_LIMIT);

        setProducts(picks);
      } catch {
        // Recommendations are a bonus on the cart page, not critical —
        // fail quietly instead of interrupting checkout.
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadRecommended();

    return () => {
      isMounted = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excludeProductIds.join(",")]);

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product._id || product.id, 1);
      toast.success("Added to cart");
    } catch {
      toast.error("Unable to add to cart");
    }
  };

  if (!isLoading && products.length === 0) return null;

  return (
    <div className="mt-10 border-t border-gray-200 pt-8">
      <h2 className="text-xl font-bold text-black">You May Also Like</h2>
      <p className="mt-1 text-sm text-black">
        Picks that pair well with what&apos;s in your cart.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {isLoading
          ? [...Array(RECOMMENDED_LIMIT)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white"
              >
                <div className="aspect-[4/5] bg-gray-200" />
                <div className="space-y-2 p-3">
                  <div className="h-4 w-4/5 rounded bg-gray-200" />
                  <div className="h-4 w-1/2 rounded bg-gray-200" />
                </div>
              </div>
            ))
          : products.map((product) => {
              const price = product.discountPrice || product.basePrice;

              return (
                <div
                  key={product.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <Link
                    href={`/products/${product.slug}`}
                    className="relative block aspect-[4/5] overflow-hidden bg-[#faf8f6]"
                  >
                    <Image
                      src={getProductPrimaryImage(product)}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  </Link>

                  <div className="flex flex-1 flex-col p-3">
                    <Link
                      href={`/products/${product.slug}`}
                      className="line-clamp-2 min-h-[36px] text-sm font-semibold text-black hover:text-black"
                    >
                      {product.name}
                    </Link>

                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-sm font-bold text-black">
                        Rs. {price}
                      </span>
                      {product.discountPrice && (
                        <span className="text-xs text-black line-through">
                          Rs. {product.basePrice}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#102B50] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#0C2446]"
                    >
                      <ShoppingBag size={13} />
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
