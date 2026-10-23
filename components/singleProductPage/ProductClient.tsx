"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import toast from "react-hot-toast";
import { Product } from "@/types/product";
import { getProducts } from "@/lib/storefront";
import ProductGallery from "./ProductGallery";
import MobileStickyBar from "./MobileStickyBar";
import { Star, Heart, ShoppingBag, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import Image from "@/components/ui/AppImage";
import {
  getProductCategoryName,
  getProductPrimaryImage,
} from "@/lib/storefront";

const FASHION_KEYWORDS = [
  "kurta",
  "kurtas",
  "saree",
  "sarees",
  "lehenga",
  "lehenga choli",
  "dress",
  "dresses",
  "ethnic",
  "fusion",
  "shirt",
  "shirts",
  "t-shirt",
  "tshirt",
  "tees",
  "blazer",
  "blazers",
  "jacket",
  "jackets",
  "suit",
  "suits",
  "gown",
  "gowns",
  "top",
  "tops",
  "trouser",
  "trousers",
  "jeans",
  "leggings",
  "dupatta",
  "sherwani",
  "apparel",
  "fashion",
  "women",
  "womens",
  "mens",
  "men",
  "womenswear",
  "menswear",
  "indian clothing",
  "premium fashion",
  "partywear",
  "festive",
  "ethnic wear",
  "casual wear",
  "co-ord",
  "coord",
  "set",
  "outfit",
  "look",
];

const normalizeFashionSignal = (value: string): string[] => {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .map((part) => part.trim())
        .filter(Boolean)
        .filter((part) => part.length > 2),
    ),
  );
};

const getFashionSignals = (...sources: Array<string | string[] | null | undefined>) => {
  const tokens = new Set<string>();

  for (const source of sources) {
    if (!source) continue;

    const values = Array.isArray(source) ? source : [source];

    for (const value of values) {
      if (!value || typeof value !== "string") continue;

      const normalized = value.toLowerCase();
      const directMatches = FASHION_KEYWORDS.filter((keyword) =>
        normalized.includes(keyword),
      );

      directMatches.forEach((match) => tokens.add(match));

      normalizeFashionSignal(value).forEach((token) => tokens.add(token));
    }
  }

  return Array.from(tokens);
};

