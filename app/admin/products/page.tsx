"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import Image from "@/components/ui/AppImage";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { normalizeProduct } from "@/lib/storefront";
import type { Product } from "@/types/product";
import {
  AlertTriangle,
  ArrowDownUp,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Package,
  Plus,
  Search,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";

type SortOption = "newest" | "price-asc" | "price-desc" | "name-asc";
type SourceFilter = "all" | "native" | "imported";

interface AdminProduct extends Product {
  isImported: boolean;
  totalStock: number;
  hasStockTracking: boolean;
}

const PAGE_SIZE = 24;

const normalizeAdminProduct = (raw: Record<string, unknown>): AdminProduct => {
  // Not gated on `!raw.slug` — every legacy product now has a backfilled
  // slug (scripts/backfill-product-slugs.ts), so that check would always be
  // false. `name` is the reliable signal: legacy imports never have it.
  const isImported = Boolean(raw.title && raw.handle && !raw.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const product = normalizeProduct(raw as any);
  const hasStockTracking = Boolean(product.variants && product.variants.length > 0);
  const totalStock = hasStockTracking
    ? product.variants!.reduce((sum, variant) => sum + (variant.stock || 0), 0)
    : 0;

  return { ...product, isImported, totalStock, hasStockTracking };
};

export default function AdminProductsPage() {
  const { checkAuth } = useAuthStore();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products", { params: { limit: 1000 } });
      const productList = response.data.products || response.data;
      setProducts(productList.map(normalizeAdminProduct));
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const verifyAuth = async () => {
      const isAuth = await checkAuth();
      if (!isAuth) {
        router.push("/login");
        return;
      }

      // Wait a bit for the user state to update
      setTimeout(() => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser || !['admin', 'superadmin'].includes(currentUser.role || "")) {
          router.push("/");
          return;
        }
        fetchProducts();
      }, 100);
    };

    verifyAuth();
  }, [checkAuth, router]);

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const slug = products.find((p) => p._id === productId)?.slug;

    setIsDeleting(productId);
    try {
      await api.delete(`/products/${productId}`);
      setProducts(products.filter((p) => p._id !== productId));
      toast.success("Product deleted successfully");
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      }).catch((revalidateError) => {
        console.error("Failed to revalidate storefront cache:", revalidateError);
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    } finally {
      setIsDeleting(null);
    }
  };

  const stats = useMemo(() => {
    const total = products.length;
    const featured = products.filter((p) => p.isFeatured).length;
    const bestSellers = products.filter((p) => p.isBestSeller).length;
    const outOfStock = products.filter(
      (p) => p.hasStockTracking && p.totalStock === 0,
    ).length;
    const imported = products.filter((p) => p.isImported).length;

    return { total, featured, bestSellers, outOfStock, imported };
  }, [products]);

  const categoryOptions = useMemo(() => {
    const names = new Set<string>();
    products.forEach((p) => {
      if (p.category?.name) names.add(p.category.name);
    });
    return [...names].sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = products.filter((p) => {
      if (query && !p.name.toLowerCase().includes(query)) return false;
      if (categoryFilter !== "all" && p.category?.name !== categoryFilter)
        return false;
      if (sourceFilter === "native" && p.isImported) return false;
      if (sourceFilter === "imported" && !p.isImported) return false;
      return true;
    });

    const getPrice = (p: AdminProduct) => p.discountPrice || p.basePrice || 0;

    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return getPrice(a) - getPrice(b);
        case "price-desc":
          return getPrice(b) - getPrice(a);
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "newest":
        default:
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
      }
    });

    return sorted;
  }, [products, search, categoryFilter, sourceFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // Any filter change invalidates the current page position.
  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, sourceFilter, sort]);

  const statCards = [
    { label: "Total Products", value: stats.total, icon: Package },
    { label: "Featured", value: stats.featured, icon: Sparkles },
    { label: "Best Sellers", value: stats.bestSellers, icon: Star },
    { label: "Out of Stock", value: stats.outOfStock, icon: AlertTriangle },
  ];

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-[#7A3511] animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl">
            Products
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your product inventory.
          </p>
        </div>

        <Link
          href="/admin/products/add"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#7A3511] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#5A260F] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {/* KPI stat cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {card.value}
                  </p>
                </div>
                <div className="rounded-xl bg-[#7A3511]/8 p-2.5 text-[#7A3511]">
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Imported-catalog notice */}
      {stats.imported > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Truck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-amber-600" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900">
              {stats.imported} product{stats.imported === 1 ? "" : "s"} came from a
              bulk-imported supplier catalog (Snazzyway)
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              These were dropshipped in with a different data shape than
              Denimique&apos;s own products and don&apos;t have a slug, brand,
              or Denimique-native description. Use the &quot;Source&quot; filter
              below to review or remove them.
            </p>
          </div>
        </div>
      )}

      {/* Toolbar: search, filters, sort */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#7A3511]/40 focus:ring-2 focus:ring-[#7A3511]/10"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#7A3511]/40"
          >
            <option value="all">All categories</option>
            {categoryOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
            className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#7A3511]/40"
          >
            <option value="all">All sources</option>
            <option value="native">Denimique products</option>
            <option value="imported">Imported (Snazzyway)</option>
          </select>

          <div className="relative">
            <ArrowDownUp className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="rounded-lg border border-slate-200 bg-slate-50/60 py-2 pl-8 pr-3 text-sm text-slate-700 outline-none focus:border-[#7A3511]/40"
            >
              <option value="newest">Newest first</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>
        </div>
      </section>

      {/* Products table */}
      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Product
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Category
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Price
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Stock
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageProducts.map((product) => (
                <tr key={product._id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          className="h-10 w-10 rounded-lg object-cover"
                          src={product.images[0]}
                          alt={product.name}
                          width={40}
                          height={40}
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                          <Boxes className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium text-slate-900 max-w-[260px]">
                            {product.name}
                          </p>
                          {product.isImported && (
                            <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                              Imported
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-slate-500 max-w-[260px]">
                          {product.flavor || product.category?.name || "Fashion collection"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-600">
                    {product.category?.name || "—"}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="text-sm text-slate-900">
                      ₹{product.discountPrice || product.basePrice}
                    </div>
                    {Boolean(
                      product.discountPrice &&
                        product.discountPrice < product.basePrice,
                    ) && (
                      <div className="text-xs text-slate-400 line-through">
                        ₹{product.basePrice}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm">
                    {product.hasStockTracking ? (
                      <span
                        className={
                          product.totalStock === 0
                            ? "font-semibold text-red-600"
                            : "text-slate-700"
                        }
                      >
                        {product.totalStock}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {product.isBestSeller && (
                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                          Best Seller
                        </span>
                      )}
                      {product.isFeatured && (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                          Featured
                        </span>
                      )}
                      {!product.isBestSeller && !product.isFeatured && (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/admin/products/edit/${product._id}`}
                        className="text-[#7A3511] hover:text-[#5A260F]"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product._id!)}
                        disabled={isDeleting === product._id}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        {isDeleting === product._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-16 text-center">
            <Boxes className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-sm font-medium text-slate-900">
              {products.length === 0 ? "No products" : "No matching products"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {products.length === 0
                ? "Get started by adding a new product."
                : "Try adjusting your search or filters."}
            </p>
            {products.length === 0 && (
              <div className="mt-6">
                <Link
                  href="/admin/products/add"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#7A3511] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5A260F] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Product
                </Link>
              </div>
            )}
          </div>
        )}

        {filteredProducts.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} of{" "}
              {filteredProducts.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>
              <span className="text-xs text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>
    </div>
  );
}
