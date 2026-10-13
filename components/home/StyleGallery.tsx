"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "@/components/ui/AppImage";
import { getProductPrimaryImage } from "@/lib/storefront";
import type { Product } from "@/types/product";

interface StyleGalleryProps {
  products: Product[];
}

export default function StyleGallery({ products }: StyleGalleryProps) {
  const tiles = products.slice(0, 6);

  if (tiles.length === 0) return null;

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-5 md:px-6">
        <div className="mb-10 flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#173F70]/20 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#173F70]">
            Style Gallery
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold text-[#102B50]">
            Explore the Collection
          </h2>
        </div>

        {/* Masonry: each image keeps its own natural aspect ratio, so
            nothing gets cropped and tiles never fight each other for a
            forced box shape. */}
        <div className="columns-2 gap-3 sm:columns-3 md:gap-4">
          {tiles.map((product, index) => (
            <motion.div
              key={product.id || product._id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.06 }}
              viewport={{ once: true, amount: 0.3 }}
              className="mb-3 break-inside-avoid md:mb-4"
            >
              <Link
                href={`/products/${product.slug}`}
                className="group relative block overflow-hidden rounded-2xl bg-[#F1F4F8]"
              >
                <Image
                  src={getProductPrimaryImage(product)}
                  alt={product.name}
                  width={480}
                  height={600}
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="h-auto w-full transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="absolute inset-x-3 bottom-3 translate-y-2 text-sm font-semibold text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 line-clamp-1">
                  {product.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
