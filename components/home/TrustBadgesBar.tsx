"use client";

import { motion } from "framer-motion";
import { Truck, RotateCcw, ShieldCheck, Banknote } from "lucide-react";

const badges = [
  {
    icon: Truck,
    title: "Free Shipping",
    desc: "On all prepaid orders across India",
  },
  {
    icon: RotateCcw,
    title: "Easy 7-Day Returns",
    desc: "Hassle-free returns and exchanges",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    desc: "100% safe and encrypted checkout",
  },
  {
    icon: Banknote,
    title: "Cash on Delivery",
    desc: "Available on select pin codes",
  },
];

export default function TrustBadgesBar() {
  return (
    <section className="border-y border-[#191714]/10 bg-white py-7">
      <div className="max-w-7xl mx-auto px-5 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={badge.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                viewport={{ once: true }}
                className="flex items-start gap-3"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center border border-[#92764A]/40 text-black">
                  <Icon size={16} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-black">
                    {badge.title}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-black">{badge.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
