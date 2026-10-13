import type { Metadata } from "next";
import AboutComponent, { type AboutCollection } from "@/components/AboutComponent";
import {
  getCategoryHierarchy,
  getProductPrimaryImage,
  getProducts,
  productMatchesCategory,
} from "@/lib/storefront";
import type { Product } from "@/types/product";
import type { Category } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "About Denimique | Everyday Fashion",
  description:
    "Discover Denimique, your destination for contemporary fashion, everyday essentials, and curated lifestyle collections.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Denimique | Everyday Fashion",
    description:
      "Discover contemporary fashion, everyday essentials, and curated lifestyle collections from Denimique.",
    url: "/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Denimique | Everyday Fashion",
    description:
      "Discover contemporary fashion, everyday essentials, and curated lifestyle collections from Denimique.",
  },
};

const scoreProduct = (product: Product): number => {
  let score = 0;
  if (product.isBestSeller) score += 3;
  if (product.isFeatured) score += 2;
  if (product.rating) score += product.rating;
  return score;
};

const getAboutData = async () => {
  try {
    const [products, hierarchy] = await Promise.all([
      getProducts({ limit: 5000 }),
      getCategoryHierarchy(),
    ]);

    const categoriesBySlug = new Map<string, Category>(
      hierarchy
        .flatMap((mainCat) => mainCat.categories)
        .map((category) => [category.slug, category]),
    );

    products.forEach((product) => {
      const category = product.category;
      if (category?.slug && category.name && !categoriesBySlug.has(category.slug)) {
        categoriesBySlug.set(category.slug, category);
      }
    });
    const categories = [...categoriesBySlug.values()];

    const collections: AboutCollection[] = categories
      .map((category) => {
        const categoryProducts = products
          .filter((product) => productMatchesCategory(product, category.slug))
          .sort((a, b) => scoreProduct(b) - scoreProduct(a));

        const topProduct = categoryProducts[0];
        return topProduct
          ? {
              name: category.name,
              slug: category.slug,
              count: categoryProducts.length,
              image: getProductPrimaryImage(topProduct),
            }
          : null;
      })
      .filter((item): item is AboutCollection => Boolean(item))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      totalProducts: products.length,
      totalCollections: categories.length,
      collections,
    };
  } catch (error) {
    console.error("Failed to load about page data:", error);
    return { totalProducts: 0, totalCollections: 0, collections: [] };
  }
};

export default async function AboutPage() {
  const data = await getAboutData();

  return <AboutComponent {...data} />;
}
