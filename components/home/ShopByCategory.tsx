"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "@/components/ui/AppImage";
import toast from "react-hot-toast";
import type { Product } from "@/types/product";
import { getApiErrorMessage } from "@/lib/api";
import { getProductPrimaryImage, getProducts } from "@/lib/storefront";
import { useCartStore } from "@/store/cartStore";

interface NewArrivalsProps {
  initialProducts?: Product[];
}

const SIZES = ["M", "L", "XL", "2XL"];

export default function NewArrivals({ initialProducts = [] }: NewArrivalsProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const { addToCart } = useCartStore();

  useEffect(() => {
    if (initialProducts.length > 0) {
      return;
    }

    const loadProducts = async () => {
      try {
        // The API already returns products newest-first.
        const items = await getProducts({ limit: 4 });
        setProducts(items);
      } catch (error) {
        console.error("Failed to load new arrivals:", error);
      }
    };

    loadProducts();
  }, [initialProducts.length]);

  const handleAddToCart = async (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await addToCart(product._id || product.id, 1);
      toast.success("Added to cart");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to add to cart"));
    }
  };

  const visibleProducts = products.slice(0, 4);

  if (visibleProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-14">
          <div>
            <span className="text-gray-400 font-medium tracking-wide uppercase text-xs">
              Just Dropped
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-black mt-2">
              New Arrivals
            </h2>
          </div>

          <Link
            href="/shop"
            className="hidden sm:flex items-center gap-2 text-sm font-medium text-black hover:opacity-70 transition-opacity"
          >
            View All Collection
            <span aria-hidden="true">{"->"}</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {visibleProducts.map((product) => {
            const price = product.discountPrice || product.basePrice;
            const hasVariants = Boolean(product.variants && product.variants.length);
            const isSoldOut = hasVariants
              ? product.variants!.every((variant) => variant.stock <= 0)
              : false;

            return (
              <div key={product.id} className="group">
                <Link
                  href={`/products/${product.slug}`}
                  className="relative block overflow-hidden bg-[#F5F5F3] mb-5"
                >
                  <Image
                    src={getProductPrimaryImage(product)}
                    alt={product.name}
                    width={480}
                    height={480}
                    className="w-full h-[300px] object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={isSoldOut}
                    className={`absolute inset-x-0 bottom-0 py-3 text-sm font-medium tracking-wide transition-colors ${
                      isSoldOut
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-[#102B50] text-white hover:bg-[#0C2446]"
                    }`}
                  >
                    {isSoldOut ? "Sold Out" : "Add to Cart"}
                  </button>
                </Link>

                <div className="flex gap-2 mb-4">
                  {SIZES.map((size) => (
                    <span
                      key={size}
                      className="w-10 h-9 flex items-center justify-center text-xs font-medium bg-gray-100 text-gray-500"
                    >
                      {size}
                    </span>
                  ))}
                </div>

                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  {product.category?.name || "Shop"}
                </span>
                <h3 className="text-lg font-semibold text-black mt-1">
                  {product.name}
                </h3>
                <p className="text-red-500 font-medium mt-1">
                  {"₹"} {price}
                  {product.discountPrice && (
                    <span className="text-gray-400 text-sm line-through ml-2">
                      {"₹"} {product.basePrice}
                    </span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}