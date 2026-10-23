"use client";

import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import type { Product, ProductVariant } from "@/types/product";

export default function MobileStickyBar({
  product,
  finalPrice,
  handleAddToCart,
}: {
  product: Product;
  selectedVariant?: ProductVariant | null;
  finalPrice: number;
  handleAddToCart: () => Promise<void>;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const onAddToCartClick = async () => {
    try {
      setIsLoading(true);
      await handleAddToCart();
    } catch (error) {
      console.error("Error in MobileStickyBar add to cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 border-t border-[#1B2E27]/10 shadow-[0_-10px_30px_rgba(11,77,59,0.18)] px-4 py-3 flex justify-between items-center z-50 backdrop-blur-md gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-black truncate">
          {product?.name || "Product"}
        </p>
        <p className="text-xl font-bold text-black">₹{finalPrice}</p>
      </div>

      <button
        onClick={onAddToCartClick}
        disabled={isLoading}
        className="flex-shrink-0 flex items-center gap-1.5 bg-[#233B32] text-white font-bold px-5 py-2.5 rounded-lg hover:bg-[#1B2E27] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl"
      >
        <ShoppingBag size={18} />
        <span className="hidden xs:inline">
          {isLoading ? "Adding..." : "Add"}
        </span>
      </button>
    </div>
  );
}


