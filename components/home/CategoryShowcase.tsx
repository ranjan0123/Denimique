"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProducts } from "@/lib/storefront";
import type { Product } from "@/types/product";

interface ShowcaseTile {
  title: string;
  desc: string;
  href: string;
  image: string;
}

const SUBCATEGORY_DESC: Record<string, string> = {
  Jeans: "Straight, cargo, and every fit in between.",
  Dresses: "Effortless silhouettes for day to night.",
  Tops: "Layering pieces built around your denim.",
};

// Only the Apparel line (Denimique's own products) is shown here — the
// bulk-imported supplier catalog (lingerie, jewelry, etc.) stays out of the
// brand-facing homepage and is still fully browsable from /shop.
const APPAREL_CATEGORY_SLUG = "apparel";
const MIN_PRODUCTS_PER_TILE = 5;

export default function CategoryShowcase() {
  const [tiles, setTiles] = useState<ShowcaseTile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const products = await getProducts({ limit: 5000 });
        const apparelProducts = products.filter(
          (product) => product.category?.slug === APPAREL_CATEGORY_SLUG,
        );

        const grouped = new Map<string, Product[]>();
        apparelProducts.forEach((product) => {
          const key = product.subcategory?.name?.trim();
          if (!key) return;
          if (!grouped.has(key)) grouped.set(key, []);
          grouped.get(key)?.push(product);
        });

        const subcategoryTiles = Array.from(grouped.entries())
          .filter(([, items]) => items.length >= MIN_PRODUCTS_PER_TILE)
          .map(([title, items]) => {
            const subcategorySlug = items[0]?.subcategory?.slug;
            const image = items.find((product) => product.images?.[0])?.images[0];
            if (!image) return null;
            return {
              title,
              desc: SUBCATEGORY_DESC[title] || "Explore this collection.",
              href: `/shop?category=${APPAREL_CATEGORY_SLUG}&subcategory=${encodeURIComponent(subcategorySlug || "")}`,
              image,
            };
          })
          .filter((tile): tile is ShowcaseTile => Boolean(tile))
          .sort((a, b) => b.title.localeCompare(a.title));

        const newest = [...apparelProducts].sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        )[0];

        const results = [
          ...subcategoryTiles,
          ...(newest?.images?.[0]
            ? [
                {
                  title: "New Arrivals",
                  desc: "The latest additions to the Denimique wardrobe.",
                  href: "/shop?sort=newest",
                  image: newest.images[0],
                },
              ]
            : []),
        ].slice(0, 4);

        if (!cancelled) {
          setTiles(results);
        }
      } catch (error) {
        console.error("Failed to load category showcase:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isLoading && tiles.length === 0) {
    return null;
  }

  return (
    <section className="bg-[#F5F2EE] py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-5 md:px-6">
        <div className="mb-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#A58D68]/30 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#92764A]">
            Explore
          </span>
          <h2 className="mt-4 text-3xl font-bold text-[#191714] md:text-5xl">
            Shop by Category
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#5F5A54] md:text-base md:leading-7">
            Find your fit, from everyday denim to statement pieces.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-[380px] md:h-[440px] rounded-3xl bg-white/40 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 md:gap-8">
            {tiles.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link
                  href={category.href}
                  className="group relative block overflow-hidden rounded-3xl border border-[#A58D68]/20 bg-white shadow-[0_10px_30px_rgba(25,23,20,0.08)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(25,23,20,0.14)]"
                >
                  <div className="relative h-52 overflow-hidden bg-[#E9E3DA] sm:h-60">
                    <img
                      src={category.image}
                      alt={`${category.title} collection`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.src = "/logo-removebg-preview.png";
                        event.currentTarget.onerror = null;
                      }}
                    />
                  </div>
                  <div className="p-6 md:p-8">
                    <h3 className="text-2xl font-bold text-[#191714] md:text-3xl">
                      {category.title}
                    </h3>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-[#5F5A54]">
                      {category.desc}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#92764A] border-b border-[#A58D68]/40 pb-1 transition-all duration-300 group-hover:gap-3">
                      Shop Now
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
