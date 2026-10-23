"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://suitablevastra.com";

const LABEL_MAP: Record<string, string> = {
  blog: "Blog",
  shop: "Shop",
  about: "About",
  contact: "Contact",
  cart: "Cart",
  checkout: "Checkout",
  wishlist: "Wishlist",
  orders: "Orders",
  profile: "Profile",
  login: "Login",
  signup: "Sign Up",
  admin: "Admin",
  "form-responses": "Form Responses",
  "city-pages": "City Pages",
  locations: "Locations",
  privacy: "Privacy Policy",
  "privacy-policy": "Privacy Policy",
  refund: "Refund & Cancellation",
  "refund-and-cancellation-policy": "Refund & Cancellation",
  terms: "Terms of Service",
  "terms-of-service": "Terms of Service",
};

const toTitle = (value: string) =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function Breadcrumbs() {
  const pathname = usePathname();

  if (!pathname || pathname === "/") return null;

  const normalizedPath = pathname
    .replace(/\/index\/?$/i, "/")
    .replace(/\/+/g, "/");

  const segments = normalizedPath
    .split("/")
    .filter(Boolean)
    .filter((segment) => {
      const value = segment.toLowerCase();
      return value !== "index" && value !== "home";
    });

  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = LABEL_MAP[segment.toLowerCase()] || toTitle(segment);
    return { href, label, isLast: index === segments.length - 1 };
  });

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      ...crumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 2,
        name: crumb.label,
        item: `${SITE_URL}${crumb.href}`,
      })),
    ],
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border-b border-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
        <nav className="flex items-center gap-2 text-sm text-black">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-black font-semibold hover:text-black transition-colors"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
          {crumbs.length > 0 && (
            <ChevronRight className="h-4 w-4 text-black" />
          )}
          {crumbs.map((crumb, index) => (
            <span key={crumb.href} className="inline-flex items-center gap-2">
              {!crumb.isLast ? (
                <>
                  <Link
                    href={crumb.href}
                    className="text-black hover:text-black transition-colors"
                  >
                    {crumb.label}
                  </Link>
                  <ChevronRight className="h-4 w-4 text-black" />
                </>
              ) : (
                <span className="text-black font-semibold">
                  {crumb.label}
                </span>
              )}
              {index === crumbs.length - 1 ? null : null}
            </span>
          ))}
        </nav>
      </div>
    </div>
  );
}

