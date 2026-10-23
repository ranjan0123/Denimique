"use client";

import { useEffect, useRef, useState } from "react";
import Image from "@/components/ui/AppImage";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  ShoppingBag,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Product } from "@/types/product";
import {
  formatProductPrice,
  getProducts,
  getProductPrimaryImage,
} from "@/lib/storefront";
import { getApiErrorMessage } from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";

const HOME_CATALOG_HIGHLIGHT_ORDER = [
  "elegant-lace-seductive-black-nightgown",
  "luxurious-satin-maxi-sleepwear-for-women",
  "midnight-whisper-silk-cami-shorts-set",
  "womens-forest-green-one-piece-dress",
];

const isHomeCatalogProduct = (product: Product) =>
  !/\b(jeans?|denim|cargo|bras?|bralettes?|brassieres?|panties|panty|thong|underwear|lingerie|g-string)\b|value wholesale/i.test(
    `${product.name} ${product.slug} ${product.category?.name ?? ""} ${product.subcategory?.name ?? ""}`,
  );

const getHomeCatalogProducts = (products: Product[]) => {
  const seen = new Set<string>();
  return products
    .filter((product) => {
      if (!product.images[0] || !isHomeCatalogProduct(product) || seen.has(product.slug)) {
        return false;
      }
      seen.add(product.slug);
      return true;
    })
    .sort((a, b) => {
      const aOrder = HOME_CATALOG_HIGHLIGHT_ORDER.indexOf(a.slug);
      const bOrder = HOME_CATALOG_HIGHLIGHT_ORDER.indexOf(b.slug);
      return (aOrder < 0 ? HOME_CATALOG_HIGHLIGHT_ORDER.length : aOrder) -
        (bOrder < 0 ? HOME_CATALOG_HIGHLIGHT_ORDER.length : bOrder);
    });
};

