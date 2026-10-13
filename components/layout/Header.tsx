"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "@/components/ui/AppImage";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  Menu,
  X,
  Bell,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Heart,
  Users,
} from "lucide-react";
import AnnouncementBar from "./AnnouncementBar";
import NotificationBell from "./NotificationBell";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import type { Product } from "@/types/product";
import type { HierarchyMainCategory } from "@/lib/catalog";
import {
  getProducts,
  getCategoryHierarchy,
  productMatchesCategory,
} from "@/lib/storefront";

type GenderTab = "men" | "women";

// Tags that describe the whole catalog rather than a specific product type —
// not useful as a mega-menu link, so they're excluded from the dynamic list.
const GENERIC_TAGS = new Set(["fashion", "apparel", "men", "women", "unisex"]);

// The catalog's categories are a flat list (no subcategories), so the Shop
// mega-menu groups them into themed columns editorially, Myntra/Meesho-style,
// rather than inventing a subcategory taxonomy that doesn't exist in the data.
// Any category slug not listed here still shows up, under "More".
const SHOP_MENU_GROUPS: { title: string; slugs: string[] }[] = [
  {
    title: "Lingerie & Intimates",
    slugs: [
      "bras",
      "panties",
      "lingerie-sets",
      "nightwear-roleplay",
      "shapewear-petticoats",
    ],
  },
  {
    title: "Occasion & Gifting",
    slugs: ["bridal-collection", "gift-occasion-sets", "plus-size"],
  },
  {
    title: "Sleep & Everyday",
    slugs: ["sleepwear-loungewear", "apparel", "value-wholesale"],
  },
  {
    title: "Accessories & More",
    slugs: ["accessories-jewelry", "saree"],
  },
];

const SHOP_MENU_LABELS: Record<string, string> = {
  "nightwear-roleplay": "Nightwear & Roleplay",
  "gift-occasion-sets": "Gift & Occasion Sets",
  "sleepwear-loungewear": "Sleepwear & Loungewear",
  "accessories-jewelry": "Accessories & Jewelry",
};

const toTag = (label: string) => label.toLowerCase().replace(/\s+/g, "-");

const toLabel = (tag: string) =>
  tag
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const productMatchesGender = (product: Product, gender: GenderTab) => {
  const categorySlug = product.category?.slug || "";
  const tagMatch = product.tags?.includes(gender);
  const nameMatch = product.name.toLowerCase().includes(gender);
  return categorySlug === gender || tagMatch || nameMatch;
};

