"use client";

import Image from "@/components/ui/AppImage";
import { motion } from "framer-motion";
import { useState } from "react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";

const faqs = [
  {
    q: "How soon will I get a response to my enquiry?",
    a: "Our team typically responds within 24 business hours for product, support, and partnership queries.",
  },
  {
    q: "Can I contact Denimique for bulk or distributor enquiries?",
    a: "Yes. Use this contact form or call us directly for bulk supply, distributor onboarding, and corporate gifting requirements.",
  },
  {
    q: "How can I raise an issue with an order?",
    a: "Share your order details in the message box and our support team will help you with replacements, refunds, or delivery concerns.",
  },
] as const;

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.message) {
      toast.error("Please enter your email and message.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/forms/contact", {
        ...formData,
        sourceUrl: typeof window !== "undefined" ? window.location.href : "",
      });
      toast.success("Thanks! We'll get back to you shortly.");
      setFormData({ firstName: "", lastName: "", email: "", message: "" });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to submit the form."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-white text-black overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: { "@type": "Answer", text: faq.a },
            })),
          }),
        }}
      />

      {/* ================= HERO ================= */}
      <section className="relative h-[500px] w-full">
        <Image
          src="/img1.png"
          alt="Denimique Contact Banner"
          fill
          className="object-cover object-[50%_15%] scale-105"
          priority
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent flex items-center">
          <div className="max-w-6xl mx-auto px-6">
            <motion.h1
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-6xl font-bold text-white tracking-wide"
            >
              Let&apos;s Connect
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-white/80 mt-6 max-w-lg text-lg"
            >
              We&apos;d love to hear from you. Whether it&apos;s feedback,
              queries, or partnerships - Denimique is here for you.
            </motion.p>
          </div>
        </div>
      </section>

      {/* ================= CONTACT CARDS ================= */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-10">
        {[
          {
            title: "Address",
            content: (
              <>
                Suitable Vastra <br />
                Delhi, India
                <br />
                110001
              </>
            ),
          },
          {
            title: "Opening Hours",
            content: (
              <>
                Mon-Fri: 08:30 - 20:00 <br />
                Sat-Sun: 10:00 - 18:00
              </>
            ),
          },
          {
            title: "Contact",
            content: (
              <>
                +91 9213970893
                <br />
                Email our team
              </>
            ),
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.2 }}
            viewport={{ once: true }}
            className="backdrop-blur-lg bg-white/70 border border-gray-200 p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
          >
            <h3 className="text-xl font-semibold mb-4 text-black">
              {item.title}
            </h3>
            <p className="text-black leading-relaxed">{item.content}</p>
          </motion.div>
        ))}
      </section>

      {/* ================= FORM + INFO ================= */}

      <section className="bg-gradient-to-br from-[#F8FAFC] to-white py-24">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16">
          {/* FORM */}

          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-black mb-8">
              Send a Message
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="border-b border-gray-400 bg-transparent p-3 focus:outline-none focus:border-[#1B2E27] transition"
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="border-b border-gray-400 bg-transparent p-3 focus:outline-none focus:border-[#1B2E27] transition"
                />
              </div>

              <input
                type="email"
                name="email"
                placeholder="Email Address"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full border-b border-gray-400 bg-transparent p-3 focus:outline-none focus:border-[#1B2E27] transition"
              />

              <textarea
                name="message"
                placeholder="Your Message"
                rows={5}
                required
                value={formData.message}
                onChange={handleChange}
                className="w-full border-b border-gray-400 bg-transparent p-3 focus:outline-none focus:border-[#1B2E27] transition"
              />

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 bg-[#1B2E27] text-white px-10 py-3 hover:bg-[#5A260F] transition-all duration-300 hover:scale-105"
              >
                {submitting ? "Sending..." : "Get in Touch"}
              </button>
            </form>
          </motion.div>

          {/* SUPPORT INFO */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl font-bold text-black mb-6">
              24/7 Customer Support
            </h3>
            <p className="text-black leading-relaxed mb-8">
              We source premium-quality fabrics to ensure exceptional comfort,
              craftsmanship, and finish in every piece. With fast delivery and
              friendly assistance, your Denimique experience is always smooth.
            </p>

            {/* <div className="flex gap-6 text-black font-medium">
              <a href="#" className="hover:underline">Facebook</a>
              <a href="#" className="hover:underline">Instagram</a>
              <a href="#" className="hover:underline">YouTube</a>
            </div> */}
          </motion.div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="max-w-4xl mx-auto px-6 py-24">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-center text-black mb-16"
        >
          Frequently Asked Questions
        </motion.h2>

        <div className="space-y-6">
          {faqs.map((item, i) => (
            <motion.details
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              viewport={{ once: true }}
              className="border border-gray-200 p-6 shadow-sm hover:shadow-md transition"
            >
              <summary className="font-semibold cursor-pointer">
                {item.q}
              </summary>
              <p className="mt-4 text-black">{item.a}</p>
            </motion.details>
          ))}
        </div>
      </section>

      {/* ================= LOCATION MAP ================= */}
      <section className="relative py-12 bg-gradient-to-b from-white to-[#F8FAFC] overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center text-black mb-16"
          >
            Visit Our Location
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200"
          >
            {/* Google Map */}
            <iframe
              src="https://www.google.com/maps?q=Sector+62%2C+Noida%2C+Uttar+Pradesh+201301&output=embed"
              className="w-full h-[500px] md:h-[600px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* Glass Info Card Overlay */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.3 }}
              viewport={{ once: true }}
              className="absolute bottom-8 left-8 bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-xl max-w-sm border border-gray-200"
            >
              <h3 className="text-xl font-bold text-black mb-3">
                Denimique HQ
              </h3>
              <p className="text-black text-sm leading-relaxed">
                Denimique <br />
                H-63, Sector 62 <br />
                Noida, Uttar Pradesh - 201301 <br />
                <br />
                Mon-Fri: 08:30 - 20:00
                <br />
                Sat-Sun: 10:00 - 18:00
              </p>

              {/* <a
                href="https://maps.google.com"
                target="_blank"
                className="inline-block mt-4 text-black font-semibold hover:underline"
                >
                Open in Google Maps &rarr;
                </a> */}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
