"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "@/components/ui/AppImage";
import Link from "next/link";
import { getCategoryHierarchy, getProducts, getProductPrimaryImage } from "@/lib/storefront";

interface CollectionTile {
  id: string;
  title: string;
  image: string;
  href: string;
}

export default function FusionSpotlight() {
  const [tiles, setTiles] = useState<CollectionTile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const hierarchy = await getCategoryHierarchy();
        const allCategories = hierarchy.flatMap((mainCategory) =>
          mainCategory.categories.map((category) => ({ mainCategory, category })),
        );

        const results = await Promise.all(
          allCategories.map(async ({ category }) => {
            const [product] = await getProducts({ category: category._id, limit: 1 }).catch(
              () => [],
            );
            if (!product) return null;

            return {
              id: category._id,
              title: category.name.trim(),
              image: getProductPrimaryImage(product),
              href: `/shop?category=${category.slug}`,
            };
          }),
        );

        if (!cancelled) {
          setTiles(results.filter((tile): tile is CollectionTile => Boolean(tile)));
        }
      } catch (error) {
        console.error("Failed to load collections:", error);
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
    <section className="relative overflow-hidden bg-[#F5F7FA] py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-5 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#173F70]/20 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#173F70]">
            Browse
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold text-[#102B50]">
            Shop by Collection
          </h2>
          <p className="mt-3 text-gray-600 max-w-xl mx-auto">
            Find your next favourite from the Denimique collection.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-[#F1F4F8] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
            {tiles.map((tile, index) => (
              <motion.div
                key={tile.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: (index % 6) * 0.05 }}
                viewport={{ once: true }}
              >
                <Link
                  href={tile.href}
                  className="group relative block aspect-square overflow-hidden rounded-2xl bg-[#F1F4F8] shadow-[0_6px_18px_rgba(23,63,112,0.1)]"
                >
                  <Image
                    src={tile.image}
                    alt={tile.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-3 text-sm font-semibold text-white leading-tight">
                    {tile.title}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
