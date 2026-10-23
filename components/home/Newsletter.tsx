"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/forms/newsletter", {
        email,
        sourceUrl: typeof window !== "undefined" ? window.location.href : "",
      });
      toast.success("You're subscribed! Watch your inbox for 10% off.");
      setEmail("");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to subscribe."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="border-t border-black/10 bg-white py-16 text-black md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="relative mx-auto max-w-3xl px-5 text-center md:px-6"
      >
        <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-black">
          <Mail size={13} strokeWidth={1.5} />
          The Denimique letter
        </span>
        <h2 className="mt-5 font-heading text-4xl font-medium leading-tight text-black sm:text-5xl md:text-6xl">
          Join the world of Denimique.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-black/65 sm:text-base">
          A considered note on new collections, personal style, and the details
          worth keeping.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-9 flex max-w-xl flex-col gap-3 sm:flex-row"
        >
          <input
            type="email"
            name="email"
            required
            aria-label="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
            disabled={isSubmitting}
            className="w-full flex-1 border border-black/20 bg-white px-5 py-3.5 text-sm text-black placeholder-black/40 outline-none transition focus:border-[#6E5A3D] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 bg-[#6E5A3D] px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#4F3F2E] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Subscribing..." : "Subscribe"}
            <Send size={14} />
          </button>
        </form>

        <p className="mt-4 text-[11px] text-black/45">No noise. Unsubscribe anytime.</p>
      </motion.div>
    </section>
  );
}
