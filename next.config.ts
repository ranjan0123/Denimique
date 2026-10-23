import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the Next.js development indicator (the black "N" button).
  devIndicators: false,
  images: {
    // Setting localPatterns at all makes it an allowlist for every local
    // image path (not just the one it's meant to cover), so plain local
    // assets (e.g. /final-logo.png) need their own entry alongside the
    // app's same-origin image proxy (lib/api.ts resolveApiAssetUrl), which
    // rewrites backend/external image URLs to /api/image-proxy?src=... —
    // local paths with a query string are blocked unless allow-listed here,
    // which otherwise throws (fatal when rendered in a Server Component).
    localPatterns: [
      {
        pathname: "/**",
      },
      {
        pathname: "/api/image-proxy",
        search: "?src=*",
      },
    ],
    remotePatterns: [
      // ✅ Local backend (development)
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/images/**",
      },

      // ✅ Render backend (production)

      {
        protocol: "https",
        hostname: "suitablevastra-backend.onrender.com",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "suitablevastra-2lp8.onrender.com",
        pathname: "/uploads/**",
      },

      // ✅ api.suitablevastra.com backend (production)
      
      {
        protocol: "https",
        hostname: "api.suitablevastra.com",
        pathname: "/uploads/**",
      },

      // ✅ Cloudinary delivery
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },

      // ✅ Placeholder images (admin-entered placeholder URLs)
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },

      // ✅ Snazzyway dropship supplier images (imported Lingerie catalog)
      {
        protocol: "https",
        hostname: "flyadmin.snazzywaydropshipping.com",
        pathname: "/**",
      },
    ],
    qualities: [75, 85, 90, 95, 100],
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
