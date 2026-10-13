import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { resolveApiAssetUrl } from "@/lib/api";

const JEANS_HREF = "/shop?category=apparel&subcategory=jeans";

// Real product photography from the Denimique catalog (not stock images) —
// one photo per tile, pulled from actual jeans listings.
const collections = [
  {
    number: "01",
    title: "New Collection",
    note: "The latest point of view",
    href: "/shop?sort=newest",
    image: "/uploads/products/black-cargo-jeans/01.jpeg",
    imageAlt: "Denimique black high-waist cargo jeans",
    layout: "col-span-2 row-span-2 min-h-[350px] md:min-h-0",
  },
  {
    number: "02",
    title: "Women",
    note: "Everyday, considered",
    href: "/shop?category=apparel&subcategory=tops",
    image:
      "https://flyadmin.snazzywaydropshipping.com/storage/uploads/2025/7/product/wfTAwehUsjTRFOg77Vl0Cwuis0cR3bEqRUmz9tsz.png",
    imageAlt: "Denimique lace top styled with denim jeans",
    layout: "col-span-1 min-h-[260px] md:min-h-0",
  },
  {
    number: "04",
    title: "The Denim Edit",
    note: "Made to live in",
    href: JEANS_HREF,
    image: "/uploads/products/blue-cargo-jeans/01.jpeg",
    imageAlt: "Denimique blue high-waist cargo jeans",
    layout: "col-span-1 min-h-[260px] md:min-h-0",
  },
  {
    number: "05",
    title: "Luxury Essentials",
    note: "The pieces you keep",
    href: "/shop?category=apparel&subcategory=dresses",
    image:
      "https://flyadmin.snazzywaydropshipping.com/storage/uploads/2025/7/product/UY7zWVQ9dk6VwG4RlPz6O0gCECWbi4ugqs09yR72.jpg",
    imageAlt: "Denimique satin dress, styled for everyday elegance",
    layout: "col-span-2 min-h-[260px] md:min-h-0",
  },
];

export function EditorialCollections() {
  return (
    <section
      id="collections"
      className="bg-[#F8F6F1] px-4 py-16 sm:px-6 md:py-24"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-9 flex items-end justify-between gap-6 md:mb-12">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#92764A]">
              The Denimique wardrobe
            </p>
            <h2 className="mt-3 font-heading text-4xl leading-none text-[#191714] sm:text-5xl md:text-6xl">
              Find your point of view.
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden items-center gap-2 border-b border-[#92764A]/60 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#191714] transition-colors hover:text-[#92764A] sm:inline-flex"
          >
            All collections <ArrowUpRight size={15} />
          </Link>
        </div>

        <div className="grid auto-rows-[minmax(0,1fr)] grid-cols-2 gap-3 md:auto-rows-[260px] md:grid-cols-4 md:gap-4">
          {collections.map((collection, index) => (
            <Link
              key={collection.number}
              href={collection.href}
              className={`group relative isolate flex overflow-hidden bg-[#E9E4DA] ${collection.layout}`}
            >
              {collection.image && (
                <Image
                  src={resolveApiAssetUrl(collection.image)}
                  alt={collection.imageAlt}
                  fill
                  sizes="(max-width: 768px) 50vw, 50vw"
                  className="-z-20 object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              )}
              {collection.image ? (
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/65 via-black/0 to-black/5" />
              ) : (
                <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#191714_0%,#28241e_52%,#423a2d_100%)]" />
              )}
              <span className="absolute left-4 top-4 text-[10px] font-medium tracking-[0.2em] text-white/75 md:left-6 md:top-6">
                {String(index + 1).padStart(2, "0")} / {String(collections.length).padStart(2, "0")}
              </span>
              <div className="mt-auto flex w-full items-end justify-between gap-3 p-4 text-white md:p-6">
                <div>
                  <p className="mb-1 text-[9px] uppercase tracking-[0.19em] text-white/75 md:text-[10px]">
                    {collection.note}
                  </p>
                  <h3 className="font-heading text-2xl leading-tight md:text-3xl">
                    {collection.title}
                  </h3>
                </div>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/55 transition-all duration-300 group-hover:border-white group-hover:bg-white group-hover:text-[#191714]">
                  <ArrowUpRight size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BrandStory() {
  return (
    <section className="grid bg-[#F1EDE4] md:min-h-[620px] md:grid-cols-2">
      <div className="relative min-h-[360px] md:min-h-full">
        <Image
          src={resolveApiAssetUrl("/uploads/products/grey-cargo-jeans/01.jpeg")}
          alt="Denimique grey high-waist cargo jeans"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-[52%_15%]"
        />
      </div>
      <div className="flex items-center px-7 py-14 sm:px-12 md:px-16 lg:px-24">
        <div className="max-w-lg">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#92764A]">
            A note on getting dressed
          </p>
          <h2 className="mt-5 font-heading text-4xl leading-[1.08] text-[#191714] sm:text-5xl lg:text-6xl">
            Made for the life you actually live.
          </h2>
          <p className="mt-6 max-w-md text-sm leading-7 text-[#625C51] sm:text-base">
            Denimique brings considered design to everyday dressing: enduring
            silhouettes, expressive details, and pieces that feel unmistakably
            your own.
          </p>
          <Link
            href="/about"
            className="mt-8 inline-flex items-center gap-3 border-b border-[#191714] pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#191714] transition-colors hover:border-[#92764A] hover:text-[#92764A]"
          >
            Discover our story <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function SignatureCampaign() {
  return (
    <section className="relative isolate flex min-h-[440px] items-center overflow-hidden bg-[#DED8CD] md:min-h-[620px]">
      <Image
        src={resolveApiAssetUrl("/uploads/products/black-straight-jeans/01.jpeg")}
        alt="Denimique black high-waist straight jeans"
        fill
        sizes="100vw"
        className="-z-20 object-cover object-[center_15%]"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#F2EEE6]/90 via-[#F2EEE6]/50 to-transparent" />
      <div className="w-full px-6 py-16 sm:px-12 md:px-16 lg:px-24">
        <div className="max-w-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#92764A]">
            Denimique / Signature 01
          </p>
          <h2 className="mt-5 font-heading text-5xl leading-[0.98] text-[#191714] sm:text-6xl md:text-7xl">
            The denim,
            <br />
            reimagined.
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-6 text-[#514C44] sm:text-base">
            A modern uniform, shaped by the way you move.
          </p>
          <Link
            href={JEANS_HREF}
            className="mt-8 inline-flex items-center gap-3 bg-[#191714] px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#92764A]"
          >
            Explore the signature collection <ArrowUpRight size={15} />
          </Link>
        </div>
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
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/70 transition-colors hover:bg-white hover:text-[#191714]"
        >
          <ArrowUpRight size={20} />
        </Link>
      </div>
    </section>
  );
}