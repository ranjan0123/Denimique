"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Bot,
  Boxes,
  FolderTree,
  LayoutDashboard,
  Layers3,
  MapPin,
  Megaphone,
  Send,
  Shapes,
  ShoppingCart,
  Sliders,
  Sparkles,
  Tags,
  TicketPercent,
  Truck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Catalog",
    items: [
      { title: "Main Categories", href: "/admin/main-categories", icon: Shapes },
      { title: "Categories", href: "/admin/categories", icon: FolderTree },
      { title: "Subcategories", href: "/admin/subcategories", icon: Tags },
      { title: "Products", href: "/admin/products", icon: Boxes },
      { title: "AI Knowledge", href: "/admin/ai-knowledge", icon: Bot },
    ],
  },
  {
    title: "Commerce",
    items: [
      { title: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { title: "Promo Codes", href: "/admin/promocodes", icon: TicketPercent },
      { title: "Webhook Logs", href: "/admin/webhooks", icon: Truck },
    ],
  },
  {
    title: "Storefront Content",
    items: [
      { title: "Hero", href: "/admin/hero", icon: Megaphone },
      { title: "Hot Product", href: "/admin/hot-product", icon: Sparkles },
      { title: "Blogs", href: "/admin/blogs", icon: BookOpen },
      { title: "City Pages", href: "/admin/city-pages", icon: MapPin },
      { title: "Form Responses", href: "/admin/form-responses", icon: Layers3 },
      { title: "Push Notification", href: "/admin/push", icon: Send },
    ],
  },
  {
    title: "Settings",
    items: [{ title: "Store Settings", href: "/admin/settings", icon: Sliders }],
  },
];

interface AdminSidebarProps {
  isSuperAdmin: boolean;
  mobileOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({
  isSuperAdmin,
  mobileOpen,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const groups: NavGroup[] = isSuperAdmin
    ? [
        ...NAV_GROUPS,
        {
          title: "Administration",
          items: [{ title: "Users", href: "/admin/users", icon: Users }],
        },
      ]
    : NAV_GROUPS;

  const isActive = (href: string) =>
    pathname === href || (href !== "/admin" && pathname?.startsWith(`${href}/`));

  const content = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <Link
          href="/admin"
          className="text-sm font-bold tracking-wide text-black"
          onClick={onClose}
        >
          Denimique
          <span className="ml-1.5 rounded-full bg-[#1B2E27]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-black">
            Admin
          </span>
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-black hover:bg-slate-100 hover:text-black lg:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        <Link
          href="/admin"
          onClick={onClose}
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
            pathname === "/admin"
              ? "bg-[#1B2E27] text-white"
              : "text-black hover:bg-slate-100"
          }`}
        >
          <LayoutDashboard size={17} />
          Dashboard
        </Link>

        {groups.map((group) => (
          <div key={group.title}>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-black">
              {group.title}
            </p>
            <div className="mt-2 space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-[#1B2E27]/10 text-black"
                        : "text-black hover:bg-slate-100"
                    }`}
                  >
                    <Icon size={16} className={active ? "text-black" : "text-black"} />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block lg:w-64 lg:shrink-0 lg:border-r lg:border-slate-200">
        <div className="sticky top-0 h-screen">{content}</div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80vw] shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
