"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  BookOpen,
  FolderTree,
  Layers3,
  Megaphone,
  MapPin,
  Package,
  Plus,
  Send,
  Shapes,
  ShoppingCart,
  Sparkles,
  Sliders,
  Tags,
  TicketPercent,
  Truck,
  Users,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { HierarchyMainCategory } from "@/lib/catalog";
import type { Order } from "@/types/commerce";
import {
  formatStatusLabel,
  getOrderStatusTone,
  getPaymentStatusTone,
} from "@/lib/commerce";

interface ProductResponseItem {
  _id: string;
}

interface PromoCodeResponseItem {
  _id: string;
  isActive?: boolean;
}

export default function AdminPage() {
  const { checkAuth, user } = useAuthStore();
  const [hierarchy, setHierarchy] = useState<HierarchyMainCategory[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCodeResponseItem[]>([]);
  const [blogStats, setBlogStats] = useState({
    totalBlogs: 0,
    publishedBlogs: 0,
    draftBlogs: 0,
    totalViews: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const mainCategoryCount = hierarchy.length;
  const categoryCount = hierarchy.reduce(
    (total, mainCategory) => total + mainCategory.categories.length,
    0,
  );
  const subcategoryCount = hierarchy.reduce(
    (total, mainCategory) =>
      total +
      mainCategory.categories.reduce(
        (categoryTotal, category) =>
          categoryTotal + category.subcategories.length,
        0,
      ),
    0,
  );

  const activePromoCount = promoCodes.filter((promoCode) => promoCode.isActive).length;
  const pendingOrders = orders.filter((order) =>
    ["pending", "confirmed", "processing"].includes(order.orderStatus),
  );
  const paymentAttentionOrders = orders.filter((order) =>
    ["pending", "cod_pending", "failed"].includes(order.paymentStatus),
  );
  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 5),
    [orders],
  );

  const statCards = [
    {
      label: "Pending Orders",
      value: pendingOrders.length,
      hint: "Orders needing fulfillment",
      icon: ShoppingCart,
    },
    {
      label: "Payment Attention",
      value: paymentAttentionOrders.length,
      hint: "Pending or failed payments",
      icon: Truck,
    },
    {
      label: "Products",
      value: productCount,
      hint: "Total live catalog items",
      icon: Package,
    },
    {
      label: "Active Promos",
      value: activePromoCount,
      hint: "Discount codes currently active",
      icon: TicketPercent,
    },
  ];

  const quickActions = [
    {
      title: "Add Product",
      href: "/admin/products/add",
      icon: Plus,
      tone: "bg-[#7A3511] text-[#D4AF37] hover:bg-[#5A260F]",
      description: "Create a new sellable item",
      priority: true,
    },
    {
      title: "Review Orders",
      href: "/admin/orders",
      icon: ShoppingCart,
      tone: "bg-white text-[#4A230F] border border-[#7A3511]/20 hover:bg-[#7A3511]/5",
      description: "Update order and payment status",
      priority: true,
    },
    {
      title: "Create Promo",
      href: "/admin/promocodes/add",
      icon: TicketPercent,
      tone: "bg-white text-[#4A230F] border border-[#7A3511]/20 hover:bg-[#7A3511]/5",
      description: "Launch a new discount code",
      priority: true,
    },
    {
      title: "Hero Content",
      href: "/admin/hero",
      icon: Megaphone,
      tone: "bg-white text-[#4A230F] border border-[#7A3511]/20 hover:bg-[#7A3511]/5",
      description: "Update homepage hero messaging",
    },
    {
      title: "Hot Product",
      href: "/admin/hot-product",
      icon: Sparkles,
      tone: "bg-white text-[#4A230F] border border-[#7A3511]/20 hover:bg-[#7A3511]/5",
      description: "Manage featured offers",
    },
    {
      title: "City Pages",
      href: "/admin/city-pages",
      icon: MapPin,
      tone: "bg-white text-[#4A230F] border border-[#7A3511]/20 hover:bg-[#7A3511]/5",
      description: "Manage location landing pages",
    },
    {
      title: "New Blog",
      href: "/admin/blogs/create",
      icon: BookOpen,
      tone: "bg-white text-[#4A230F] border border-[#7A3511]/20 hover:bg-[#7A3511]/5",
      description: "Publish a fresh story",
      priority: true,
    },
    {
      title: "Form Responses",
      href: "/admin/form-responses",
      icon: Layers3,
      tone: "bg-white text-[#4A230F] border border-[#7A3511]/20 hover:bg-[#7A3511]/5",
      description: "View all submissions",
      priority: true,
    },
    {
      title: "Store Settings",
      href: "/admin/settings",
      icon: Sliders,
      tone: "bg-white text-[#4A230F] border border-[#7A3511]/20 hover:bg-[#7A3511]/5",
      description: "Toggle checkout behavior",
    },
    {
      title: "Push Notification",
      href: "/admin/push",
      icon: Send,
      tone: "bg-white text-[#4A230F] border border-[#7A3511]/20 hover:bg-[#7A3511]/5",
      description: "Send a custom push to subscribed customers",
    },
    ...(user?.role === "superadmin"
      ? [
          {
            title: "User Management",
            href: "/admin/users",
            icon: Users,
            tone: "bg-white text-[#4A230F] border border-[#7A3511]/20 hover:bg-[#7A3511]/5",
            description: "Manage roles and access",
          },
        ]
      : []),
  ];

  const primaryActions = quickActions.filter((action) => action.priority);
  const secondaryActions = quickActions.filter((action) => !action.priority);

  const priorityQueue = [
    {
      title: "Orders to process",
      description: "Pending, confirmed, or processing",
      href: "/admin/orders",
      count: pendingOrders.length,
    },
    {
      title: "Payment attention",
      description: "Pending, COD pending, or failed",
      href: "/admin/orders",
      count: paymentAttentionOrders.length,
    },
    {
      title: "Draft blogs",
      description: "Needs review before publishing",
      href: "/admin/blogs",
      count: blogStats.draftBlogs,
    },
  ];

  const managementGroups = [
    {
      title: "Catalog Structure",
      subtitle: "Shape the navigation tree before assigning products.",
      items: [
        {
          title: "Main Categories",
          value: mainCategoryCount,
          href: "/admin/main-categories",
          addHref: "/admin/main-categories/add",
          icon: Shapes,
        },
        {
          title: "Categories",
          value: categoryCount,
          href: "/admin/categories",
          addHref: "/admin/categories/add",
          icon: FolderTree,
        },
        {
          title: "Subcategories",
          value: subcategoryCount,
          href: "/admin/subcategories",
          addHref: "/admin/subcategories/add",
          icon: Tags,
        },
      ],
    },
    {
      title: "Commerce Management",
      subtitle: "Handle products, promos, and fulfillment from one lane.",
      items: [
        {
          title: "Products",
          value: productCount,
          href: "/admin/products",
          addHref: "/admin/products/add",
          icon: Boxes,
        },
        {
          title: "Promo Codes",
          value: activePromoCount,
          href: "/admin/promocodes",
          addHref: "/admin/promocodes/add",
          icon: Sparkles,
        },
        {
          title: "Orders",
          value: orders.length,
          href: "/admin/orders",
          addHref: "/admin/orders",
          icon: ShoppingCart,
        },
      ],
    },
    {
      title: "Storefront Content",
      subtitle: "Keep the homepage messaging fresh and on-brand.",
      items: [
        {
          title: "Hero",
          value: 1,
          href: "/admin/hero",
          addHref: "/admin/hero",
          icon: Megaphone,
        },
        {
          title: "Hot Product",
          value: 1,
          href: "/admin/hot-product",
          addHref: "/admin/hot-product",
          icon: Sparkles,
        },
        {
          title: "Blogs",
          value: blogStats.totalBlogs,
          href: "/admin/blogs",
          addHref: "/admin/blogs/create",
          icon: BookOpen,
        },
        {
          title: "Form Responses",
          value: "—",
          href: "/admin/form-responses",
          addHref: "/admin/form-responses",
          icon: Layers3,
        },
        {
          title: "City Pages",
          value: "—",
          href: "/admin/city-pages",
          addHref: "/admin/city-pages",
          icon: MapPin,
        },
        {
          title: "Push Notification",
          value: "—",
          href: "/admin/push",
          addHref: "/admin/push",
          icon: Send,
        },
      ],
    },
    ...(user?.role === "superadmin"
      ? [
          {
            title: "Administration",
            subtitle: "Control access and roles for the entire team.",
            items: [
              {
                title: "Users",
                value: "—",
                href: "/admin/users",
                addHref: "/admin/users",
                icon: Users,
              },
            ],
          },
        ]
      : []),
  ];

  async function fetchDashboardData() {
    try {
      const [hierarchyRes, productsRes, ordersRes, promoCodesRes, blogStatsRes] =
        await Promise.all([
          api.get("/categories/hierarchy"),
          api.get("/products", { params: { limit: 1000 } }),
          api.get("/orders"),
          api.get("/promocodes"),
          api.get("/admin/blogs/analytics"),
        ]);

      setHierarchy(hierarchyRes.data.mainCategories || hierarchyRes.data);

      const products: ProductResponseItem[] =
        productsRes.data.products || productsRes.data || [];
      setProductCount(products.length);

      setOrders(ordersRes.data.orders || ordersRes.data || []);
      setPromoCodes(promoCodesRes.data.promocodes || promoCodesRes.data || []);
      setBlogStats(blogStatsRes.data.stats || blogStatsRes.data || blogStats);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  }

  useEffect(() => {
    const verifyAuth = async () => {
      const isAuth = await checkAuth();
      if (!isAuth) {
        router.push("/login");
        return;
      }

      setTimeout(async () => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser || !['admin', 'superadmin'].includes(currentUser.role || "")) {
          router.push("/");
          return;
        }
        await fetchDashboardData();
        setIsLoading(false);
      }, 100);
    };

    verifyAuth();
  }, [checkAuth, router]);

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
            {`Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s what needs your attention today.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {primaryActions.map((action) => {
            const Icon = action.icon;
            const isFirst = action === primaryActions[0];
            return (
              <Link
                key={action.title}
                href={action.href}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                  isFirst
                    ? "bg-[#7A3511] text-white hover:bg-[#5A260F]"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {action.title}
              </Link>
            );
          })}
        </div>
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
                  <p className="mt-1.5 text-xs text-slate-400">{card.hint}</p>
                </div>
                <div className="rounded-xl bg-[#7A3511]/8 p-2.5 text-[#7A3511]">
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Priority queue + structure snapshot */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Priority Queue
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {priorityQueue.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {item.description}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-semibold ${
                    item.count > 0
                      ? "bg-[#7A3511]/10 text-[#7A3511]"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {item.count}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Structure Snapshot
          </p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-xl font-semibold text-slate-950">{mainCategoryCount}</p>
              <p className="mt-1 text-xs text-slate-500">Main</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-xl font-semibold text-slate-950">{categoryCount}</p>
              <p className="mt-1 text-xs text-slate-500">Category</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-xl font-semibold text-slate-950">{subcategoryCount}</p>
              <p className="mt-1 text-xs text-slate-500">Subcategory</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-slate-950">
              Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7A3511] hover:text-[#5A260F]"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No orders yet. New customer orders will appear here.
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <Link
                  key={order._id}
                  href="/admin/orders"
                  className="flex flex-col gap-3 py-3.5 first:pt-0 last:pb-0 hover:bg-slate-50/60 md:flex-row md:items-center md:justify-between md:-mx-2 md:px-2 md:rounded-lg"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-950">
                      {order.orderNumber}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {order.user?.name || order.shippingAddress.fullName} •{" "}
                      {order.items.length} items • Rs. {order.total}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getOrderStatusTone(
                        order.orderStatus,
                      )}`}
                    >
                      {formatStatusLabel(order.orderStatus)}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getPaymentStatusTone(
                        order.paymentStatus,
                      )}`}
                    >
                      {formatStatusLabel(order.paymentStatus)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-slate-950">
              Catalog Preview
            </h2>
            <FolderTree className="h-4 w-4 text-slate-400" />
          </div>

          {hierarchy.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              No hierarchy data yet. Start with a main category, then add
              categories and subcategories.
            </div>
          ) : (
            <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {hierarchy.map((mainCategory) => (
                <div
                  key={mainCategory._id}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                      {mainCategory.name}
                    </h3>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 border border-slate-200">
                      {mainCategory.categories.length}
                    </span>
                  </div>

                  {mainCategory.categories.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {mainCategory.categories.map((category) => (
                        <span
                          key={category._id}
                          className="inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-200"
                        >
                          {category.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Management shortcuts */}
      <section className="space-y-4">
        {managementGroups.map((group) => (
          <div
            key={group.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6"
          >
            <h2 className="text-base font-semibold text-slate-950">
              {group.title}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">{group.subtitle}</p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3.5 transition-colors hover:border-[#7A3511]/30 hover:bg-[#7A3511]/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-slate-100 p-2 text-slate-500 group-hover:bg-white group-hover:text-[#7A3511]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-800">
                        {item.title}
                      </span>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 group-hover:bg-white group-hover:text-[#7A3511]">
                      {item.value}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {secondaryActions.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
            <h2 className="text-base font-semibold text-slate-950">
              More Shortcuts
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {secondaryActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Icon className="h-4 w-4 text-slate-400" />
                    {action.title}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}


