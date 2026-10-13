"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Image from "@/components/ui/AppImage";
import Link from "next/link";
import {
  Star,
  Search,
  X,
  ChevronDown,
  Heart,
  SlidersHorizontal,
} from "lucide-react";
import type { HierarchyMainCategory } from "@/lib/catalog";
import type { Product } from "@/types/product";
import {
  formatProductPrice,
  getProductPrimaryImage,
  productMatchesCategory,
} from "@/lib/storefront";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import toast from "react-hot-toast";
import FilterSidebar, { PRICE_BUCKETS } from "@/components/shop/FilterSidebar";

interface ShopClientProps {
  initialProducts: Product[];
  initialHierarchy: HierarchyMainCategory[];
  initialError?: string | null;
}

// Builds a compact page list like "1 … 4 5 [6] 7 8 … 56" instead of
// rendering every page number, which is unusable once a catalog has
// dozens of pages.
const getPaginationItems = (
  current: number,
  total: number,
): (number | "ellipsis")[] => {
  const siblingCount = 1;
  const totalVisible = siblingCount * 2 + 5; // first, last, current, 2 ellipses

  if (total <= totalVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(current - siblingCount, 1);
  const rightSibling = Math.min(current + siblingCount, total);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < total - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRange = Array.from({ length: 3 + siblingCount * 2 }, (_, i) => i + 1);
    return [...leftRange, "ellipsis", total];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightRange = Array.from(
      { length: 3 + siblingCount * 2 },
      (_, i) => total - (3 + siblingCount * 2) + i + 1,
    );
    return [1, "ellipsis", ...rightRange];
  }

  const middleRange = Array.from(
    { length: rightSibling - leftSibling + 1 },
    (_, i) => leftSibling + i,
  );
  return [1, "ellipsis", ...middleRange, "ellipsis", total];
};

