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

const GENERIC_TAGS = new Set(["fashion", "apparel", "men", "women", "unisex"]);

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
    let isActive = true;

    const loadProducts = async () => {
      try {
        // Keep the shared header request lightweight; loading thousands of
        // full product documents was timing out during homepage hydration.
        const productsData = await getProducts({ limit: 100 });
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

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      <AnnouncementBar />

      <header
        className={`sticky top-0 z-50 border-b border-[#191714]/10 bg-[#F8F6F1]/75 backdrop-blur-[14px] transition-all duration-300 ${
          isScrolled
            ? "bg-[#F8F6F1]/95 shadow-[0_10px_30px_rgba(25,23,20,0.08)]"
            : ""
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          {/* Improved grid proportions to prevent crowding */}
          <div
            className={`grid grid-cols-[auto_1fr_auto] lg:grid-cols-[220px_1fr_auto] items-center gap-4 transition-[height] duration-300 ${
              isScrolled ? "h-18 md:h-20" : "h-20 md:h-24"
            }`}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center justify-self-start">
              <Image
                src="/final-logo.png"
                alt="Denimique"
                width={150}
                height={160}
                priority
                className="h-16 w-auto sm:h-20 md:h-24 object-contain"
              />
            </Link>

            {/* Desktop Navigation */}

            <nav className="hidden md:flex items-center justify-self-center gap-8 lg:gap-10 relative">
              <Link
                href="/shop"
                className="relative flex items-center gap-1 text-sm font-bold uppercase tracking-[0.16em] text-black group font-heading py-2"
                onMouseEnter={openShopMenu}
                onMouseLeave={closeShopMenuWithDelay}
              >
                Shop
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-300 ${isShopMenuOpen ? "rotate-180" : ""}`}
                />
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#A58D68] transition-all duration-300 group-hover:w-full" />
              </Link>

              <Link
                href="/shop?sort=newest"
                className="relative flex items-center gap-1 text-sm font-bold uppercase tracking-[0.16em] text-black group font-heading py-2"
              >
                New Arrivals
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#A58D68] transition-all duration-300 group-hover:w-full" />
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
                    className="absolute left-1/2 top-full z-50 mt-2 w-[min(94vw,860px)] -translate-x-1/2 rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl"
                  >
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5 lg:grid-cols-4 lg:gap-y-0">
                      {shopMenuColumns.map((column) => (
                        <div key={column.title}>
                          <p className="mb-3 text-sm font-bold text-black">
                            {column.title}
                          </p>
                          <div className="flex flex-col gap-2.5">
                            {column.categories.map((category) => (
                              <Link
                                key={category.slug}
                                href={`/shop?category=${category.slug}`}
                                onClick={() => setIsShopMenuOpen(false)}
                                className="flex items-center justify-between gap-3 text-sm text-black transition-colors hover:text-black"
                              >
                                <span>{category.name}</span>
                                {categoryProductCounts.has(category.slug) && (
                                  <span className="shrink-0 text-xs text-black">
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
                        className="text-sm font-bold text-black hover:underline"
                      >
                        View All Products &rarr;
                      </Link>
                      <Link
                        href="/shop?sort=newest"
                        onClick={() => setIsShopMenuOpen(false)}
                        className="text-sm font-semibold text-black hover:text-black"
                      >
                        Latest Collection
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </nav>

            {/* Right Section */}

            <div className="flex items-center justify-self-end gap-1 sm:gap-2 md:gap-3">
              {/* Search */}
              <div className="relative hidden md:block">
                <AnimatePresence mode="wait">
                  {isSearchOpen ? (
                    <motion.div
                      key="search-expanded"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 260, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="relative text-black"
                    >
                      <div className="relative overflow-hidden rounded-full">
                        <Search
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-black"
                          size={18}
                        />
                        <input
                          ref={searchInputRef}
                          type="text"
                          placeholder="Search products..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-10 py-2 bg-white/80 border border-gray-200 rounded-full focus:ring-2 focus:ring-[#A58D68] outline-none text-sm shadow-sm"
                        />
                        <button
                          onClick={() => {
                            setIsSearchOpen(false);
                            setSearchQuery("");
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-black"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {searchQuery && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                          {products.length === 0 ? (
                            <div className="px-4 py-6 text-center text-black text-sm">
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
                                <div className="text-sm font-medium text-black">
                                  {result.name}
                                </div>
                                <div className="text-xs text-black">
                                  {result.brand ||
                                    result.category?.name ||
                                    result.color ||
                                    "Fashion collection"}
                                </div>
                              </Link>
                            ))
                          ) : (
                            <div className="px-4 py-6 text-center text-black text-sm">
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
                      className="p-2.5 hover:bg-[#92764A]/10 rounded-full transition-colors"
                      title="Search"
                    >
                      <Search className="text-black" size={20} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* User Account */}
              {isAuthenticated ? (
                <div className="relative user-menu-container hidden sm:block">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1.5 p-1.5 rounded-full transition-colors hover:bg-[#92764A]/10"
                  >
                    <div className="w-8 h-8 bg-[#92764A]/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-black" />
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-black transition-transform ${
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
                        className="absolute top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 right-0"
                      >
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="font-semibold text-black text-sm">
                            {user?.name}
                          </p>
                          <p className="text-xs text-black truncate">
                            {user?.email}
                          </p>
                        </div>

                        <Link
                          href="/notifications"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-black hover:bg-gray-50 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Bell size={16} />
                          <span>Notifications</span>
                        </Link>

                        <Link
                          href="/profile"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-black hover:bg-gray-50 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User size={16} />
                          <span>Profile</span>
                        </Link>

                        {(user?.role === "admin" ||
                          user?.role === "superadmin") && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-black hover:bg-gray-50 transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Settings size={16} />
                            <span>Admin Panel</span>
                          </Link>
                        )}

                        {user?.role === "superadmin" && (
                          <Link
                            href="/admin/users"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-black hover:bg-gray-50 transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Users size={16} />
                            <span>Users</span>
                          </Link>
                        )}

                        <Link
                          href="/orders"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-black hover:bg-gray-50 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <ShoppingBag size={16} />
                          <span>My Orders</span>
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-black hover:bg-red-50 hover:text-black transition-colors w-full text-left border-t border-gray-50 mt-1"
                        >
                          <LogOut size={16} />
                          <span>Logout</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden md:flex items-center">
                  <Link
                    href="/login"
                    className="p-2.5 text-black hover:bg-[#92764A]/10 rounded-full transition-colors"
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
                className="relative group rounded-full p-2.5 transition-colors duration-300 hover:bg-[#92764A]/10"
                title="Wishlist"
              >
                <Heart
                  size={20}
                  strokeWidth={1.75}
                  className={`transition-all duration-300 group-hover:scale-110 ${
                    hasWishlistHydrated && wishlistCount > 0
                      ? "fill-[#92764A] text-black"
                      : "text-black"
                  }`}
                />
                {hasWishlistHydrated && wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#191714] text-white text-[10px] font-bold shadow-md ring-2 ring-white">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative group rounded-full p-2.5 transition-colors duration-300 hover:bg-[#92764A]/10"
                title="Cart"
              >
                <ShoppingCart
                  size={20}
                  className="text-black transition-transform duration-300 group-hover:scale-110"
                />
                {hasHydrated && cartCount > 0 && (
                  <span
                    key={cartCount}
                    className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-[#191714] text-white text-[10px] font-bold rounded-full shadow-md ring-2 ring-white"
                  >
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden rounded-full p-2 transition-colors duration-300 hover:bg-[#92764A]/10"
                onClick={() => setIsOpen(true)}
                aria-label="Open Menu"
              >
                <Menu size={24} className="text-black" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 bg-white z-50 flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <Image
                src="/final-logo.png"
                alt="Denimique"
                width={140}
                height={150}
                className="h-14 w-auto object-contain"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X size={24} className="text-black" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Mobile Search Input */}
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-black"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#A58D68] outline-none text-sm"
                />
                {searchQuery && (
                  <div className="mt-2 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                    {searchResults.map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        onClick={() => {
                          setIsOpen(false);
                          setSearchQuery("");
                        }}
                        className="block px-4 py-2.5 text-sm hover:bg-[#A58D68]/10 transition"
                      >
                        {product.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Navigation Links */}
              <div className="flex flex-col gap-4 text-lg font-semibold text-black">
                <Link
                  href="/shop"
                  onClick={() => setIsOpen(false)}
                  className="py-1 hover:text-black"
                >
                  Shop All
                </Link>
                <Link
                  href="/shop?sort=newest"
                  onClick={() => setIsOpen(false)}
                  className="py-1 hover:text-black"
                >
                  New Arrivals
                </Link>
              </div>

              {/* Mobile Category Groups Accordion/Grid */}
              <div className="border-t border-gray-100 pt-6 space-y-6">
                <p className="text-xs font-bold tracking-wider uppercase text-black">
                  Explore Categories
                </p>
                <div className="grid grid-cols-1 gap-4">
                  {SHOP_MENU_GROUPS.map((group) => (
                    <div key={group.title} className="space-y-2">
                      <p className="text-sm font-bold text-black">
                        {group.title}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {group.slugs.map((slug) => (
                          <Link
                            key={slug}
                            href={`/shop?category=${slug}`}
                            onClick={() => setIsOpen(false)}
                            className="text-xs bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-black hover:border-[#A58D68] hover:text-black"
                          >
                            {SHOP_MENU_LABELS[slug] || toLabel(slug)}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Account Actions */}
              <div className="border-t border-gray-100 pt-6 flex flex-col gap-3">
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 text-sm font-medium text-black py-2"
                    >
                      <User size={18} /> My Profile
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 text-sm font-medium text-black py-2"
                    >
                      <ShoppingBag size={18} /> My Orders
                    </Link>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-3 text-sm font-medium text-black py-2 text-left"
                    >
                      <LogOut size={18} /> Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 bg-[#191714] text-white rounded-xl text-center font-medium shadow-md"
                  >
                    Sign In / Register
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
