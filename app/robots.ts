import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://suitablevastra.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/*",
          "/admin",
          "/admin/",
          "/login",
          "/signup",
          "/checkout",
          "/cart",
          "/wishlist",
          "/orders",
          "/profile",
          "/notifications",
          "/verify-email",
          "/verify-email/*",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