export default function ProductClient({ product }: { product: Product }) {
  const { addToCart } = useCartStore();
  const {
    items: wishlistItems,
    loadWishlist,
    addToWishlist,
    removeFromWishlist,
  } = useWishlistStore();

  const [selectedImage, setSelectedImage] = useState(
    getProductPrimaryImage(product),
  );
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants?.[0] || null,
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<
    "details" | "highlights" | "fabric" | "care"
  >("details");
  const [isNearFooter, setIsNearFooter] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);

  const productHighlights =
    product.highlights && product.highlights.length > 0
      ? product.highlights
      : [
          "Premium fabric sourced from trusted mills.",
          "Hand-finished stitching and detailing.",
          "Every piece quality-checked before packing.",
          "Designed for festive and everyday occasions.",
        ];

  const productCare =
    product.careInstructions && product.careInstructions.length > 0
      ? product.careInstructions
      : ["Gentle hand wash", "Air dry", "Avoid direct bleach"];

  const finalPrice =
    selectedVariant?.price || product.discountPrice || product.basePrice;

  const hasDiscount =
    typeof product.discountPrice === "number" &&
    product.discountPrice < product.basePrice;

  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.basePrice - (product.discountPrice || 0)) /
          product.basePrice) *
          100,
      )
    : 0;

  const stockAvailable = selectedVariant?.stock ?? 999;

  useEffect(() => {
    const handleScroll = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 400;
      setIsNearFooter(nearBottom);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  // Smart algorithm to calculate relevance score for related products
  const calculateRelevanceScore = (candidate: Product): number => {
    let score = 0;

    if (candidate._id === product._id) {
      return -1;
    }

    const candidateTags = candidate.tags?.map((tag) => tag.toLowerCase()) || [];
    const productTags = product.tags?.map((tag) => tag.toLowerCase()) || [];

    const productSignals = getFashionSignals(
      product.name,
      product.shortDescription,
      product.category?.name,
      product.category?.slug,
      product.mainCategory?.name,
      product.mainCategory?.slug,
      product.tags,
      product.flavor,
    );

    const candidateSignals = getFashionSignals(
      candidate.name,
      candidate.shortDescription,
      candidate.category?.name,
      candidate.category?.slug,
      candidate.mainCategory?.name,
      candidate.mainCategory?.slug,
      candidate.tags,
      candidate.flavor,
    );

    const sharedFashionSignals = productSignals.filter((signal) =>
      candidateSignals.includes(signal),
    );

    if (sharedFashionSignals.length > 0) {
      score += sharedFashionSignals.length * 12;
    }

    // 1. Fusion priority
    const isFusionCandidate = candidateTags.includes("fusion") ||
      candidate.category?.slug === "fusion" ||
      candidate.category?.name.toLowerCase().includes("fusion") ||
      candidate.name.toLowerCase().includes("fusion");

    const isFusionSource = productTags.includes("fusion") ||
      product.category?.slug === "fusion" ||
      product.category?.name.toLowerCase().includes("fusion") ||
      product.name.toLowerCase().includes("fusion");

    if (isFusionSource && isFusionCandidate) {
      score += 30;
    }

    // 2. Category hierarchy matching
    if (candidate.mainCategory?.slug === product.mainCategory?.slug) {
      score += 15;
    }
    if (candidate.category?.slug === product.category?.slug) {
      score += 10;
    }
    if (candidate.subcategory?.slug === product.subcategory?.slug) {
      score += 5;
    }

    // 3. Price similarity
    const currentPrice = product.discountPrice || product.basePrice;
    const candidatePrice = candidate.discountPrice || candidate.basePrice;
    const priceDiff = Math.abs(currentPrice - candidatePrice);
    if (currentPrice > 0) {
      const pricePercentageDiff = (priceDiff / currentPrice) * 100;
      if (pricePercentageDiff <= 20) {
        score += 10;
      } else if (pricePercentageDiff <= 40) {
        score += 6;
      } else if (pricePercentageDiff <= 60) {
        score += 3;
      }
    }

    // 4. Flavor match
    if (
      candidate.flavor &&
      product.flavor &&
      candidate.flavor.toLowerCase() === product.flavor.toLowerCase()
    ) {
      score += 8;
    }

    // 5. Tags matching
    const matchingTags = productTags.filter((tag) =>
      candidateTags.includes(tag),
    );
    score += Math.min(matchingTags.length * 2, 15);

    // 6. Fashion keyword overlap across product names, tags, and category names
    const overlappingTextTerms = productTags.filter((tag) =>
      candidateTags.includes(tag) ||
      candidateSignals.some((signal) => signal === tag) ||
      productSignals.some((signal) => signal === tag),
    );
    score += Math.min(overlappingTextTerms.length * 4, 14);

    // 7. Ingredient similarity
    if (product.ingredients && candidate.ingredients) {
      const matchingIngredients = product.ingredients.filter((ingredient) =>
        candidate.ingredients?.some(
          (candIngredient) =>
            candIngredient.toLowerCase() === ingredient.toLowerCase(),
        ),
      );
      score += Math.min(matchingIngredients.length, 8);
    }

    // 8. Quality signals
    if (candidate.isBestSeller) {
      score += 3;
    }
    if (candidate.isFeatured) {
      score += 2;
    }
    if (candidate.rating && candidate.rating >= 4.0) {
      score += 2;
    }

    if (score <= 0) {
      return -1;
    }

    return score;
  };

  useEffect(() => {
    const loadRelatedProducts = async () => {
      try {
        const allProducts = await getProducts({ limit: 1000 });

        // Calculate scores for all products
        const scoredProducts = allProducts
          .map((p) => ({
            product: p,
            score: calculateRelevanceScore(p),
          }))
          .filter((item) => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 4)
          .map((item) => item.product);

        setRelatedProducts(scoredProducts);
      } catch (error) {
        console.error("Error loading related products:", error);
      } finally {
        setIsLoadingRelated(false);
      }
    };

    loadRelatedProducts();
  }, [product._id, product.category?.slug, product.mainCategory?.slug]);

  const toggleWishlist = async () => {
    const existing = wishlistItems.find(
      (item) => item.productId === (product._id || product.id),
    );

    try {
      if (existing) {
        await removeFromWishlist(existing.id);
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(product._id || product.id);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      toast.error("Unable to update wishlist");
    }
  };

  const handleAddToCart = async () => {
    console.log("handleAddToCart called with:", {
      productId: product._id || product.id,
      quantity,
      variantId: selectedVariant?.id,
      stockAvailable,
    });

    if (stockAvailable < quantity) {
      toast.error("Not enough stock available");
      return;
    }

    try {
      await addToCart(product._id || product.id, quantity, selectedVariant?.id);
      toast.success("Added to cart");
    } catch (error) {
      console.error("Cart error:", error);
      toast.error("Unable to add to cart");
    }
  };

  const toggleWishlistForRelated = async (relatedProduct: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const existing = wishlistItems.find(
      (item) => item.productId === (relatedProduct._id || relatedProduct.id),
    );

    try {
      if (existing) {
        await removeFromWishlist(existing.id);
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(relatedProduct._id || relatedProduct.id);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      toast.error("Unable to update wishlist");
    }
  };

  const handleAddToCartRelated = async (relatedProduct: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await addToCart(relatedProduct._id || relatedProduct.id, 1);
      toast.success("Added to cart");
    } catch (error) {
      toast.error("Unable to add to cart");
    }
  };

  return (
    <>
      <div className="relative overflow-hidden bg-white py-12 md:py-16">
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_left,rgba(122,53,17,0.07),transparent_36%)]" />

        <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-6">
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-black">
            <Link href="/shop" className="transition hover:text-black">
              Home
            </Link>
            <span>/</span>
            <span>{getProductCategoryName(product)}</span>
            <span>/</span>
            <span className="text-black">{product.name}</span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr]">
            <div className="space-y-6 lg:sticky lg:top-24">
              <div className="relative overflow-hidden rounded-[30px] rounded-tr-[64px] border border-[#f0e2d3] bg-white p-3 shadow-[0_22px_50px_rgba(73,49,35,0.08)] md:p-5">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1B2E27] via-[#D4AF37] to-[#1B2E27]" />
                <ProductGallery
                  images={product.images}
                  selectedImage={selectedImage}
                  setSelectedImage={setSelectedImage}
                />
              </div>

              <div className="hidden rounded-[28px] border border-[#f0e2d3] bg-[linear-gradient(165deg,#FFFFFF_0%,#FFF8EE_100%)] p-5 shadow-[0_14px_30px_rgba(73,49,35,0.05)] lg:block md:p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-black">
                  The Denimique Promise
                </p>
                <h3 className="mt-1 font-heading text-lg font-bold text-black">
                  Why You&apos;ll Love It
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-black">
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#1B2E27]" />
                    Premium fabric sourced from trusted mills.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#1B2E27]" />
                    Hand-finished stitching and detailing.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#1B2E27]" />
                    Every piece quality-checked before packing.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#1B2E27]" />
                    Suited for festive and everyday occasions.
                  </li>
                </ul>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-[#1B2E27]/10 bg-white px-3 py-2 font-semibold text-black">
                    Free delivery
                  </div>
                  <div className="rounded-xl border border-[#1B2E27]/10 bg-white px-3 py-2 font-semibold text-black">
                    Secure packaging
                  </div>
                  <div className="rounded-xl border border-[#1B2E27]/10 bg-white px-3 py-2 font-semibold text-black">
                    Quality assured
                  </div>
                  <div className="rounded-xl border border-[#1B2E27]/10 bg-white px-3 py-2 font-semibold text-black">
                    Easy returns
                  </div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[32px] border border-[#f0e2d3] bg-white p-5 shadow-[0_22px_50px_rgba(73,49,35,0.08)] md:p-7">
              <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[#D4AF37]/[0.08] blur-3xl" />

              <div className="relative flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF8EE] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-black ring-1 ring-[#1B2E27]/15">
                  Signature Piece
                </span>
                {product.isBestSeller && (
                  <span className="rounded-full bg-[#F2545B] px-3 py-1.5 text-[11px] font-bold text-white">
                    Best Seller
                  </span>
                )}
                {product.isFeatured && (
                  <span className="rounded-full bg-[#1B2E27] px-3 py-1.5 text-[11px] font-bold text-white">
                    Featured
                  </span>
                )}
                <span className="rounded-full border border-[#1B2E27]/20 bg-white px-3 py-1.5 text-[11px] font-medium text-black">
                  {getProductCategoryName(product)}
                </span>
                {(product.brand || product.color || product.flavor) && (
                  <span className="rounded-full border border-[#1B2E27]/20 bg-white px-3 py-1.5 text-[11px] font-medium text-black">
                    {product.brand || product.color || product.flavor}
                  </span>
                )}
              </div>

              <h1 className="relative mt-5 font-heading text-3xl font-bold tracking-[-0.02em] text-black md:text-[2.3rem]">
                {product.name}
              </h1>

              {typeof product.rating === "number" && product.rating > 0 && (
                <div className="relative mt-4 flex items-center gap-2 text-sm">
                  <div className="flex text-black">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        fill={
                          i < Math.round(product.rating!) ? "currentColor" : "none"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-black">
                    {product.rating} ({product.reviewCount || 0} reviews)
                  </span>
                </div>
              )}

              <div className="relative mt-6 flex items-stretch gap-4 rounded-2xl border border-[#1B2E27]/10 bg-[linear-gradient(165deg,#FFF8EE_0%,#FFFFFF_100%)] px-5 py-4">
                <div className="w-1 shrink-0 rounded-full bg-gradient-to-b from-[#D4AF37] via-[#1B2E27] to-[#D4AF37]" />
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-heading text-3xl font-bold text-black">
                    Rs.{finalPrice}
                  </span>

                  {hasDiscount && (
                    <>
                      <span className="line-through text-black">
                        Rs.{product.basePrice}
                      </span>
                      {discountPercentage > 0 && (
                        <span className="rounded-full bg-[#4A230F] px-3 py-1 text-sm font-bold text-white">
                          {discountPercentage}% OFF
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              <p className="relative mt-5 text-justify text-lg leading-relaxed text-black">
                {product.shortDescription}
              </p>

              {product.variants && (
                <div className="mt-6 rounded-2xl border border-[#1B2E27]/10 bg-white p-4 md:p-5">
                  <h3 className="mb-3 font-semibold text-black">Select Size</h3>
                  <div className="flex flex-wrap gap-3">
                    {product.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`rounded-lg border-2 px-5 py-2 text-sm font-bold transition ${
                          selectedVariant?.id === variant.id
                            ? "border-[#1B2E27] bg-[#1B2E27] text-white shadow-md"
                            : "border-[#1B2E27]/20 text-black hover:border-[#1B2E27]"
                        }`}
                      >
                        {variant.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3">
                    {stockAvailable > 0 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-bold text-black">
                        <CheckCircle2 size={14} />
                        In Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-black">
                        <XCircle size={14} />
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-4">
                <div className="order-1 flex shrink-0 items-center overflow-hidden rounded-xl border border-[#d9b897] bg-[#fffaf5] shadow-sm">
                  <button
                    onClick={() => setQuantity((prev) => (prev > 1 ? prev - 1 : 1))}
                    className="px-3 py-2.5 text-xl font-bold text-black transition hover:bg-[#fff1e3]"
                  >
                    -
                  </button>
                  <span className="min-w-[48px] px-3 py-2.5 text-lg font-bold text-black text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="px-3 py-2.5 text-xl font-bold text-black transition hover:bg-[#fff1e3]"
                  >
                    +
                  </button>
                </div>

                <button
                  disabled={stockAvailable === 0}
                  onClick={handleAddToCart}
                  className="order-3 w-full min-w-0 whitespace-nowrap rounded-xl bg-[#233B32] px-3 py-3 text-base font-bold text-white shadow-[0_12px_24px_rgba(35,59,50,0.18)] transition-all duration-300 hover:bg-[#1B2E27] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-black sm:order-2 sm:w-auto sm:flex-1 sm:px-6 sm:text-lg"
                >
                  Add to Cart
                </button>

                <button
                  onClick={toggleWishlist}
                  className="order-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#d9b897] bg-[#fffaf5] text-black transition-all duration-300 hover:bg-[#FFF8EE] sm:order-3"
                  title={
                    wishlistItems.some(
                      (item) => item.productId === (product._id || product.id),
                    )
                      ? "Remove from wishlist"
                      : "Add to wishlist"
                  }
                >
                  <Heart
                    size={20}
                    className={`transition-all duration-300 ${
                      wishlistItems.some(
                        (item) => item.productId === (product._id || product.id),
                      )
                        ? "fill-[#1B2E27] text-black"
                        : "text-black"
                    }`}
                  />
                </button>
              </div>

              {(() => {
                const hasFabricInfo = Boolean(
                  product.fabric || product.fit || product.material || product.color || product.pattern,
                );
                const tabs = [
                  { id: "details" as const, label: "Details" },
                  { id: "highlights" as const, label: "Why You'll Love It" },
                  ...(hasFabricInfo ? [{ id: "fabric" as const, label: "Fabric & Fit" }] : []),
                  { id: "care" as const, label: "Care" },
                ];

                return (
                  <div className="relative mt-6 rounded-2xl border border-[#1B2E27]/10 bg-white p-4 md:p-5">
                    <div className="flex flex-wrap gap-2 border-b border-[#1B2E27]/10 pb-3">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] transition ${
                            activeTab === tab.id
                              ? "bg-[#1B2E27] text-white shadow-sm"
                              : "text-black hover:bg-[#FFF8EE]"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="pt-4">
                      {activeTab === "details" && (
                        <p className="text-justify leading-relaxed text-black">
                          {product.description}
                        </p>
                      )}

                      {activeTab === "highlights" && (
                        <ul className="space-y-2">
                          {productHighlights.map((item) => (
                            <li key={item} className="flex items-center gap-2 text-black">
                              <span className="h-2 w-2 rounded-full bg-[#1B2E27]" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}

                      {activeTab === "fabric" && hasFabricInfo && (
                        <div className="space-y-2 text-sm text-black">
                          {product.fabric && <div><span className="font-semibold text-black">Fabric:</span> {product.fabric}</div>}
                          {product.material && <div><span className="font-semibold text-black">Material:</span> {product.material}</div>}
                          {product.fit && <div><span className="font-semibold text-black">Fit:</span> {product.fit}</div>}
                          {product.color && <div><span className="font-semibold text-black">Color:</span> {product.color}</div>}
                          {product.pattern && <div><span className="font-semibold text-black">Pattern:</span> {product.pattern}</div>}
                        </div>
                      )}

                      {activeTab === "care" && (
                        <ul className="space-y-2">
                          {productCare.map((item) => (
                            <li key={item} className="flex items-center gap-2 text-black">
                              <span className="h-2 w-2 rounded-full bg-[#1B2E27]" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {product.sizes && product.sizes.length > 0 && (
                      <div className="mt-4 border-t border-[#1B2E27]/10 pt-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-black">
                          Available Sizes
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {product.sizes.map((size) => (
                            <span key={size} className="rounded-full border border-[#1B2E27]/10 bg-[#FFF7EA] px-3 py-1.5 text-sm text-black">
                              {size}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="relative mt-6 flex flex-wrap gap-2 pt-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#1B2E27]/30 bg-white px-3 py-1.5 text-xs font-semibold text-black"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 lg:hidden">
            <div className="rounded-3xl border border-[#1B2E27]/10 bg-white p-5 shadow-[0_14px_36px_rgba(11,77,59,0.12)]">
              <h3 className="mb-3 text-base font-bold text-black">
                Why You&apos;ll Love It
              </h3>
              <ul className="space-y-2 text-sm text-black">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#1B2E27]" />
                  Premium fabric sourced from trusted mills.
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#1B2E27]" />
                  Hand-finished stitching and detailing.
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#1B2E27]" />
                  Every piece quality-checked before packing.
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#1B2E27]" />
                  Suited for festive and everyday occasions.
                </li>
              </ul>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-[#1B2E27]/10 bg-[#FFF7EA] px-3 py-2 font-semibold text-black">
                  Free delivery
                </div>
                <div className="rounded-xl border border-[#1B2E27]/10 bg-[#FFF7EA] px-3 py-2 font-semibold text-black">
                  Secure packaging
                </div>
                <div className="rounded-xl border border-[#1B2E27]/10 bg-[#FFF7EA] px-3 py-2 font-semibold text-black">
                  Quality assured
                </div>
                <div className="rounded-xl border border-[#1B2E27]/10 bg-[#FFF7EA] px-3 py-2 font-semibold text-black">
                  Easy returns
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="relative overflow-hidden py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-5 md:px-6 relative z-10">
            <div className="flex items-start justify-between mb-10 md:mb-12 gap-4">
              <div className="max-w-[75%]">
                <h2 className="text-2xl md:text-4xl font-bold text-black">
                  You May Also Like
                </h2>
                <p className="text-black mt-2 text-sm md:text-base">
                  Handpicked picks based on what you&apos;re viewing.
                </p>
              </div>
              <Link
                href="/shop"
                className="whitespace-nowrap text-black border border-[#4A230F]/20 px-4 md:px-5 py-2 rounded-full text-sm md:text-base hover:bg-[#4A230F] hover:text-white transition"
              >
                View All {"->"}
              </Link>
            </div>

            {isLoadingRelated ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse"
                  >
                    <div className="h-40 md:h-52 bg-gray-200 rounded-xl mb-4"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 w-full bg-gray-200 rounded mb-3"></div>
                    <div className="h-10 w-full bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                {relatedProducts.map((relatedProduct) => {
                  const isWishlisted = wishlistItems.some(
                    (item) =>
                      item.productId === (relatedProduct._id || relatedProduct.id),
                  );
                  const price =
                    relatedProduct.discountPrice || relatedProduct.basePrice;
                  const discount =
                    relatedProduct.discountPrice &&
                    Math.round(
                      (
                        (relatedProduct.basePrice -
                          relatedProduct.discountPrice) /
                        relatedProduct.basePrice
                      ) * 100,
                    );
                  const hasVariants = Boolean(
                    relatedProduct.variants && relatedProduct.variants.length,
                  );
                  const primaryVariant = hasVariants
                    ? relatedProduct.variants![0]
                    : undefined;
                  const isSoldOut = hasVariants
                    ? relatedProduct.variants!.every((variant) => variant.stock <= 0)
                    : false;

                  return (
                    <Link
                      key={relatedProduct.id}
                      href={`/products/${relatedProduct.slug}`}
                      className="relative bg-white rounded-2xl p-4 md:p-5 border border-gray-200 shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.12)] transition-all duration-300 group block"
                    >
                      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                        {relatedProduct.isBestSeller && (
                          <span className="bg-[#F2545B] text-white text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-sm">
                            Best Seller
                          </span>
                        )}
                      </div>

                      <div className="absolute right-3 top-3 flex flex-wrap gap-2">
                        {isSoldOut && (
                          <span className="bg-gray-200 text-black text-[11px] font-semibold px-2.5 py-1 rounded-md">
                            Sold out
                          </span>
                        )}
                        {(discount ?? 0) > 0 && !isSoldOut && (
                          <span className="bg-white border border-[#1B2E27]/30 text-black text-[11px] font-semibold px-2.5 py-1 rounded-md">
                            On sale
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) =>
                          toggleWishlistForRelated(relatedProduct, e)
                        }
                        className="absolute right-3 bottom-[150px] md:bottom-[160px] w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-[#F4B223]"
                      >
                        <Heart
                          size={16}
                          className={`transition-all duration-300 ${
                            isWishlisted
                              ? "fill-[#C68A13] text-black"
                              : "text-black"
                          }`}
                        />
                      </button>

                      <div className="flex justify-center mb-5 h-40 md:h-52">
                        <Image
                          src={getProductPrimaryImage(relatedProduct)}
                          alt={relatedProduct.name}
                          width={220}
                          height={260}
                          className="transition-transform duration-300 group-hover:scale-105 object-contain"
                        />
                      </div>

                      <h3 className="text-black font-semibold mb-2 text-[13px] md:text-sm min-h-[40px] md:min-h-[44px]">
                        {relatedProduct.name}
                      </h3>

                      {relatedProduct.rating ? (
                        <div className="flex items-center gap-1 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={`${
                                i < Math.round(relatedProduct.rating || 0)
                                  ? "fill-[#F4B223] text-black"
                                  : "text-black"
                              }`}
                            />
                          ))}
                          <span className="text-xs text-black ml-1">
                            {relatedProduct.reviewCount || 0} | Ratings
                          </span>
                        </div>
                      ) : null}

                      <div className="border border-gray-200 rounded-lg px-3 py-2 text-center text-xs md:text-sm text-black mb-3">
                        {primaryVariant?.label ? `${primaryVariant.label} - ` : ""}
                        ₹ {primaryVariant?.discountPrice || primaryVariant?.price || price}
                      </div>

                      <div className="flex items-center justify-between mb-3 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="text-[13px] md:text-sm font-semibold text-black whitespace-nowrap">
                            ₹ {price}
                          </div>
                          {relatedProduct.discountPrice && (
                            <div className="text-[11px] md:text-xs text-black line-through whitespace-nowrap">
                              MRP ₹ {relatedProduct.basePrice}
                            </div>
                          )}
                        </div>
                        {relatedProduct.rating ? (
                          <div className="text-[11px] md:text-xs text-black whitespace-nowrap">
                            {relatedProduct.rating.toFixed(1)} ★
                          </div>
                        ) : null}
                      </div>

                      <button
                        onClick={(e) => handleAddToCartRelated(relatedProduct, e)}
                        disabled={isSoldOut}
                        className={`w-full flex items-center justify-center gap-2 font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 ${
                          isSoldOut
                            ? "bg-gray-200 text-black cursor-not-allowed"
                            : "bg-[#233B32] text-white hover:bg-[#1B2E27]"
                        }`}
                      >
                        {isSoldOut ? "Sold Out" : "Add to Cart"}
                      </button>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}


      {!isNearFooter && (
        <MobileStickyBar
          product={product}
          selectedVariant={selectedVariant}
          finalPrice={finalPrice}
          handleAddToCart={handleAddToCart}
        />
      )}
    </>
  );
}

