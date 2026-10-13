"use client";

import { motion } from "framer-motion";
import { Leaf, ShieldCheck, Truck, Heart } from "lucide-react";

const features = [
  {
    icon: Leaf,
    title: "100% Quality Fabrics",
    desc: "Made with carefully selected fabrics. No compromise on comfort or durability.",
  },
  {
    icon: ShieldCheck,
    title: "Certified Craftsmanship",
    desc: "Produced in certified facilities with strict quality and finishing standards.",
  },
  {
    icon: Truck,
    title: "Fast & Safe Delivery",
    desc: "Fresh styles delivered quickly in secure packaging across India.",
  },
  {
    icon: Heart,
    title: "Loved by Thousands",
    desc: "Trusted by 10,000+ happy customers who shop smart every day.",
  },
];

export default function WhyChooseDenimique() {
  return (
    <section className="relative overflow-hidden bg-white py-24 md:py-28">
      <div className="max-w-7xl mx-auto px-6">
        {/* Heading */}
        <div className="text-center mb-20">
          <span className="text-[#55779E] font-semibold uppercase tracking-widest text-sm">
            Why Choose Denimique
          </span>

          <h2 className="text-4xl md:text-5xl font-bold text-[#102B50] mt-4 leading-tight">
            Style Made Smarter,
            <br className="hidden md:block" />
            Comfortable & Timeless
          </h2>

          <p className="text-gray-500 mt-6 max-w-2xl mx-auto">
            We combine craftsmanship, comfort, and premium fabrics to give you
            effortless style with complete confidence.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          {features.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="group relative p-8 bg-white shadow-[0_12px_30px_rgba(23,63,112,0.06)] border border-[#173F70]/10 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_18px_38px_rgba(23,63,112,0.12)]"
              >
                {/* Glow border */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#55779E] transition-all duration-500"></div>

                {/* Icon */}
                <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-[#F4E5D6] to-[#B69A86] text-[#55779E] mb-6 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <Icon size={28} />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-[#102B50] mb-4">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}







