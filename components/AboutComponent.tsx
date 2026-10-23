"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "@/components/ui/AppImage";
import {
  ArrowUpRight,
  Gift,
  Heart,
  PackageCheck,
  Ruler,
  Sparkles,
  Users,
} from "lucide-react";

export interface AboutCollection {
  name: string;
  slug: string;
  count: number;
  image: string;
}

interface AboutComponentProps {
  totalProducts: number;
  totalCollections: number;
  collections: AboutCollection[];
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

const values = [
  {
    icon: Ruler,
    title: "Fit Comes First",
    body: "Thoughtful cuts and considered sizing make it easier to find pieces that feel right from the first wear.",
  },
  {
    icon: Heart,
    title: "Made for Every Day",
    body: "Easy-to-wear essentials and versatile layers bring comfort and confidence to your everyday wardrobe.",
  },
  {
    icon: Users,
    title: "Personal Style, Always",
    body: "From classic denim to standout pieces, our collections leave room for you to make every look your own.",
  },
  {
    icon: Gift,
    title: "Quality That Lasts",
    body: "We focus on considered details and dependable pieces you will keep reaching for season after season.",
  },
];

export default function AboutComponent({
  totalProducts,
  totalCollections,
  collections,
}: AboutComponentProps) {
  const stats = [
    { value: totalProducts > 0 ? `${totalProducts}+` : "500+", label: "Styles in the Catalog" },
    { value: totalCollections > 0 ? `${totalCollections}` : "6", label: "Curated Categories" },
    { value: "7-Day", label: "Easy Returns" },
    { value: "COD", label: "Available Pan-India" },
  ];

  return (
    <div className="overflow-hidden bg-white text-black">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-[#102B50] px-6 py-24 text-center text-white md:py-32">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.8 }}
          className="relative z-10 mx-auto max-w-3xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-black backdrop-blur">
            <Sparkles size={14} />
            About Us
          </span>
          <h1 className="font-heading mt-6 text-4xl font-bold leading-tight md:text-6xl">
            Denimique <span className="text-black">Every Day</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-white/85 md:text-lg">
            Contemporary denim and lifestyle fashion, thoughtfully chosen for
            the way you live, move, and make your own style.
          </p>
        </motion.div>
      </section>

      {/* ================= STATS STRIP ================= */}
      <section className="mx-auto max-w-6xl px-6 py-14 md:px-10">
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: index * 0.06 }}
              className="rounded-2xl border border-[#102B50]/10 bg-white p-6 text-center shadow-[0_10px_28px_rgba(16,43,80,0.06)]"
            >
              <p className="font-heading text-3xl font-bold text-black md:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-black">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= OUR STORY ================= */}
      <section className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-16">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#102B50]/20 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-black">
              Our Story
            </span>
            <h2 className="font-heading mt-4 text-3xl font-bold text-black md:text-4xl">
              Everyday style, made your own
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-black">
              Denimique is built around a simple idea: getting dressed should
              feel effortless and personal. We bring together modern denim,
              versatile essentials, and statement pieces that work beyond a
              single season.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-black">
              Explore the catalog by category, find new favorites, and build a
              wardrobe that feels like you. Each collection is selected to
              balance comfort, quality, and an easy sense of style.
            </p>
            <Link
              href="/style-guide"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-black transition hover:gap-3"
            >
              Read our Fit &amp; Style Guide
              <ArrowUpRight size={15} />
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-2 gap-4"
          >
            {collections.slice(0, 4).map((collection) => (
              <Link
                key={collection.slug}
                href={`/shop?category=${collection.slug}`}
                className="group relative h-40 overflow-hidden rounded-2xl bg-[#F1F4F8] shadow-[0_10px_28px_rgba(16,43,80,0.08)] sm:h-48"
              >
                <Image
                  src={collection.image}
                  alt={collection.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-contain transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#2B1206]/75 to-transparent px-3 py-2">
                  <p className="truncate text-xs font-semibold text-white">
                    {collection.name}
                  </p>
                </div>
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================= VALUES ================= */}
      <section className="bg-[#102B50] px-6 py-20 text-white md:px-10">
        <div className="mx-auto max-w-6xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h2 className="font-heading text-3xl font-bold md:text-4xl">
              What We Stand For
            </h2>
            <p className="mt-3 text-white/80">
              The principles behind every collection we design.
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4">
            {values.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: index * 0.06 }}
                  className="rounded-2xl border border-white/15 bg-white/5 p-5 transition-colors duration-300 hover:bg-white/10"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-black">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-4 font-heading text-lg font-bold">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/80">
                    {item.body}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= COLLECTIONS PREVIEW ================= */}
      {collections.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-20 md:px-10">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h2 className="font-heading text-3xl font-bold text-black md:text-4xl">
              Explore Our Collections
            </h2>
            <p className="mt-3 text-black">
              Real styles from the shop, grouped the way you actually shop.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-6">
            {collections.map((collection, index) => (
              <motion.div
                key={collection.slug}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Link
                  href={`/shop?category=${collection.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-[#102B50]/10 bg-white p-2 shadow-[0_10px_24px_rgba(16,43,80,0.06)] transition hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(16,43,80,0.12)]"
                >
                  <div className="relative h-28 w-full overflow-hidden rounded-xl bg-[#F1F4F8] sm:h-32">
                    <Image
                      src={collection.image}
                      alt={collection.name}
                      fill
                      sizes="160px"
                      className="object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-2 truncate px-1 text-xs font-semibold text-black">
                    {collection.name}
                  </p>
                  <p className="px-1 pb-1 text-[11px] text-black">
                    {collection.count} styles
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ================= FINAL CTA ================= */}
      <section className="relative overflow-hidden bg-[#102B50] px-6 py-20 text-center text-white">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto max-w-2xl"
        >
          <PackageCheck className="mx-auto mb-5 text-black" size={32} />
          <h2 className="font-heading text-3xl font-bold md:text-4xl">
            Find Your Everyday Style
          </h2>
          <p className="mt-4 text-white/85">
            Explore our full range of denim, everyday essentials, and lifestyle
            pieces.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 font-bold text-black shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition hover:scale-105 hover:bg-[#F1F4F8]"
            >
              Explore the Collection
              <ArrowUpRight size={16} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-8 py-3.5 font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Contact Us
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
