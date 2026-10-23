"use client";

import Image from "@/components/ui/AppImage";
import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import type { Product, ProductVariant } from "@/types/product";

export default function StickyBar({
  product,
  finalPrice,
  handleAddToCart,
}: {
  product: Product;
  selectedVariant?: ProductVariant | null;
  finalPrice: number;
  handleAddToCart: () => Promise<unknown>;
}) {
  const productImage = product.images?.[0] || "/placeholder.jpg";
  const [isLoading, setIsLoading] = useState(false);

  const onAddToCartClick = async () => {
    try {
      setIsLoading(true);
      console.log("Add to cart clicked from StickyBar");
      const result = await handleAddToCart();
      console.log("Add to cart result:", result);
    } catch (error) {
      console.error("Error in StickyBar add to cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="hidden md:flex fixed bottom-0 left-0 right-0 bg-white/90 border-t border-[#1B2E27]/10 shadow-[0_-10px_30px_rgba(11,77,59,0.18)] px-8 py-4 justify-between items-center z-50 backdrop-blur-md">
      {/* Product Info Section */}
      <div className="flex items-center gap-6 flex-1">
        {/* Product Image */}
        <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-white shadow-md border border-[#1B2E27]/10">
          <Image
            src={productImage}
            alt={product.name}
            width={96}
            height={96}
            className="w-full h-full object-contain p-2"
          />
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-black truncate">
            {product.name}
          </h3>
          <p className="text-sm text-black line-clamp-2 mt-1">
            {product.shortDescription}
          </p>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-2xl font-bold text-black">
              ₹{finalPrice}
            </span>
            {product.discountPrice && (
              <span className="text-sm font-semibold text-black bg-white px-3 py-1 rounded-full border border-[#1B2E27]/20">
                {Math.round(
                  ((product.basePrice - product.discountPrice) /
                    product.basePrice) *
                    100,
                )}
                % OFF
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={onAddToCartClick}
        disabled={isLoading}
        className="flex-shrink-0 flex items-center gap-2 bg-[#233B32] text-white font-bold px-8 py-3.5 rounded-xl hover:bg-[#1B2E27] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl whitespace-nowrap ml-6"
      >
        <ShoppingBag size={20} />
        {isLoading ? "Adding..." : "Add to Cart"}
      </button>
    </div>
  );
}


