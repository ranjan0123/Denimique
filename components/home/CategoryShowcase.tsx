import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import AppImage from "@/components/ui/AppImage";
import { formatProductPrice, getProductPrimaryImage } from "@/lib/storefront";
import type { Product } from "@/types/product";

export default function CategoryShowcase({
  products,
}: {
  products: Product[];
}) {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-5 md:px-6">
        <div className="mb-10 flex items-end justify-between gap-4 md:mb-12">
          <div>
            <span className="inline-flex items-center rounded-full border border-[#A58D68]/30 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-black">
              Explore
            </span>
            <h2 className="mt-4 text-3xl font-bold text-black md:text-5xl">
              Shop by Category
            </h2>
            <p className="mt-3 text-sm leading-6 text-black md:text-base md:leading-7">
              A fresh edit of pieces from your collection.
            </p>
          </div>
          <Link
            href="/shop"
            className="hidden items-center gap-2 border-b border-[#A58D68]/50 pb-1 text-xs font-semibold uppercase tracking-[0.14em] text-black transition-colors hover:text-black sm:inline-flex"
          >
            View all <ArrowUpRight size={15} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4 xl:gap-x-7">
          {products.map((product) => (
            <article key={product.slug} className="group min-w-0">
              <Link
                href={`/products/${product.slug}`}
                aria-label={`View ${product.name}`}
                className="block"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-white">
                  <AppImage
                    src={getProductPrimaryImage(product)}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    className="object-contain transition-transform duration-500 ease-out group-hover:scale-[1.035]"
                  />
                  <span className="absolute left-3 top-3 rounded-full border border-black/5 bg-white/90 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-black shadow-sm backdrop-blur-sm">
                    {product.subcategory?.name || product.category?.name || "Collection"}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2 pt-3">
                  <h3 className="line-clamp-2 text-sm font-medium leading-5 text-black transition-colors group-hover:text-black sm:text-base">
                    {product.name}
                  </h3>
                  <span className="shrink-0 pt-0.5 text-sm font-semibold text-black">
                    {formatProductPrice(
                      product.price ?? product.discountPrice ?? product.basePrice,
                    )}
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