export default function ShopClient({
  initialProducts,
  initialHierarchy,
  initialError = null,
}: ShopClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [products] = useState<Product[]>(initialProducts);
  const [hierarchy] = useState<HierarchyMainCategory[]>(initialHierarchy);
  const [error] = useState<string | null>(initialError);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 18;

  // Store hooks
  const { addToCart } = useCartStore();
  const {
    items: wishlistItems,
    loadWishlist,
    addToWishlist,
    removeFromWishlist,
  } = useWishlistStore();

  const mainCategory = searchParams.get("mainCategory");
  const category = searchParams.get("category");
  const subcategory = searchParams.get("subcategory");
  const flavor = searchParams.get("flavor");
  const tag = searchParams.get("tag");
  const collection = searchParams.get("collection");
  const gender = searchParams.get("gender") || "all";
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "featured";
  const price = searchParams.get("price");
  const minRating = searchParams.get("rating");
  const sizes = useMemo(
    () => (searchParams.get("sizes")?.split(",").filter(Boolean) ?? []),
    [searchParams],
  );
  const colors = useMemo(
    () => (searchParams.get("colors")?.split(",").filter(Boolean) ?? []),
    [searchParams],
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(search);
  const [trackedSearch, setTrackedSearch] = useState(search);
  if (search !== trackedSearch) {
    setTrackedSearch(search);
    setLocalSearch(search);
  }

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
    } catch {
      toast.error("Unable to update wishlist");
    }
  };

  const handleAddToCart = async (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await addToCart(product._id || product.id, 1);
      toast.success("Added to cart");
    } catch {
      toast.error("Unable to add to cart");
    }
  };

  const updateQuery = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    if (key === "mainCategory" && !value) {
      params.delete("category");
      params.delete("subcategory");
    }

    if (key === "category" && !value) {
      params.delete("subcategory");
    }

    if (key === "mainCategory" && value) {
      params.delete("category");
      params.delete("subcategory");
    }

    if (key === "category" && value) {
      params.delete("subcategory");
      if (value === "all-products") {
        params.delete("mainCategory");
      }
    }

    if (key === "collection" && value) {
      params.delete("category");
      params.delete("subcategory");
      params.delete("mainCategory");
    }

    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  const toggleArrayQuery = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.get(key)?.split(",").filter(Boolean) ?? [];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];

    if (next.length > 0) {
      params.set(key, next.join(","));
    } else {
      params.delete(key);
    }

    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  const clearFilters = () => {
    router.push(pathname);
    setLocalSearch("");
  };

  const genderTabs = [
    { label: "All", value: "all" },
    { label: "Women", value: "women" },
  ];

  useEffect(() => {
    const trimmed = localSearch.trim();
    const handler = setTimeout(() => {
      if (trimmed === search) return;
      updateQuery("search", trimmed || null);
    }, 300);

    return () => clearTimeout(handler);
  }, [localSearch, search, updateQuery]);

  const flattenedCategories = useMemo(
    () =>
      hierarchy.flatMap((mainCat) =>
        mainCat.categories.map((cat) => ({
          mainCategoryName: mainCat.name,
          mainCategorySlug: mainCat.slug,
          categoryName: cat.name,
          categorySlug: cat.slug,
          subcategories: cat.subcategories,
        })),
      ),
    [hierarchy],
  );

  const mainCategoryOptions = useMemo(
    () =>
      hierarchy.map((mainCat) => ({
        name: mainCat.name,
        slug: mainCat.slug,
        count: mainCat.categories.reduce(
          (total, cat) => total + cat.subcategories.length,
          0,
        ),
      })),
    [hierarchy],
  );

  const categoryOptions = useMemo(() => {
    const source = mainCategory
      ? flattenedCategories.filter(
          (item) => item.mainCategorySlug === mainCategory,
        )
      : flattenedCategories;
    const optionsBySlug = new Map(
      source.map((item) => [item.categorySlug, item.categoryName]),
    );

    products.forEach((product) => {
      const productCategory = product.category;
      const slug = productCategory?.slug;
      const name = productCategory?.name?.trim();
      if (!slug || !name || slug === "legacy") return;

      if (mainCategory) {
        const productMainCategory = productCategory.mainCategory;
        if (
          !productMainCategory ||
          typeof productMainCategory === "string" ||
          productMainCategory.slug !== mainCategory
        ) {
          return;
        }
      }

      if (!optionsBySlug.has(slug)) {
        optionsBySlug.set(slug, name);
      }
    });

    return [
      { name: "All Products", slug: "all-products", count: products.length },
      ...[...optionsBySlug.entries()]
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([slug, name]) => ({
          name,
          slug,
          count: products.filter((product) => productMatchesCategory(product, slug))
            .length,
        })),
    ];
  }, [flattenedCategories, mainCategory, products]);

  const subcategoryOptions = useMemo(() => {
    const source = flattenedCategories.filter(
      (item) =>
        !category || category === "all-products" || item.categorySlug === category,
    );

    return source.flatMap((item) =>
      item.subcategories.map((sub) => ({
        name: sub.name,
        slug: sub.slug,
        count: products.filter((product) => product.subcategory?.slug === sub.slug)
          .length,
      })),
    );
  }, [flattenedCategories, category, products]);

  const collections = useMemo(
    () =>
      [...new Set(products.map((product) => product.flavor).filter(Boolean))].map(
        (name) => ({
          name,
          count: products.filter((product) => product.flavor === name).length,
        }),
      ),
    [products],
  );

  const sizeOptions = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((product) => {
      (product.sizes || []).forEach((size) => {
        counts.set(size, (counts.get(size) || 0) + 1);
      });
    });
    const order = ["XS", "S", "M", "L", "XL", "2XL", "XXL", "3XL"];
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        const ai = order.indexOf(a.name.toUpperCase());
        const bi = order.indexOf(b.name.toUpperCase());
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [products]);

  const colorOptions = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((product) => {
      if (product.color) {
        counts.set(product.color, (counts.get(product.color) || 0) + 1);
      }
    });
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [products]);

  const matchesGender = (product: Product, genderValue: string) => {
    const productGender = (product.gender || "").toLowerCase();
    if (productGender) {
      return productGender === genderValue;
    }

    // Products without an explicit gender field fall back to
    // category/tag signals.
    const categorySlug = product.category?.slug || "";
    const mainCategorySlug =
      product.category?.mainCategory && typeof product.category.mainCategory !== "string"
        ? product.category.mainCategory.slug
        : "";
    const tagMatch = Array.isArray(product.tags) && product.tags.includes(genderValue);
    return (
      categorySlug.startsWith(genderValue) ||
      mainCategorySlug.startsWith(genderValue) ||
      tagMatch
    );
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search) {
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(search.toLowerCase()) ||
          product.shortDescription.toLowerCase().includes(search.toLowerCase()) ||
          product.flavor.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (mainCategory) {
      result = result.filter((product) => {
        const mainCategoryValue = product?.category?.mainCategory;
        return (
          mainCategoryValue &&
          typeof mainCategoryValue !== "string" &&
          mainCategoryValue.slug === mainCategory
        );
      });
    }

    if (category && category !== "all-products") {
      result = result.filter((product) => productMatchesCategory(product, category));
    }

    if (subcategory) {
      result = result.filter(
        (product) => product.subcategory?.slug === subcategory,
      );
    }

    if (flavor) {
      result = result.filter((product) => product.flavor === flavor);
    }

    if (tag) {
      result = result.filter((product) => product.tags.includes(tag));
    }

    if (collection === "fusion") {
      result = result.filter((product) => {
        const tags = product.tags || [];
        return (
          tags.some((tag) => tag.toLowerCase() === "fusion") ||
          product.category?.slug === "fusion" ||
          product.category?.name.toLowerCase().includes("fusion") ||
          product.name.toLowerCase().includes("fusion")
        );
      });
    }

    if (gender && gender !== "all") {
      result = result.filter((product) => matchesGender(product, gender));
    }

    if (price) {
      const [minRaw, maxRaw] = price.split("-");
      const min = Number(minRaw) || 0;
      const max = maxRaw ? Number(maxRaw) : Infinity;
      result = result.filter((product) => {
        const effectivePrice = product.discountPrice || product.basePrice;
        return effectivePrice >= min && effectivePrice <= max;
      });
    }

    if (sizes.length > 0) {
      result = result.filter((product) =>
        (product.sizes || []).some((size) => sizes.includes(size)),
      );
    }

    if (colors.length > 0) {
      result = result.filter(
        (product) => product.color && colors.includes(product.color),
      );
    }

    if (minRating) {
      const ratingThreshold = Number(minRating);
      result = result.filter((product) => (product.rating || 0) >= ratingThreshold);
    }

    if (sort === "price-low") {
      result.sort(
        (a, b) =>
          (a.discountPrice || a.basePrice) - (b.discountPrice || b.basePrice),
      );
    }

    if (sort === "price-high") {
      result.sort(
        (a, b) =>
          (b.discountPrice || b.basePrice) - (a.discountPrice || a.basePrice),
      );
    }

    if (sort === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    if (sort === "newest" || sort === "new") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
    }

    return result;
  }, [
    products,
    search,
    mainCategory,
    category,
    subcategory,
    flavor,
    tag,
    collection,
    gender,
    sort,
    price,
    sizes,
    colors,
    minRating,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPageSafe = Math.min(Math.max(currentPage, 1), totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (currentPageSafe - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPageSafe]);

  // Reset to page 1 whenever the active filters change, adjusted during
  // render rather than in an effect.
  const filterSignature = [
    search,
    mainCategory,
    category,
    subcategory,
    flavor,
    tag,
    sort,
    price,
    sizes.join(","),
    colors.join(","),
    minRating,
    products.length,
  ].join("|");
  const [trackedFilterSignature, setTrackedFilterSignature] = useState(filterSignature);
  if (filterSignature !== trackedFilterSignature) {
    setTrackedFilterSignature(filterSignature);
    setCurrentPage(1);
  }

  const activeFilters = useMemo(() => {
    const filters: { key: string; label: string; value: string }[] = [];

    if (mainCategory) {
      const match = mainCategoryOptions.find((item) => item.slug === mainCategory);
      filters.push({
        key: "mainCategory",
        label: "Main",
        value: match?.name || mainCategory,
      });
    }

    if (category) {
      const match = categoryOptions.find((item) => item.slug === category);
      filters.push({
        key: "category",
        label: "Category",
        value: match?.name || category,
      });
    }

    if (subcategory) {
      const match = subcategoryOptions.find((item) => item.slug === subcategory);
      filters.push({
        key: "subcategory",
        label: "Subcategory",
        value: match?.name || subcategory,
      });
    }

    if (flavor) {
      filters.push({ key: "flavor", label: "Collection", value: flavor });
    }

    if (tag) {
      filters.push({ key: "tag", label: "Tag", value: tag });
    }

    if (collection) {
      filters.push({ key: "collection", label: "Collection", value: collection });
    }

    if (gender && gender !== "all") {
      filters.push({ key: "gender", label: "Gender", value: gender });
    }

    if (search) {
      filters.push({ key: "search", label: "Search", value: search });
    }

    if (price) {
      const match = PRICE_BUCKETS.find((bucket) => bucket.key === price);
      filters.push({ key: "price", label: "Price", value: match?.label || price });
    }

    sizes.forEach((size) => {
      filters.push({ key: "sizes", label: "Size", value: size });
    });

    colors.forEach((color) => {
      filters.push({ key: "colors", label: "Color", value: color });
    });

    if (minRating) {
      filters.push({ key: "rating", label: "Rating", value: `${minRating}★ & up` });
    }

    return filters;
  }, [
    mainCategory,
    category,
    subcategory,
    flavor,
    tag,
    collection,
    gender,
    search,
    price,
    sizes,
    colors,
    minRating,
    mainCategoryOptions,
    categoryOptions,
    subcategoryOptions,
  ]);


  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F6F1EC] to-white">
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <div className="bg-white border border-gray-100 rounded-3xl p-10 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900">Shop unavailable</h2>
            <p className="mt-3 text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center gap-2 bg-[#7A3511] text-white px-6 py-3 rounded-xl hover:bg-[#5A260F] transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {activeFilters.length > 0 && (
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <span className="text-sm font-semibold text-gray-600">Active filters:</span>
            <div className="flex flex-wrap items-center gap-2">
              {activeFilters.map((filter) => (
                <button
                  key={`${filter.key}-${filter.value}`}
                  onClick={() =>
                    filter.key === "sizes" || filter.key === "colors"
                      ? toggleArrayQuery(filter.key, filter.value)
                      : updateQuery(filter.key, null)
                  }
                  className="inline-flex items-center gap-2 rounded-full bg-[#7A3511]/10 text-[#7A3511] px-3 py-1.5 text-xs font-semibold hover:bg-[#7A3511]/20 transition-colors"
                >
                  <span>{filter.label}:</span>
                  <span className="text-gray-700">{filter.value}</span>
                  <X className="w-3 h-3 text-[#7A3511]" />
                </button>
              ))}
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>
        )}

        <div className="mb-8 flex flex-wrap items-center gap-3">
          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
            {genderTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => updateQuery("gender", tab.value === "all" ? null : tab.value)}
                className={`rounded-full px-3 py-2 text-xs font-semibold transition text-center sm:px-5 sm:text-sm ${
                  gender === tab.value
                    ? "bg-[#7A3511] text-white shadow-lg shadow-[#7A3511]/10"
                    : "text-[#5C4A3A] bg-white border border-[#E9DAC0] hover:bg-[#8C7466]/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="relative inline-flex items-center gap-2 rounded-full border border-[#E9DAC0] bg-white px-4 py-2 text-xs font-semibold text-[#5C4A3A] hover:bg-[#8C7466]/10 sm:text-sm lg:hidden"
          >
            <SlidersHorizontal size={15} />
            Filters
            {activeFilters.length > 0 && (
              <span className="ml-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#7A3511] px-1 text-[10px] font-bold text-white">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>

        <div className="lg:grid lg:grid-cols-[300px_1fr] lg:items-start lg:gap-8">
          <aside className="hidden lg:sticky lg:top-24 lg:block">
            <FilterSidebar
              mainCategoryOptions={mainCategoryOptions}
              categoryOptions={categoryOptions}
              subcategoryOptions={subcategoryOptions}
              collections={collections}
              sizeOptions={sizeOptions}
              colorOptions={colorOptions}
              mainCategory={mainCategory}
              category={category}
              subcategory={subcategory}
              flavor={flavor}
              sizes={sizes}
              colors={colors}
              price={price}
              minRating={minRating}
              onSingleChange={updateQuery}
              onToggleArray={toggleArrayQuery}
              onClearAll={clearFilters}
              hasActiveFilters={activeFilters.length > 0}
            />
          </aside>

          {isFilterOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setIsFilterOpen(false)}
              />
              <div className="absolute left-0 top-0 h-full w-[86%] max-w-sm overflow-y-auto bg-[#FDFBF7] p-4 shadow-2xl">
                <FilterSidebar
                  mainCategoryOptions={mainCategoryOptions}
                  categoryOptions={categoryOptions}
                  subcategoryOptions={subcategoryOptions}
                  collections={collections}
                  sizeOptions={sizeOptions}
                  colorOptions={colorOptions}
                  mainCategory={mainCategory}
                  category={category}
                  subcategory={subcategory}
                  flavor={flavor}
                  sizes={sizes}
                  colors={colors}
                  price={price}
                  minRating={minRating}
                  onSingleChange={updateQuery}
                  onToggleArray={toggleArrayQuery}
                  onClearAll={clearFilters}
                  hasActiveFilters={activeFilters.length > 0}
                  onClose={() => setIsFilterOpen(false)}
                />
              </div>
            </div>
          )}

          <div>
          <div>
            <div className="hidden lg:grid grid-cols-[1fr_auto] gap-4 items-center mb-8">
              <p className="text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredProducts.length}</span> results
              </p>
              <div className="flex items-center gap-4 justify-end">
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => updateQuery("sort", e.target.value)}
                    className="appearance-none bg-white border border-[#7A3511]/15 pl-4 pr-10 py-2.5 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7A3511]/20 cursor-pointer"
                  >
                    <option value="featured">Sort by: Featured</option>
                    <option value="rating">Sort by: Top Rated</option>
                    <option value="price-low">Sort by: Price: Low to High</option>
                    <option value="price-high">Sort by: Price: High to Low</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {paginatedProducts.map((product) => {
                  const price = product.price ?? product.discountPrice ?? product.basePrice;
                  const discount =
                    product.discountPrice &&
                    Math.round(
                      ((product.basePrice - product.discountPrice) / product.basePrice) *
                        100,
                    );
                  const isWishlisted = wishlistItems.some(
                    (item) => item.productId === (product._id || product.id),
                  );
                  const hasVariants = Boolean(product.variants && product.variants.length);
                  const primaryVariant = hasVariants ? product.variants![0] : undefined;
                  const isSoldOut = hasVariants
                    ? product.variants!.every((variant) => variant.stock <= 0)
                    : false;

                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="group relative flex h-full flex-col overflow-hidden rounded-[26px] border border-[#f1e4d6] bg-white p-4 shadow-[0_10px_30px_rgba(69,45,33,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(69,45,33,0.12)] md:p-5"
                    >
                      <div className="absolute left-3 top-3 z-20 flex flex-wrap gap-2">
                        {product.isBestSeller && (
                          <span className="bg-[#F2545B] text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
                            Best Seller
                          </span>
                        )}
                      </div>

                      <div className="absolute right-3 top-3 z-20 flex flex-wrap gap-2">
                        {isSoldOut && (
                          <span className="bg-[#f3f4f6] text-[#4b5563] text-[11px] font-semibold px-2.5 py-1 rounded-full">
                            Sold out
                          </span>
                        )}
                        {(discount ?? 0) > 0 && !isSoldOut && (
                          <span className="border border-[#7A3511]/20 bg-[#fff7f2] text-[#7A3511] text-[11px] font-semibold px-2.5 py-1 rounded-full">
                            On sale
                          </span>
                        )}
                      </div>

                      <div className="relative z-0 mb-5 flex h-40 justify-center overflow-hidden rounded-[20px] bg-[#f9f2eb] md:h-52">
                        {getProductPrimaryImage(product) && (
                          <Image
                            src={getProductPrimaryImage(product)}
                            alt={product.name}
                            width={220}
                            height={260}
                            className="relative z-0 h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                          />
                        )}

                        <button
                          onClick={(e) => toggleWishlist(product._id || product.id, e)}
                          className="absolute right-2 bottom-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md ring-1 ring-[#7A3511]/10 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white md:right-3 md:bottom-3"
                        >
                          <Heart
                            size={16}
                            className={`transition-all duration-300 ${
                              isWishlisted
                                ? "fill-[#C68A13] text-[#C68A13]"
                                : "text-[#4A230F]"
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex flex-1 flex-col">
                        <h3 className="mb-2 min-h-[40px] text-[13px] font-semibold text-[#3d2418] md:min-h-[44px] md:text-sm">
                          {product.name}
                        </h3>

                        {product.rating ? (
                          <div className="mb-3 flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={`${
                                  i < Math.round(product.rating || 0)
                                    ? "fill-[#8C7466] text-[#8C7466]"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                            <span className="ml-1 text-xs text-gray-500">
                              {product.reviewCount || 0} | Ratings
                            </span>
                          </div>
                        ) : null}

                        <div className="mb-3 rounded-xl border border-[#f0e4d7] bg-[#fffdfb] px-3 py-2 text-center text-xs text-gray-700 md:text-sm">
                          {primaryVariant?.label ? `${primaryVariant.label} - ` : ""}
                          {formatProductPrice(primaryVariant?.discountPrice || primaryVariant?.price || price)}
                        </div>

                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="whitespace-nowrap text-[13px] font-bold text-[#7A3511] md:text-sm">
                              {formatProductPrice(price)}
                            </div>
                            {product.discountPrice && (
                              <div className="whitespace-nowrap text-[11px] text-gray-400 line-through md:text-xs">
                                MRP {formatProductPrice(product.basePrice)}
                              </div>
                            )}
                          </div>
                          {product.rating ? (
                            <div className="whitespace-nowrap text-[11px] text-gray-600 md:text-xs">
                              {product.rating.toFixed(1)} ★
                            </div>
                          ) : null}
                        </div>

                        <button
                          onClick={(e) => handleAddToCart(product, e)}
                          disabled={isSoldOut}
                          className={`mt-auto flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.75 font-semibold transition-all duration-300 ${
                            isSoldOut
                              ? "cursor-not-allowed bg-[#e5e7eb] text-[#4b5563]"
                              : "bg-[#7A3511] text-white hover:bg-[#5A260F] shadow-[0_10px_22px_rgba(122,53,17,0.18)]"
                          }`}
                        >
                          {isSoldOut ? "Sold Out" : "Add to Cart"}
                        </button>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="bg-[#F6F1EC] rounded-2xl p-12 max-w-md mx-auto">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your search or filter to find what you&apos;re looking for.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 bg-[#7A3511] text-white px-6 py-3 rounded-xl hover:bg-[#5A260F] transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            )}

            {filteredProducts.length > pageSize && (
              <div className="mt-10 flex flex-col items-center gap-4">
                <div className="text-sm text-gray-500">
                  Page {currentPageSafe} of {totalPages}
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPageSafe === 1}
                    className={`px-4 py-2 rounded-lg border text-sm font-semibold transition ${
                      currentPageSafe === 1
                        ? "border-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-[#7A3511]/30 text-[#7A3511] hover:bg-[#7A3511]/10"
                    }`}
                  >
                    Previous
                  </button>

                  {getPaginationItems(currentPageSafe, totalPages).map((item, i) =>
                    item === "ellipsis" ? (
                      <span
                        key={`ellipsis-${i}`}
                        className="w-10 h-10 flex items-center justify-center text-sm text-gray-400"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setCurrentPage(item)}
                        className={`w-10 h-10 rounded-lg text-sm font-semibold border transition ${
                          item === currentPageSafe
                            ? "bg-[#7A3511] text-white border-[#7A3511]"
                            : "border-gray-200 text-gray-600 hover:border-[#7A3511]/40 hover:text-[#7A3511]"
                        }`}
                      >
                        {item}
                      </button>
                    ),
                  )}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPageSafe === totalPages}
                    className={`px-4 py-2 rounded-lg border text-sm font-semibold transition ${
                      currentPageSafe === totalPages
                        ? "border-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-[#7A3511]/30 text-[#7A3511] hover:bg-[#7A3511]/10"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#7A3511]/10 mt-16 bg-white/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{products.length}</div>
              <div className="text-sm text-gray-500">Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{categoryOptions.length}</div>
              <div className="text-sm text-gray-500">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{collections.length}</div>
              <div className="text-sm text-gray-500">Collections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{subcategoryOptions.length}</div>
              <div className="text-sm text-gray-500">Subcategories</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


