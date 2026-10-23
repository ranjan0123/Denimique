"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "@/components/ui/AppImage";
import {
  ArrowUpRight,
  CheckCircle2,
  Droplets,
  Heart,
  Layers,
  Ruler,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
} from "lucide-react";

export interface StyleGuideEditProduct {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  basePrice: number;
  rating?: number;
}

export interface StyleGuideEdit {
  title: string;
  tag: string;
  tips: string[];
  href: string;
  image?: string;
  products: StyleGuideEditProduct[];
}

interface StyleGuideComponentProps {
  edits: StyleGuideEdit[];
}

const quickLinks = [
  { label: "Shop by Category", href: "#category" },
  { label: "Fabric & Care", href: "#care" },
  { label: "Size Guide", href: "#size" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

const fabricCare = [
  {
    icon: Droplets,
    title: "Washing",
    body: "Hand wash lace, satin, and embellished pieces in cold water using a mild detergent. Cotton everyday bras and sleepwear are machine-safe in a lingerie bag on a gentle cycle.",
  },
  {
    icon: Sun,
    title: "Drying",
    body: "Air dry flat or on a flat hanger, away from direct sunlight — heat and sun break down elastic and fade delicate lace and silk faster.",
  },
  {
    icon: Heart,
    title: "Everyday Care",
    body: "Fasten hooks before washing, never wring — squeeze gently instead. Avoid fabric softener on padded and lace pieces; it breaks down the elastic and padding.",
  },
  {
    icon: ShieldCheck,
    title: "Storage",
    body: "Store bras cup-in-cup, never folded flat. Keep shapewear and lace sets in a drawer organiser or pouch to avoid snagging.",
  },
];

const bandSizeGuide = [
  { band: "30", underbust: "26\" - 27\"" },
  { band: "32", underbust: "28\" - 29\"" },
  { band: "34", underbust: "30\" - 31\"" },
  { band: "36", underbust: "32\" - 33\"" },
  { band: "38", underbust: "34\" - 35\"" },
  { band: "40", underbust: "36\" - 37\"" },
];

const cupSizeGuide = [
  { cup: "A", diff: "1\"" },
  { cup: "B", diff: "2\"" },
  { cup: "C", diff: "3\"" },
  { cup: "D", diff: "4\"" },
  { cup: "DD / E", diff: "5\"" },
];

export default function StyleGuideComponent({ edits }: StyleGuideComponentProps) {
  return (
    <div className="bg-white text-black overflow-hidden">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#936965] via-[#5A260F] to-[#1B2E27] px-6 py-24 text-center text-white md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.2),transparent_35%)]" />
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.8 }}
          className="relative z-10 mx-auto max-w-3xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-black backdrop-blur">
            <Sparkles size={14} />
            Style Guide
          </span>
          <h1 className="font-heading mt-6 text-4xl font-bold leading-tight md:text-6xl">
            Fit &amp; Style, <span className="text-black">Your Way</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-white/85 md:text-lg">
            Fit tips, fabric care, and a real size guide — everything you need
            to get the most out of every Denimique piece.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {quickLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur transition hover:border-[#D4AF37]/60 hover:bg-white/15 hover:text-black"
              >
                {link.label}
              </a>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ================= STYLING BY CATEGORY ================= */}
      {edits.length > 0 && (
        <section id="category" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20 md:px-10">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h2 className="font-heading text-3xl font-bold text-black md:text-4xl">
              Shop by Category
            </h2>
            <p className="mt-3 text-black">
              Fit and styling tips for each collection, with real picks from the shop.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {edits.map((edit, index) => (
              <motion.article
                key={edit.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.5, delay: index * 0.06 }}
                className="group flex flex-col overflow-hidden rounded-3xl border border-[#1B2E27]/10 bg-white shadow-[0_14px_34px_rgba(122,53,17,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_46px_rgba(122,53,17,0.16)]"
              >
                {edit.image && (
                  <div className="relative h-56 w-full overflow-hidden">
                    <Image
                      src={edit.image}
                      alt={edit.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-contain bg-[#f9f2eb] transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2B1206]/70 via-transparent to-transparent" />
                    <span className="absolute left-4 top-4 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur">
                      {edit.tag}
                    </span>
                    <h3 className="absolute bottom-4 left-4 right-4 font-heading text-2xl font-bold text-white">
                      {edit.title}
                    </h3>
                  </div>
                )}

                <div className="flex flex-1 flex-col p-6">
                  <ul className="space-y-3">
                    {edit.tips.map((tip) => (
                      <li key={tip} className="flex items-start gap-2.5 text-sm text-black">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-black" />
                        {tip}
                      </li>
                    ))}
                  </ul>

                  {edit.products.length > 0 && (
                    <div className="mt-5 border-t border-[#1B2E27]/10 pt-5">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-black">
                        Shop the Edit
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {edit.products.map((product) => (
                          <Link
                            key={product.id}
                            href={`/products/${product.slug}`}
                            className="group/product overflow-hidden rounded-xl border border-[#f0e4d7] bg-white p-2 transition hover:border-[#D4AF37]/50 hover:shadow-md"
                          >
                            <div className="relative h-24 w-full overflow-hidden rounded-lg bg-white">
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                sizes="140px"
                                className="object-contain transition-transform duration-300 group-hover/product:scale-105"
                              />
                            </div>
                            <p className="mt-2 line-clamp-2 text-[11px] font-medium text-black">
                              {product.name}
                            </p>
                            <div className="mt-1 flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-black">
                                ₹{product.price}
                              </span>
                              {product.rating ? (
                                <span className="flex items-center gap-0.5 text-[10px] text-black">
                                  <Star size={10} className="fill-current" />
                                  {product.rating.toFixed(1)}
                                </span>
                              ) : null}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <Link
                    href={edit.href}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-black transition group-hover:gap-3"
                  >
                    Shop the Edit
                    <ArrowUpRight size={15} />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      )}

      {/* ================= FABRIC & CARE ================= */}
      <section id="care" className="scroll-mt-24 bg-[#1B2E27] px-6 py-20 text-white md:px-10">
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
              Fabric & Care
            </h2>
            <p className="mt-3 text-white/80">
              Keep every piece looking and fitting as good as the day it arrived.
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4">
            {fabricCare.map((item, index) => {
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

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 flex items-start gap-3 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-5"
          >
            <Layers size={20} className="mt-0.5 shrink-0 text-black" />
            <p className="text-sm leading-relaxed text-white/90">
              <span className="font-semibold text-black">Pro tip:</span>{" "}
              Replace bras every 8-12 months of regular wear — stretched
              elastic and worn-out padding are the most common causes of a
              bra suddenly feeling like the &ldquo;wrong size.&rdquo;
            </p>
          </motion.div>
        </div>
      </section>

      {/* ================= SIZE GUIDE ================= */}
      <section id="size" className="mx-auto max-w-4xl scroll-mt-24 px-6 py-20 md:px-10">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#1B2E27]/20 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-black">
            <Ruler size={14} />
            Size Guide
          </span>
          <h2 className="font-heading mt-4 text-3xl font-bold text-black md:text-4xl">
            Find Your Fit
          </h2>
          <p className="mt-3 text-black">
            Measure snugly with a soft tape, in inches. Underbust gives your
            band; the difference between bust and underbust gives your cup.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="overflow-hidden rounded-2xl border border-[#1B2E27]/10 bg-white shadow-[0_14px_34px_rgba(122,53,17,0.08)]"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#FFF8EE] text-black">
                    <th className="px-5 py-3 font-semibold">Band</th>
                    <th className="px-5 py-3 font-semibold">Underbust</th>
                  </tr>
                </thead>
                <tbody>
                  {bandSizeGuide.map((row, index) => (
                    <tr
                      key={row.band}
                      className={`transition-colors hover:bg-[#FFF8EE] ${index % 2 === 0 ? "bg-white" : "bg-white"}`}
                    >
                      <td className="px-5 py-3 font-semibold text-black">{row.band}</td>
                      <td className="px-5 py-3 text-black">{row.underbust}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="overflow-hidden rounded-2xl border border-[#1B2E27]/10 bg-white shadow-[0_14px_34px_rgba(122,53,17,0.08)]"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#FFF8EE] text-black">
                    <th className="px-5 py-3 font-semibold">Cup</th>
                    <th className="px-5 py-3 font-semibold">Bust − Underbust</th>
                  </tr>
                </thead>
                <tbody>
                  {cupSizeGuide.map((row, index) => (
                    <tr
                      key={row.cup}
                      className={`transition-colors hover:bg-[#FFF8EE] ${index % 2 === 0 ? "bg-white" : "bg-white"}`}
                    >
                      <td className="px-5 py-3 font-semibold text-black">{row.cup}</td>
                      <td className="px-5 py-3 text-black">{row.diff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        <p className="mt-4 text-center text-sm text-black">
          Between two bands or cups? We recommend the larger band with a
          smaller cup for all-day comfort.
        </p>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#936965] via-[#5A260F] to-[#1B2E27] px-6 py-20 text-center text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.18),transparent_38%)]" />
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto max-w-2xl"
        >
          <Heart className="mx-auto mb-5 text-black" size={32} />
          <h2 className="font-heading text-3xl font-bold md:text-4xl">
            Ready to Put It Into Practice?
          </h2>
          <p className="mt-4 text-white/85">
            Explore the collection and find pieces that fit your style guide,
            not the other way around.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#2B1206] px-8 py-3.5 font-bold text-white shadow-[0_12px_30px_rgba(43,18,6,0.35)] transition hover:scale-105 hover:bg-[#1C0D05]"
          >
            Explore the Collection
            <ArrowUpRight size={16} />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
