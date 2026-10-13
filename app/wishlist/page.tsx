"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "@/components/ui/AppImage";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useCartStore } from "@/store/cartStore";

export default function WishlistPage() {
  const { hasInitialized } = useAuthStore();
  const {
    items,
    isLoading,
    hasHydrated,
    loadWishlist,
    removeFromWishlist,
  } = useWishlistStore();
  const { addToCart } = useCartStore();

  useEffect(() => {
    if (hasInitialized) {
      loadWishlist();
    }
  }, [hasInitialized, loadWishlist]);

  if (!hasInitialized || !hasHydrated || isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-16 px-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-10"></div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-gray-200"></div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-24 max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-[#7A3511] mb-4">
          Your wishlist is empty
        </h1>
        <p className="text-gray-500 mb-8">
          Save products you love and revisit them later.
        </p>
        <Link
          href="/shop"
          className="inline-block bg-[#7A3511] text-white px-8 py-3 rounded-xl hover:opacity-90 transition"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <section className="py-16 px-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-10 gap-4">
        <h1 className="text-4xl font-bold text-[#7A3511]">Wishlist</h1>
        <Link
          href="/shop"
          className="text-sm font-semibold text-[#7A3511] hover:text-[#5A260F]"
        >
          Continue shopping
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="flex justify-center">
              <Image
                src={item.image || "/logo-removebg-preview.png"}
                alt={item.name}
                width={180}
                height={220}
                className="h-40 w-40 object-contain"
              />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[#7A3511]">
              {item.name}
            </h3>
            {item.price !== undefined && (
              <p className="mt-1 text-sm text-[#8C7466] font-semibold">
                Rs. {item.price}
              </p>
            )}
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await addToCart(item.productId, 1);
                    toast.success("Added to cart");
                  } catch (error) {
                    toast.error("Unable to add to cart");
                  }
                }}
                className="flex-1 rounded-lg bg-[#102B50] text-white font-semibold py-2.5 px-4 hover:bg-[#0C2446] transition-all duration-300 shadow-sm hover:shadow-md text-sm"
              >
                Add to Cart
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await removeFromWishlist(item.id);
                    toast.success("Removed from wishlist");
                  } catch (error) {
                    toast.error("Unable to remove");
                  }
                }}
                className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
              >
                Remove
              </button>
            </div>
            {item.slug && (
              <Link
                href={`/products/${item.slug}`}
                className="mt-3 inline-block text-xs font-semibold text-[#7A3511] hover:text-[#5A260F]"
              >
                View product
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}


