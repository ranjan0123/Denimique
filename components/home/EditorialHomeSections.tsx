import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { resolveApiAssetUrl } from "@/lib/api";
import { formatProductPrice, getProductPrimaryImage } from "@/lib/storefront";
import type { Product } from "@/types/product";
import LuxuryProductRail from "./LuxuryProductRail";

const STORY_PRODUCT_ORDER = [
  "midnight-whisper-silk-cami-shorts-set",
  "elegant-lace-seductive-black-nightgown",
  "luxurious-satin-maxi-sleepwear-for-women",
  "womens-forest-green-one-piece-dress",
];

export function EditorialCollections({ products = [] }: { products?: Product[] }) {
  return (
    <LuxuryProductRail
      products={products}
      eyebrow="The Denimique wardrobe"
      title="Find your point of view."
      description="Discover a considered edit of the pieces we're loving right now."
      compact
    />
  );
}

export function BrandStory({ products = [] }: { products?: Product[] }) {
  const eligibleProducts = products
    .filter((product, index, items) =>
      Boolean(getProductPrimaryImage(product)) &&
      !/\b(jeans?|denim|cargo|bras?|bralettes?|brassieres?|panties|panty|thong|underwear|lingerie|g-string)\b/i.test(
        `${product.name} ${product.category?.name ?? ""} ${product.subcategory?.name ?? ""}`,
      ) &&
      items.findIndex((item) => item.slug === product.slug) === index,
    )
    .sort((a, b) => {
      const aOrder = STORY_PRODUCT_ORDER.indexOf(a.slug);
      const bOrder = STORY_PRODUCT_ORDER.indexOf(b.slug);
      return (aOrder < 0 ? STORY_PRODUCT_ORDER.length : aOrder) -
        (bOrder < 0 ? STORY_PRODUCT_ORDER.length : bOrder);
    });
  const storyProducts = eligibleProducts.slice(0, 4);
  const moreProducts = eligibleProducts.slice(4, 8);

  return (
    <section className="grid bg-white md:min-h-[620px] md:grid-cols-2">
      <div className="grid min-h-[360px] grid-cols-2 grid-rows-2 gap-1.5 bg-white p-1.5 md:min-h-full md:gap-2 md:p-2">
        {storyProducts.length > 0 ? storyProducts.map((product, index) => (
          <Link
            key={product.slug}
            href={`/products/${product.slug}`}
            className={`group relative isolate min-h-0 overflow-hidden bg-white ${
              storyProducts.length === 1
                ? "col-span-2 row-span-2"
                : storyProducts.length === 2
                  ? "row-span-2"
                  : storyProducts.length === 3 && index === 2
                    ? "col-span-2"
                    : ""
            }`}
            aria-label={`View ${product.name}`}
          >
            <Image
              src={getProductPrimaryImage(product)}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="-z-10 object-contain p-3 transition-transform duration-700 group-hover:scale-[1.04] md:p-5"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-3 pb-3 pt-10 md:px-4 md:pb-4">
              <p className="line-clamp-1 text-xs font-medium text-white md:text-sm">
                {product.name}
              </p>
            </div>
          </Link>
        )) : (
          <div className="relative col-span-2 row-span-2 min-h-[360px]">
            <Image
              src={resolveApiAssetUrl("/uploads/products/grey-cargo-jeans/01.jpeg")}
              alt="Denimique grey high-waist cargo jeans"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-[52%_15%]"
            />
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 bg-white p-2 sm:gap-3 sm:p-3">
        {moreProducts.map((product) => (
          <Link
            key={product.slug}
            href={`/products/${product.slug}`}
            className="group flex min-w-0 flex-col overflow-hidden bg-white transition-shadow duration-300 hover:shadow-[0_14px_36px_rgba(25,23,20,0.12)]"
            aria-label={`View ${product.name}`}
          >
            <div className="relative aspect-[1.05] overflow-hidden bg-white">
              <Image
                src={getProductPrimaryImage(product)}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-contain p-3 transition-transform duration-700 ease-out group-hover:scale-[1.06] sm:p-5"
              />
            </div>
            <div className="flex flex-1 items-start justify-between gap-2 p-3 sm:p-4">
              <p className="line-clamp-2 text-xs font-medium leading-5 text-black sm:text-sm">
                {product.name}
              </p>
              <span className="shrink-0 text-xs font-semibold text-black sm:text-sm">
                {formatProductPrice(product.price ?? product.discountPrice ?? product.basePrice)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function SignatureCampaign({ products = [] }: { products?: Product[] }) {
  const campaignProducts = products
    .filter((product, index, items) =>
      Boolean(getProductPrimaryImage(product)) &&
      !/\b(jeans?|denim|cargo)\b/i.test(
        `${product.name} ${product.category?.name ?? ""} ${product.subcategory?.name ?? ""}`,
      ) &&
      items.findIndex((item) => item.slug === product.slug) === index,
    )
    .slice(0, 4);

  return (
    <section className="grid bg-white md:min-h-[620px] md:grid-cols-[0.85fr_1.15fr]">
      <div className="flex items-center px-7 py-14 sm:px-12 md:px-14 lg:px-20">
        <div className="max-w-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black">
            Denimique / The collection
          </p>
          <h2 className="mt-5 font-heading text-5xl leading-[0.98] text-black sm:text-6xl md:text-7xl">
            Everyday style,
            <br />
            reimagined.
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-6 text-black sm:text-base">
            Find considered pieces for the moments that make up your day.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex items-center gap-3 bg-[#191714] px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#92764A]"
          >
            Explore the collection <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
      <div className="grid min-h-[420px] grid-cols-2 grid-rows-2 gap-1.5 bg-white p-1.5 md:min-h-full md:gap-2 md:p-2">
        {campaignProducts.map((product, index) => (
          <Link
            key={product.slug}
            href={`/products/${product.slug}`}
            className={`group relative isolate min-h-[200px] overflow-hidden bg-white ${
              campaignProducts.length === 1
                ? "col-span-2 row-span-2"
                : campaignProducts.length === 2
                  ? "row-span-2"
                  : campaignProducts.length === 3 && index === 2
                    ? "col-span-2"
                    : ""
            }`}
            aria-label={`View ${product.name}`}
          >
            <Image
              src={getProductPrimaryImage(product)}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 30vw"
              className="-z-10 object-contain p-3 transition-transform duration-700 group-hover:scale-[1.04] md:p-5"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-3 pb-3 pt-10 md:px-4 md:pb-4">
              <p className="line-clamp-1 text-xs font-medium text-white md:text-sm">
                {product.name}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function LuxuryCampaign() {
  return (
    <section className="relative isolate flex min-h-[420px] items-end overflow-hidden bg-[#201D18] md:min-h-[560px]">
      <Image
        src="/img4.png"
        alt="Denimique occasionwear campaign in soft ivory and champagne tones"
        fill
        sizes="100vw"
        className="-z-20 object-cover object-[30%_center]"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
      <div className="mx-auto flex w-full max-w-[1440px] items-end justify-between gap-8 px-6 py-10 text-white sm:px-10 md:px-16 md:py-14">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/75">
            The occasion edit
          </p>
          <h2 className="mt-3 font-heading text-4xl leading-tight sm:text-5xl md:text-6xl">
            A little more extraordinary.
          </h2>
        </div>
        <Link
          href="/shop?category=bridal-collection"
          aria-label="Explore occasionwear collection"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/70 transition-colors hover:bg-white hover:text-black"
        >
          <ArrowUpRight size={20} />
        </Link>
      </div>
    </section>
  );
}