export default function Header() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [hierarchy, setHierarchy] = useState<HierarchyMainCategory[]>([]);
  const [isShopMenuOpen, setIsShopMenuOpen] = useState<boolean>(false);
  const shopMenuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const { cart, hasHydrated, loadCart } = useCartStore();
  const {
    items: wishlistItems,
    loadWishlist,
    hasHydrated: hasWishlistHydrated,
  } = useWishlistStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlistItems.length;

  useEffect(() => {
    // Loaded once on mount rather than lazily on search-open, since the
    // Shop mega-menu also needs this data to build its links from real
    // product tags instead of a hardcoded list.
    let isActive = true;

    const loadProducts = async () => {
      try {
        const productsData = await getProducts({ limit: 5000 });
        if (isActive) {
          setProducts(productsData);
        }
      } catch (error) {
        console.error("Failed to load products:", error);
      }
    };

    const loadHierarchy = async () => {
      try {
        const hierarchyData = await getCategoryHierarchy();
        if (isActive) {
          setHierarchy(hierarchyData);
        }
      } catch (error) {
        console.error("Failed to load category hierarchy:", error);
      }
    };

    loadProducts();
    loadHierarchy();

    return () => {
      isActive = false;
    };
  }, []);

  const hierarchyCategories = useMemo(
    () => hierarchy.flatMap((mainCat) => mainCat.categories),
    [hierarchy],
  );

  const allCategories = useMemo(() => {
    const categoriesBySlug = new Map(
      hierarchyCategories.map((category) => [category.slug, category]),
    );

    SHOP_MENU_GROUPS.flatMap((group) => group.slugs).forEach((slug) => {
      if (!categoriesBySlug.has(slug)) {
        categoriesBySlug.set(slug, {
          _id: slug,
          slug,
          name: SHOP_MENU_LABELS[slug] || toLabel(slug),
          subcategories: [],
        });
      }
    });

    products.forEach((product) => {
      const category = product.category;
      if (category?.slug && !categoriesBySlug.has(category.slug)) {
        categoriesBySlug.set(category.slug, {
          _id: category._id || category.slug,
          slug: category.slug,
          name: category.name || toLabel(category.slug),
          subcategories: [],
        });
      }
    });

    return [...categoriesBySlug.values()];
  }, [hierarchyCategories, products]);

  const shopMenuColumns = useMemo(() => {
    const bySlug = new Map(
      allCategories.map((category) => [category.slug, category]),
    );

    return SHOP_MENU_GROUPS.map((group) => ({
      title: group.title,
      categories: group.slugs
        .map((slug) => bySlug.get(slug))
        .filter(
          (category): category is NonNullable<typeof category> =>
            category !== undefined &&
            products.some((product) =>
              productMatchesCategory(product, category.slug),
            ),
        ),
    }));
  }, [allCategories, products]);

  const categoryProductCounts = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((product) => {
      allCategories.forEach((category) => {
        if (productMatchesCategory(product, category.slug)) {
          counts.set(category.slug, (counts.get(category.slug) || 0) + 1);
        }
      });
    });
    return counts;
  }, [allCategories, products]);

  const openShopMenu = () => {
    if (shopMenuCloseTimer.current) {
      clearTimeout(shopMenuCloseTimer.current);
      shopMenuCloseTimer.current = null;
    }
    setIsShopMenuOpen(true);
  };

  const closeShopMenuWithDelay = () => {
    shopMenuCloseTimer.current = setTimeout(() => {
      setIsShopMenuOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (shopMenuCloseTimer.current) {
        clearTimeout(shopMenuCloseTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      loadCart();
    }
  }, [hasHydrated, loadCart]);

  useEffect(() => {
    if (isAuthenticated && !hasWishlistHydrated) {
      loadWishlist();
    }
  }, [hasWishlistHydrated, isAuthenticated, loadWishlist]);

  // Built from real product tags instead of a hardcoded list, so every
  // link in the Shop mega-menu actually resolves to real products — and
  // the menu grows on its own as new tags appear in the catalog.
  const genderTags = useMemo(() => {
    const buildTagsFor = (gender: GenderTab) => {
      const tags = new Set<string>();
      products
        .filter((product) => productMatchesGender(product, gender))
        .forEach((product) => {
          (product.tags || []).forEach((tag) => {
            const normalized = tag.toLowerCase().trim();
            if (normalized && !GENERIC_TAGS.has(normalized)) {
              tags.add(normalized);
            }
          });
        });
      return [...tags].sort();
    };

    return {
      men: buildTagsFor("men"),
      women: buildTagsFor("women"),
    };
  }, [products]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const normalizedQuery = searchQuery.toLowerCase();
    return products
      .filter((product) => {
        const haystack = [
          product.name,
          product.brand || "",
          product.shortDescription,
          product.category?.name || "",
          product.subcategory?.name || "",
          ...(product.tags || []),
          product.color || "",
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      })
      .slice(0, 6);
  }, [products, searchQuery]);

  /* ---------------- AUTO FOCUS SEARCH ---------------- */
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  /* ---------------- ESC CLOSE SEARCH ---------------- */
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsUserMenuOpen(false);
        setSearchQuery("");
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  /* ---------------- CLICK OUTSIDE TO CLOSE MENUS ---------------- */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isUserMenuOpen &&
        !(e.target as Element).closest(".user-menu-container")
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isUserMenuOpen]);

  /* ---------------- HEADER SCROLL EFFECT ---------------- */
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ---------------- LOGOUT HANDLER ---------------- */
  const handleLogout = async () => {
    try {
      await logout();
      setIsUserMenuOpen(false);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      {/* ================= Announcement Bar ================= */}
      <AnnouncementBar />

      {/* ================= Header ================= */}
      <header
        className={`sticky top-0 z-50 border-b border-[#191714]/10 bg-[#F8F6F1]/75 backdrop-blur-[14px] transition-all duration-300 ${
          isScrolled
            ? "bg-[#F8F6F1]/95 shadow-[0_10px_30px_rgba(25,23,20,0.08)]"
            : ""
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div
            className={`grid grid-cols-[1fr_auto_1fr] items-center transition-[height] duration-300 ${
              isScrolled ? "h-20" : "h-24"
            }`}
          >
            {/* Logo */}

            <Link href="/" className="flex items-center justify-self-start">
              <Image
                src="/final-logo.png"
                alt="Denimique"
                width={160}
                height={180}
                priority
                className="h-16 w-auto sm:h-20 md:h-24"
              />
            </Link>

            {/* ================= Desktop Navigation ================= */}

            <nav className="hidden md:flex items-center justify-self-center gap-10 relative">
              <Link
                href="/shop"
                className="relative flex items-center gap-1 text-sm font-bold uppercase tracking-[0.16em] text-[#191714] group font-heading"
                onMouseEnter={openShopMenu}
                onMouseLeave={closeShopMenuWithDelay}
              >
                Shop
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-300 ${isShopMenuOpen ? "rotate-180" : ""}`}
                />
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#A58D68] transition-all duration-300 group-hover:w-full" />
              </Link>

              <Link
                href="/shop?sort=newest"
                className="relative flex items-center gap-1 text-sm font-bold uppercase tracking-[0.16em] text-[#191714] group font-heading"
              >
                New Arrivals
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#A58D68] transition-all duration-300 group-hover:w-full" />
              </Link>

              <AnimatePresence>
                {isShopMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    onMouseEnter={openShopMenu}
                    onMouseLeave={closeShopMenuWithDelay}
                    // Anchored to the whole nav (not just the "Shop" link) and
                    // capped to the viewport width, so it can't overflow past
                    // the left edge on narrower desktop/laptop screens. Only
                    // the "Shop" link and this panel toggle it — hovering
                    // "New Arrivals" does not.

                    className="absolute left-1/2 top-full z-50 mt-3 w-[min(94vw,860px)] -translate-x-1/2 rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl"
                  >
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5 lg:grid-cols-4 lg:gap-y-0">
                      {shopMenuColumns.map((column) => (
                        <div key={column.title}>
                          <p className="mb-3 text-sm font-bold text-[#92764A]">
                            {column.title}
                          </p>
                          <div className="flex flex-col gap-2.5">
                            {column.categories.map((category) => (
                              <Link
                                key={category.slug}
                                href={`/shop?category=${category.slug}`}
                                onClick={() => setIsShopMenuOpen(false)}
                                className="flex items-center justify-between gap-3 text-sm text-gray-600 transition-colors hover:text-[#92764A]"
                              >
                                <span>{category.name}</span>
                                {categoryProductCounts.has(category.slug) && (
                                  <span className="shrink-0 text-xs text-gray-400">
                                    {categoryProductCounts.get(category.slug)}
                                  </span>
                                )}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                      <Link
                        href="/shop?category=all-products"
                        onClick={() => setIsShopMenuOpen(false)}
                        className="text-sm font-bold text-[#92764A] hover:underline"
                      >
                        View All Products &rarr;
                      </Link>
                      <Link
                        href="/shop?sort=newest"
                        onClick={() => setIsShopMenuOpen(false)}
                        className="text-sm font-semibold text-gray-500 hover:text-[#92764A]"
                      >
                        Latest Collection
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </nav>

            {/* ================= Right Section ================= */}

            <div className="flex items-center justify-self-end gap-1.5 sm:gap-3 md:gap-4">
              {/* Search */}

              <div className="relative flex items-center hidden md:block">
                <AnimatePresence mode="wait">
                  {isSearchOpen ? (
                    <motion.div
                      key="search-expanded"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 280, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="relative p-2 text-gray-800"
                    >
                      <div className="relative overflow-hidden rounded-full">
                        <Search
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                        <input
                          ref={searchInputRef}
                          type="text"
                          placeholder="Search products..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-12 py-2.5 bg-gray-50 rounded-full focus:ring-2 focus:ring-[#A58D68] outline-none text-sm"
                        />
                        <button
                          onClick={() => {
                            setIsSearchOpen(false);
                            setSearchQuery("");
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 "
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {searchQuery && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                          {products.length === 0 ? (
                            <div className="px-4 py-6 text-center text-gray-500">
                              Loading products...
                            </div>
                          ) : searchResults.length > 0 ? (
                            searchResults.map((result) => (
                              <Link
                                key={result.id}
                                href={`/products/${result.slug}`}
                                className="block px-4 py-3 hover:bg-[#A58D68]/10 transition"
                                onClick={() => {
                                  setIsSearchOpen(false);
                                  setSearchQuery("");
                                }}
                              >
                                <div className="text-sm font-medium text-gray-800">
                                  {result.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {result.brand ||
                                    result.category?.name ||
                                    result.color ||
                                    "Fashion collection"}
                                </div>
                              </Link>
                            ))
                          ) : (
                            <div className="px-4 py-6 text-center text-gray-500">
                              No products found
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.button
                      key="search-icon"
                      onClick={() => setIsSearchOpen(true)}
                      className="p-2 hover:bg-[#92764A]/10 rounded-full"
                    >
                      <Search className="text-[#191714]" size={20} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* User Account (mobile has these links in the hamburger drawer) */}

              {isAuthenticated ? (
                <div className="relative user-menu-container hidden sm:block">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-2 rounded-full transition-colors hover:bg-[#92764A]/10"
                  >
                    <div className="w-8 h-8 bg-[#92764A]/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-[#191714]" />
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-[#191714] transition-transform ${
                        isUserMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-0"
                      >
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="font-semibold text-[#191714]">
                            {user?.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {user?.email}
                          </p>
                        </div>

                        <Link
                          href="/notifications"
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Bell size={18} />
                          <span>Notifications</span>
                        </Link>

                        <Link
                          href="/profile"
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User size={18} />
                          <span>Profile</span>
                        </Link>

                        {(user?.role === "admin" ||
                          user?.role === "superadmin") && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Settings size={18} />
                            <span>Admin Panel</span>
                          </Link>
                        )}

                        {user?.role === "superadmin" && (
                          <Link
                            href="/admin/users"
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Users size={18} />
                            <span>Users</span>
                          </Link>
                        )}

                        <Link
                          href="/orders"
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <ShoppingBag size={18} />
                          <span>My Orders</span>
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left"
                        >
                          <LogOut size={18} />
                          <span>Logout</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-3">
                  <Link
                    href="/login"
                    className="p-2 text-[#191714] hover:bg-[#92764A]/10 rounded-full transition-colors"
                    title="Login / Sign Up"
                  >
                    <User size={20} />
                  </Link>
                </div>
              )}

              <NotificationBell />

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="relative group -m-2 rounded-full p-2 transition-colors duration-300 hover:bg-[#92764A]/10"
              >
                <Heart
                  size={22}
                  strokeWidth={1.75}
                  className={`transition-all duration-300 group-hover:scale-110 ${
                    hasWishlistHydrated && wishlistCount > 0
                      ? "fill-[#92764A] text-[#92764A]"
                      : "text-[#191714]"
                  }`}
                />
                {hasWishlistHydrated && wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#191714] text-white text-[10px] font-bold shadow-md ring-2 ring-white">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart (Visible On All Devices) */}
              <Link
                href="/cart"
                className="relative group rounded-full p-2 transition-colors duration-300 hover:bg-[#92764A]/10"
              >
                <ShoppingCart
                  size={22}
                  className="text-[#191714] transition-transform duration-300 group-hover:scale-110 sm:size-6"
                />

                {hasHydrated && cartCount > 0 && (
                  <span
                    key={cartCount}
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1
                               flex items-center justify-center
                               bg-[#191714] text-white text-[10px] font-bold
                               rounded-full shadow-md ring-2 ring-white"
                  >
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden rounded-full p-2 transition-colors duration-300 hover:bg-[#92764A]/10"
                onClick={() => setIsOpen(true)}
              >
                <Menu size={24} className="text-[#191714]" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ================= Mobile Panel ================= */}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 bg-white z-50 flex flex-col"
          >
            {/* Fixed Header */}

            <div className="flex justify-between items-center p-8 pb-6 border-b border-gray-100">
              <Image
                src="/final-logo.png"
                alt="Denimique"
                width={160}
                height={180}
                className="h-20 w-auto"
              />
              <X
                size={28}
                className="text-[#191714] cursor-pointer"
                onClick={() => setIsOpen(false)}
              />
            </div>

            {/* Scrollable Content */}

            <div className="flex-1 overflow-y-auto px-8 pb-8">
              {/* Mobile Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-[#A58D68] outline-none"
                  />
                </div>

                {searchQuery && (
                  <div className="mt-4 max-h-48 overflow-y-auto">
                    {products.length === 0 ? (
                      <p className="px-4 py-2 text-sm text-gray-500">
                        Loading products...
                      </p>
                    ) : (
                      searchResults.map((product) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.slug}`}
                          onClick={() => {
                            setIsOpen(false);
                            setSearchQuery("");
                          }}
                          className="block px-4 py-2 hover:bg-[#A58D68]/10 rounded-lg"
                        >
                          {product.name}
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Links */}
              <div className="flex flex-col gap-6 text-xl font-semibold text-[#191714]">
                <Link href="/shop" onClick={() => setIsOpen(false)}>
                  Shop All
                </Link>

                <Link href="/shop?sort=newest" onClick={() => setIsOpen(false)}>
                  New Arrivals
                </Link>

                <div className="grid grid-cols-2 gap-6 border-y border-[#A58D68]/15 py-5">
                  <div>
                    <p className="mb-2 text-sm font-bold text-[#A58D68]">
                      Men&apos;s Tags
                    </p>
                    <div className="flex flex-col gap-2">
                      {genderTags.men.length > 0 ? (
                        genderTags.men.map((tag) => (
                          <Link
                            key={tag}
                            href={`/shop?gender=men&tag=${toTag(tag)}`}
                            onClick={() => setIsOpen(false)}
                            className="text-sm text-gray-700"
                          >
                            {toLabel(tag)}
                          </Link>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400">Coming soon</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-bold text-[#A58D68]">
                      Women&apos;s Tags
                    </p>
                    <div className="flex flex-col gap-2">
                      {genderTags.women.length > 0 ? (
                        genderTags.women.map((tag) => (
                          <Link
                            key={tag}
                            href={`/shop?gender=women&tag=${toTag(tag)}`}
                            onClick={() => setIsOpen(false)}
                            className="text-sm text-gray-700"
                          >
                            {toLabel(tag)}
                          </Link>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400">Coming soon</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* User Authentication - Mobile */}
                {isAuthenticated ? (
                  <div className="pt-4">
                    {/* User Info Card */}
                    <div className="bg-gradient-to-r from-[#191714] to-[#191714] p-3 rounded-xl mb-3 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm truncate">
                            {user?.name}
                          </p>
                          <p className="text-xs text-white/80 truncate">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Link
                        href="/notifications"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition"
                      >
                        <Bell size={16} />
                        <span>Notifications</span>
                      </Link>

                      <Link
                        href="/profile"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition"
                      >
                        <User size={16} />
                        <span>Profile</span>
                      </Link>

                      <Link
                        href="/orders"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition"
                      >
                        <ShoppingBag size={16} />
                        <span>My Orders</span>
                      </Link>

                      {(user?.role === "admin" ||
                        user?.role === "superadmin") && (
                        <Link
                          href="/admin"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition"
                        >
                          <Settings size={16} />
                          <span>Admin Panel</span>
                        </Link>
                      )}

                      {user?.role === "superadmin" && (
                        <Link
                          href="/admin/users"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition"
                        >
                          <Users size={16} />
                          <span>Users</span>
                        </Link>
                      )}

                      <Link
                        href="/wishlist"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition"
                      >
                        <Heart size={16} />
                        <span>Wishlist</span>
                      </Link>

                      <button
                        onClick={async () => {
                          await handleLogout();
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:bg-red-50 transition w-full text-left"
                      >
                        <LogOut size={16} className="text-red-600" />
                        <span className="text-red-600">Logout</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4">
                    <div className="bg-gradient-to-r from-[#191714] to-[#191714] rounded-xl p-3 mb-3">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-1.5 bg-white/20 rounded-lg">
                          <User size={16} className="text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">
                            Welcome to Denimique
                          </p>
                          <p className="text-xs text-white/80">
                            Sign in to your account
                          </p>
                        </div>
                      </div>

                      <Link
                        href="/login"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-white text-[#191714] rounded-lg font-semibold hover:bg-gray-50 transition text-sm"
                      >
                        <User size={14} />
                        Login / Sign Up
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
