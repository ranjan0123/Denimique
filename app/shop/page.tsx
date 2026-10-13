import ShopClient from "@/components/shop/ShopClient";
import type { Metadata } from "next";
import { getCategoryHierarchy, getProducts } from "@/lib/storefront";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Shop Fashion Online | Denimique",
  description:
    "Discover Denimique’s denim, contemporary fashion, and everyday lifestyle essentials.",

  keywords: [
    "Denimique",
    "Fashion",
    "Denim",
    "Lifestyle fashion",
    "Apparel",
    "Men's Fashion",
    "Women's Fashion",
    "Indian Clothing",
    "Premium Fashion",
  ],

  alternates: {
    canonical: "/shop",
  },

  openGraph: {
    title: "Shop Fashion | Denimique",
    description: "Explore denim, contemporary fashion, and everyday essentials from Denimique.",
    url: "/shop",
    type: "website",
    images: [
      {
        url: "/images/shop-fashion-banner.jpg",
        width: 1200,
        height: 630,
        alt: "Denimique Fashion Collection",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Shop Fashion | Denimique",
    description: "Denim and lifestyle fashion from Denimique.",
    images: ["/images/shop-fashion-banner.jpg"],
  },
};

const SHOP_FALLBACK_ERROR =
  "Unable to load our fashion collection right now. Please try again later.";

const getShopInitialData = async () => {
  try {
    const [productsResult, hierarchyResult] = await Promise.allSettled([
      getProducts({ limit: 1000 }),
      getCategoryHierarchy(),
    ]);

    const allProducts =
      productsResult.status === "fulfilled" ? productsResult.value : [];
    const allHierarchy =
      hierarchyResult.status === "fulfilled" ? hierarchyResult.value : [];

    if (productsResult.status === "rejected") {
      console.error("Failed to fetch shop products:", productsResult.reason);
    }

    if (hierarchyResult.status === "rejected") {
      console.error("Failed to fetch shop hierarchy:", hierarchyResult.reason);
    }

    // The catalog has been fully migrated to fashion (Men's / Women's main
    // categories) — no separate "fashion" main category exists to filter by.

    const hierarchy = Array.isArray(allHierarchy) ? allHierarchy : [];
    const products = Array.isArray(allProducts) ? allProducts : [];

    return {
      products,
      hierarchy,
      error: null,
    };
  } catch (error) {
    console.error("Failed to fetch shop data:", error);

    return {
      products: [],
      hierarchy: [],
      error: SHOP_FALLBACK_ERROR,
    };
  }
};

export default async function ShopPage() {
  const { products, hierarchy, error } = await getShopInitialData();

  return (
    <Suspense
      fallback={
        <div className="py-20 text-center">Loading Fashion Collection...</div>
      }
    >
      <main>
        <h1 className="sr-only">
          Shop Premium Fashion for Men, Women & Accessories
        </h1>

        <ShopClient
          initialProducts={products}
          initialHierarchy={hierarchy}
          initialError={error}
        />
      </main>
    </Suspense>
  );
}
