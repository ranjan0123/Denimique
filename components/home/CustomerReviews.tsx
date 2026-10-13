"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";

export type GoogleReviewItem = {
  id: string;
  name: string;
  avatarUrl: string | null;
  rating: number;
  text: string;
  publishedAt: string | null;
};

type ReviewCardData = {
  key: string;
  name: string;
  subtitle: string;
  rating: number;
  text: string;
  avatarUrl?: string | null;
  avatarColor?: string;
  badge?: string;
};

function ReviewCard({ review }: { review: ReviewCardData }) {
  return (
    <article className="relative flex h-full flex-col border border-[#191714]/10 bg-white p-6 text-left">
      <Quote className="absolute right-6 top-6 h-9 w-9 text-[#92764A]/15" fill="currentColor" />

      <div className="relative flex items-center gap-3">
        {review.avatarUrl ? (
          <img
            src={review.avatarUrl}
            alt={review.name}
            className="h-11 w-11 shrink-0 border border-[#191714]/10 object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#92764A]/35 text-sm font-semibold text-[#92764A]"
            style={{ backgroundColor: review.avatarColor || "#F1EDE4" }}
          >
            {review.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight text-[#191714]">
            {review.name}
          </p>
          <p className="truncate text-xs text-gray-500">{review.subtitle}</p>
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-2">
        <div className="flex gap-0.5 text-[#92764A]">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={15} fill={i < review.rating ? "currentColor" : "none"} strokeWidth={1.5} />
          ))}
        </div>
        {review.badge && (
          <span className="whitespace-nowrap border border-[#92764A]/35 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#92764A]">
            {review.badge}
          </span>
        )}
      </div>

      <p className="relative mt-4 flex-1 font-heading text-xl leading-relaxed text-[#292722]">
        &quot;{review.text}&quot;
      </p>
    </article>
  );
}

const AUTOPLAY_DELAY_MS = 5000;

export default function CustomerReviews({
  googleReviews = [],
  googleReviewsUrl = null,
}: {
  googleReviews?: GoogleReviewItem[];
  googleReviewsUrl?: string | null;
}) {
  const combined = useMemo<ReviewCardData[]>(
    () =>
      googleReviews.map((r) => ({
        key: `google-${r.id}`,
        name: r.name,
        subtitle: r.publishedAt
          ? new Date(r.publishedAt).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "short",
            })
          : "Google Review",
        rating: r.rating,
        text: r.text,
        avatarUrl: r.avatarUrl,
        badge: "Google",
      })),
    [googleReviews],
  );

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  // Clamp during render (rather than in an effect) if the review list
  // shrinks below the current index.
  if (index >= combined.length && index !== 0) {
    setIndex(0);
  }

  useEffect(() => {
    if (isPaused || combined.length <= 1) return;
    const timer = setTimeout(() => {
      setDirection(1);
      setIndex((prev) => (prev + 1) % combined.length);
    }, AUTOPLAY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [index, isPaused, combined.length]);

  const goTo = (dir: 1 | -1) => {
    setDirection(dir);
    setIndex((prev) => (prev + dir + combined.length) % combined.length);
  };

  const current = combined[index];
  const averageRating =
    googleReviews.length > 0
      ? (
          googleReviews.reduce((total, review) => total + review.rating, 0) /
          googleReviews.length
        ).toFixed(1)
      : null;

  if (combined.length === 0) return null;

  return (
    <section className="overflow-hidden bg-[#F1EDE4] py-16 md:py-24">
      <div className="relative max-w-6xl mx-auto px-5 md:px-6 text-center">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#92764A]"
        >
          Notes from the fitting room
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="mt-4 font-heading text-4xl font-medium text-[#191714] md:text-6xl"
        >
          In their own words.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          viewport={{ once: true }}
          className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#625C51] md:text-base"
        >
          Recent reviews from Denimique customers.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="mt-6 flex flex-wrap justify-center gap-3"
        >
          {averageRating && (
            <span className="inline-flex items-center gap-2 border border-[#92764A]/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#92764A]">
              <Star size={13} fill="currentColor" />
              {averageRating} / 5 · Google reviews
            </span>
          )}
        </motion.div>

        {/* Mobile: one review at a time, with prev/next controls */}
        <div
          className="relative mt-10 md:hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={index}
                initial={{ opacity: 0, x: direction * 48 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -48 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                {current && <ReviewCard review={current} />}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-5 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => goTo(-1)}
              aria-label="Previous review"
              className="flex h-10 w-10 items-center justify-center border border-[#191714]/20 bg-transparent text-[#191714] transition hover:bg-[#191714] hover:text-white"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-1.5">
              {combined.map((review, i) => (
                <span
                  key={review.key}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-5 bg-[#92764A]" : "w-1.5 bg-[#191714]/25"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => goTo(1)}
              aria-label="Next review"
              className="flex h-10 w-10 items-center justify-center border border-[#191714]/20 bg-transparent text-[#191714] transition hover:bg-[#191714] hover:text-white"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Desktop: one unified grid of static + Google reviews */}
        <div className="relative mt-10 hidden gap-6 md:grid md:grid-cols-3">
          {combined.slice(0, 6).map((review, index) => (
            <motion.div
              key={review.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
              viewport={{ once: true, amount: 0.25 }}
            >
              <ReviewCard review={review} />
            </motion.div>
          ))}
        </div>

        {googleReviewsUrl && googleReviews.length > 0 && (
          <div className="mt-10">
            <a
              href={googleReviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-[#191714]/25 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#191714] transition-colors hover:border-[#92764A] hover:text-[#92764A]"
            >
              See All Google Reviews
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