export default function LuxuryProductRail({
  products,
  eyebrow,
  title,
  description,
  alwaysShow = false,
  gridOnly = false,
  showAllProducts = false,
  compact = false,
}: {
  products: Product[];
  eyebrow: string;
  title: string;
  description: string;
  alwaysShow?: boolean;
  gridOnly?: boolean;
  showAllProducts?: boolean;
  compact?: boolean;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [loadedProducts, setLoadedProducts] = useState(() =>
    showAllProducts ? getHomeCatalogProducts(products) : products,
  );
  const [nextPage, setNextPage] = useState(2);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreProducts, setHasMoreProducts] = useState(showAllProducts);
  const [isRailPaused, setIsRailPaused] = useState(false);
  const { addToCart } = useCartStore();
  const {
    items: wishlistItems,
    loadWishlist,
    addToWishlist,
    removeFromWishlist,
  } = useWishlistStore();

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  useEffect(() => {
    if (
      !showAllProducts ||
      isRailPaused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      const rail = railRef.current;
      if (!rail) return;
      const remaining = rail.scrollWidth - rail.scrollLeft - rail.clientWidth;
      if (remaining < 16) {
        rail.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        rail.scrollBy({
          left: compact ? 250 : 360,
          behavior: "smooth",
        });
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [compact, isRailPaused, showAllProducts]);

  useEffect(() => {
    if (!quickViewProduct) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setQuickViewProduct(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quickViewProduct]);

  const toggleWishlist = async (product: Product) => {
    const productId = product._id || product.id;
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
      toast.error(getApiErrorMessage(error, "Unable to update wishlist"));
    }
  };

  const addProductToBag = async (
    product: Product,
    event?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event?.preventDefault();
    event?.stopPropagation();

    try {
      await addToCart(product._id || product.id, 1);
      toast.success("Added to bag");
      setQuickViewProduct(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to add to bag"));
    }
  };

  const displayProducts = showAllProducts ? loadedProducts : products.slice(0, 10);

  const loadMoreProducts = async () => {
    if (!showAllProducts || isLoadingMore || !hasMoreProducts) return;
    setIsLoadingMore(true);
    try {
      let page = nextPage;
      const knownSlugs = new Set(loadedProducts.map((product) => product.slug));
      while (true) {
        const pageProducts = await getProducts({ limit: 100, page });
        if (pageProducts.length === 0) {
          setHasMoreProducts(false);
          setNextPage(page);
          return;
        }
        const nextProducts = getHomeCatalogProducts(pageProducts).filter((product) => {
          if (knownSlugs.has(product.slug)) return false;
          knownSlugs.add(product.slug);
          return true;
        });
        page += 1;
        if (nextProducts.length === 0) continue;
        setLoadedProducts((current) => [...current, ...nextProducts]);
        setNextPage(page);
        return;
      }
    } catch {
      setHasMoreProducts(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleRailScroll = () => {
    const rail = railRef.current;
    if (
      showAllProducts &&
      rail &&
      rail.scrollWidth - rail.scrollLeft - rail.clientWidth < 900
    ) {
      void loadMoreProducts();
    }
  };

  if (displayProducts.length === 0 && !alwaysShow) return null;

  return (
    <>
      <section
        className="bg-white px-4 py-16 sm:px-6 md:py-24"
        onMouseEnter={() => setIsRailPaused(true)}
        onMouseLeave={() => setIsRailPaused(false)}
        onFocusCapture={() => setIsRailPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsRailPaused(false);
          }
        }}
      >
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-8 flex items-end justify-between gap-6 md:mb-10">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black">
                {eyebrow}
              </p>
              <h2 className="mt-3 font-heading text-4xl leading-none text-black sm:text-5xl md:text-6xl">
                {title}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-black">
                {description}
              </p>
            </div>
            {!gridOnly && (
              <div className="hidden gap-2 sm:flex">
                <button
                  type="button"
                  aria-label={`Scroll ${title} left`}
                  onClick={() =>
                    railRef.current?.scrollBy({ left: -360, behavior: "smooth" })
                  }
                  className="grid h-11 w-11 place-items-center rounded-full border border-[#191714]/20 text-black transition-colors hover:bg-[#191714] hover:text-white"
                >
                  <ArrowLeft size={17} />
                </button>
                <button
                  type="button"
                  aria-label={`Scroll ${title} right`}
                  onClick={() =>
                    railRef.current?.scrollBy({ left: 360, behavior: "smooth" })
                  }
                  className="grid h-11 w-11 place-items-center rounded-full border border-[#191714]/20 text-black transition-colors hover:bg-[#191714] hover:text-white"
                >
                  <ArrowRight size={17} />
                </button>
              </div>
            )}
          </div>

          <div
            ref={gridOnly ? undefined : railRef}
            onScroll={gridOnly ? undefined : handleRailScroll}
            className={`${
              gridOnly
                ? "grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:gap-5 sm:px-0"
            } ${showAllProducts ? "home-product-rail" : ""}`}
          >
            {displayProducts.length === 0 ? (
              <p className="text-sm text-black">Best sellers are being updated.</p>
            ) : (
              displayProducts.map((product, index) => {
                const productId = product._id || product.id;
                const isWishlisted = wishlistItems.some(
                  (item) => item.productId === productId,
                );
              const price = product.price ?? product.discountPrice ?? product.basePrice;
              return (
                <motion.article
                  key={productId}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.45, delay: (index % 5) * 0.04 }}
                  className={
                    gridOnly
                      ? "group"
                      : compact
                        ? "group w-[58vw] max-w-[230px] shrink-0 snap-start sm:w-[32vw] md:w-[24vw] lg:w-[18vw]"
                        : "group w-[72vw] max-w-[290px] shrink-0 snap-start sm:w-[40vw] md:w-[28vw] lg:w-[22vw]"
                  }
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-white">
                    <Link
                      href={`/products/${product.slug}`}
                      aria-label={`View ${product.name}`}
                      className="absolute inset-0"
                    >
                      {getProductPrimaryImage(product) && (
                        <Image
                          src={getProductPrimaryImage(product)}
                          alt={product.name}
                          fill
                          sizes={compact
                            ? "(max-width: 640px) 58vw, (max-width: 1024px) 32vw, 18vw"
                            : "(max-width: 640px) 72vw, (max-width: 1024px) 40vw, 22vw"}
                          className="object-contain transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                        />
                      )}
                    </Link>
                    {gridOnly && product.isBestSeller && (
                      <span className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white">
                        Best Seller
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => void toggleWishlist(product)}
                      aria-label={
                        isWishlisted
                          ? `Remove ${product.name} from wishlist`
                          : `Add ${product.name} to wishlist`
                      }
                      className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-black transition-colors hover:bg-white"
                    >
                      <Heart
                        size={18}
                        className={isWishlisted ? "fill-[#9D8050] text-black" : ""}
                      />
                    </button>
                    <div
                      className={`absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/40 to-transparent p-3 pt-10 transition-all duration-300 focus-within:translate-y-0 focus-within:opacity-100 ${
                        gridOnly
                          ? "translate-y-0 opacity-100"
                          : "translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 max-sm:translate-y-0 max-sm:opacity-100"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setQuickViewProduct(product)}
                        className="flex-1 border border-white/80 bg-white/95 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-black"
                      >
                        Quick view
                      </button>
                      <button
                        type="button"
                        onClick={(event) => void addProductToBag(product, event)}
                        className={`flex shrink-0 items-center justify-center gap-2 bg-[#233B32] px-4 text-xs font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#1B2E27] ${
                          gridOnly ? "py-2.5" : "h-10 w-10"
                        }`}
                        aria-label={`Add ${product.name} to bag`}
                      >
                        <ShoppingBag size={16} />
                        {gridOnly && "Add to Cart"}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-3 pt-4">
                    <div className="min-w-0">
                      <p className="text-[9px] uppercase tracking-[0.17em] text-black">
                        {product.category?.name || product.brand || "Denimique"}
                      </p>
                      <Link
                        href={`/products/${product.slug}`}
                        className="mt-1 block truncate text-sm font-medium text-black hover:text-black"
                      >
                        {product.name}
                      </Link>
                    </div>
                    <p className="shrink-0 pt-3 text-sm text-black">
                      {formatProductPrice(price)}
                    </p>
                  </div>
                </motion.article>
              );
              })
            )}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {quickViewProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setQuickViewProduct(null);
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`Quick view: ${quickViewProduct.name}`}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="relative grid max-h-[90vh] w-full max-w-4xl overflow-y-auto bg-white md:grid-cols-2"
            >
              <button
                type="button"
                onClick={() => setQuickViewProduct(null)}
                aria-label="Close quick view"
                className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white text-black"
              >
                <X size={18} />
              </button>
              <div className="relative aspect-[4/5] bg-white md:aspect-auto md:min-h-[520px]">
                <Image
                  src={getProductPrimaryImage(quickViewProduct)}
                  alt={quickViewProduct.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col justify-center p-6 sm:p-10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-black">
                  {quickViewProduct.category?.name || "Denimique"}
                </p>
                <h2 className="mt-3 font-heading text-3xl leading-tight text-black sm:text-4xl">
                  {quickViewProduct.name}
                </h2>
                <p className="mt-4 text-lg text-black">
                  {formatProductPrice(
                    quickViewProduct.price ??
                      quickViewProduct.discountPrice ??
                      quickViewProduct.basePrice,
                  )}
                  {quickViewProduct.discountPrice && (
                    <span className="ml-3 text-sm text-black line-through">
                      {formatProductPrice(quickViewProduct.basePrice)}
                    </span>
                  )}
                </p>
                <p className="mt-5 line-clamp-5 text-sm leading-7 text-black">
                  {quickViewProduct.shortDescription ||
                    quickViewProduct.description ||
                    "A considered addition to your everyday wardrobe."}
                </p>
                {quickViewProduct.sizes && quickViewProduct.sizes.length > 0 && (
                  <p className="mt-5 text-xs uppercase tracking-[0.13em] text-black">
                    Available sizes: {quickViewProduct.sizes.join(" / ")}
                  </p>
                )}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void addProductToBag(quickViewProduct)}
                    className="inline-flex flex-1 items-center justify-center gap-2 bg-[#191714] px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#92764A]"
                  >
                    <ShoppingBag size={15} /> Add to bag
                  </button>
                  <Link
                    href={`/products/${quickViewProduct.slug}`}
                    className="inline-flex items-center justify-center border border-[#191714]/25 px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-black transition-colors hover:border-[#191714]"
                  >
                    View details
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
