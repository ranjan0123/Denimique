"use client";

import type { Dispatch, SetStateAction } from "react";
import { Star, ShoppingBag } from "lucide-react";
import { Product, ProductVariant } from "@/types/product";

export default function ProductInfo({
  product,
  selectedVariant,
  setSelectedVariant,
  quantity,
  setQuantity,
  finalPrice,
  onAddToCart,
}: {
  product: Product;
  selectedVariant: ProductVariant | null;
  setSelectedVariant: Dispatch<SetStateAction<ProductVariant | null>>;
  quantity: number;
  setQuantity: Dispatch<SetStateAction<number>>;
  finalPrice: number;
  onAddToCart: () => void;
}) {
  return (
    <div>
      <h1 className="text-4xl font-bold text-black mb-4">{product.name}</h1>

      <div className="flex items-center gap-2 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={18} className="fill-[#1B2E27] text-black" />
        ))}
        <span className="text-black text-sm">
          ({product.reviewCount} reviews)
        </span>
      </div>

      <p className="text-3xl font-bold text-black mb-6">₹{finalPrice}</p>

      {/* Variants */}
      {product.variants && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Select Pack Size:</h3>
          <div className="flex gap-4">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant)}
                className="px-4 py-2 border rounded-full"
              >
                {variant.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setQuantity(quantity > 1 ? quantity - 1 : 1)}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          -
        </button>
        <span>{quantity}</span>
        <button
          onClick={() => setQuantity(quantity + 1)}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          +
        </button>
      </div>

      <button
        onClick={onAddToCart}
        className="w-full bg-[#233B32] text-white font-medium py-2.5 px-4 rounded-lg hover:bg-[#1B2E27] transition-all duration-300 shadow-sm hover:shadow-md flex justify-center gap-2"
      >
        <ShoppingBag size={18} />
        Add to Cart
      </button>
    </div>
  );
}


