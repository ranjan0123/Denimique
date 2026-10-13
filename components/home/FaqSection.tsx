"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What makes Denimique fashion feel different?",
    answer:
      "We handpick premium, breathable fabrics and pair them with careful stitching and finishing, so every piece feels as good as it looks — built for comfort, not just style.",
  },
  {
    question: "How do I choose the right size?",
    answer:
      "Each product page includes a detailed size chart with measurements. If you're between sizes or unsure, reach out to our team and we'll help you pick the perfect fit.",
  },
  {
    question: "Do you offer bulk or custom orders?",
    answer:
      "Yes, we offer bulk pricing for weddings, events, and corporate orders. Visit our Bulk Enquiry page to share your requirements and get a custom quote.",
  },
  {
    question: "Can I wear Denimique styles every day?",
    answer:
      "Absolutely. Our collections span everyday essentials to festive and occasion wear, so you'll find pieces for daily comfort as well as standout moments.",
  },
  {
    question: "How should I care for my Denimique clothes?",
    answer:
      "Care instructions are listed on each product page and the garment label. In general, we recommend gentle washing and air drying to preserve fabric quality and color.",
  },
  {
    question: "How fast does Denimique deliver orders?",
    answer:
      "Most orders are processed quickly and delivered as per your location. For exact timelines and large-order dispatch support, contact our team.",
  },
  {
    question: "What is your return and exchange policy?",
    answer:
      "We offer easy returns and exchanges within the window listed on our Refund & Cancellation Policy page, as long as the item is unused and in its original condition.",
  },
];

export default function FaqSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <section className="relative py-16 md:py-20 bg-[#F5F7FA] overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-24 top-12 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(23,63,112,0.18),transparent_65%)] animate-[featured-glow_12s_ease-in-out_infinite]" />
        <div className="absolute right-[-120px] bottom-0 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(245,200,86,0.26),transparent_70%)] animate-[featured-glow_14s_ease-in-out_infinite]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-5 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#173F70]/20 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#173F70]">
            Got Questions?
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold text-[#102B50]">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-gray-600 max-w-xl mx-auto">
            Quick answers about sizing, fabric, delivery, and more.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="mt-10 space-y-3"
        >
          {faqs.map((faq, index) => (
            <div key={index} className="rounded-xl overflow-hidden">
              <button
                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                className={`w-full flex justify-between items-center px-5 py-4 text-left font-semibold transition-colors border ${
                  activeIndex === index
                    ? "bg-[#EFF4F9] text-[#102B50] border-[#173F70]"
                    : "bg-white text-[#102B50] border-[#173F70]/15 hover:bg-[#EFF4F9]"
                }`}
              >
                {faq.question}
                <ChevronDown
                  className={`shrink-0 ml-4 transition-transform duration-300 ${
                    activeIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-5 pb-4 pt-3 bg-[#EFF4F9] text-[#102B50] border border-t-0 border-[#173F70]/15"
                  >
                    {faq.answer}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
