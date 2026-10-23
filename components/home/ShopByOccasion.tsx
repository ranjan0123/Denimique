"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "@/components/ui/AppImage";
import { ArrowRight, Briefcase, PartyPopper, Shirt, Sparkles } from "lucide-react";

const occasions = [
  {
    icon: PartyPopper,
    title: "Festive & Wedding",
    desc: "Statement pieces for celebrations that matter.",
    href: "/shop?category=bridal-collection",
    image:
      "https://flyadmin.snazzywaydropshipping.com/storage/uploads/2025/7/product/XRDNlWmdGFc9rsbYXkUVFYB9JwJWXwo2vB8aBwFB.png",
    imageAlt: "Festive and bridal fashion collection",
    tint: "from-[#102B50]/90 via-[#102B50]/35",
    bg: "bg-[#EFE7DD]",
  },
  {
    icon: Briefcase,
    title: "Everyday Apparel",
    desc: "Sharp, comfortable fits for day-to-day wear.",
    href: "/shop?category=apparel",
    image:
      "https://flyadmin.snazzywaydropshipping.com/storage/uploads/2025/7/product/wKiwPjaFgACWrC6qlSIHFIfEkSaGdPIW74Ne3Xfs.png",
    imageAlt: "Everyday fashion collection",
    tint: "from-[#1B231D]/90 via-[#1B231D]/35",
    bg: "bg-[#E7E3DD]",
  },
  {
    icon: Shirt,
    title: "Sleepwear & Loungewear",
    desc: "Easy, comfortable fits for relaxed days at home.",
    href: "/shop?category=sleepwear-loungewear",
    image:
      "https://flyadmin.snazzywaydropshipping.com/storage/uploads/2025/7/product/WYsMsS29ojifDX3PsgrPI93QUSrFQC5TBIfOJh4z.jpg",
    imageAlt: "Sleepwear and loungewear collection",
    tint: "from-[#5A4438]/90 via-[#5A4438]/35",
    bg: "bg-[#EAF1EC]",
  },
  {
    icon: Sparkles,
    title: "Fusion & Trending",
    desc: "Modern silhouettes rooted in traditional craft.",
    href: "/shop?category=lingerie-sets",
    image:
      "https://flyadmin.snazzywaydropshipping.com/storage/uploads/2025/8/product/mWRBRYvgOHh0grVcQ9UdOFLMkRii42tuuqQt5Vx2.png",
    imageAlt: "Contemporary lingerie collection",
    tint: "from-[#173F70]/90 via-[#173F70]/35",
    bg: "bg-[#EDE3DC]",
  },
];

export default function ShopByOccasion() {
  return (
    <section className="relative overflow-hidden bg-white py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-5 md:px-6">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#173F70]/20 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-black">
              Dress the Moment
            </span>
            <h2 className="mt-4 text-3xl font-bold text-black md:text-5xl">
              Shop by Occasion
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {occasions.map((occasion, index) => {
            const Icon = occasion.icon;
            return (
              <motion.div
                key={occasion.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                viewport={{ once: true }}
              >
                <Link
                  href={occasion.href}
                  className={`group relative flex h-[300px] flex-col justify-between overflow-hidden rounded-3xl text-white shadow-[0_16px_36px_rgba(16,43,80,0.22)] transition-transform duration-300 hover:-translate-y-1.5 ${occasion.bg}`}
                >
                  <Image
                    src={occasion.image}
                    alt={occasion.imageAlt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-contain object-top transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className={`absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t ${occasion.tint} to-transparent`} />

                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 m-6 backdrop-blur-sm ring-1 ring-white/20">
                    <Icon size={22} />
                  </div>

                  <div className="relative z-10 p-6 pt-0">
                    <h3 className="text-xl font-bold drop-shadow-sm">{occasion.title}</h3>
                    <p className="mt-2 text-sm text-white/85">{occasion.desc}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold border-b border-white/40 pb-1 transition-all duration-300 group-hover:gap-3">
                      Shop Now
                      <ArrowRight size={15} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
