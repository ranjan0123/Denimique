"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

type DenimiqueHeroProps = {
  initialHero?: unknown;
  initialSliderFallbackImages?: string[];
};

const heroSlides = [
  {
    image: "/Sunlit Marble Terrace Fashion Editorial.png",
    alt: "Model wearing wide-leg denim in a sunlit marble setting",
    eyebrow: "THE DENIMIQUE EDIT · 01 / 03",
    title: "Denim that\nmoves with you.",
    description:
      "Considered fits, beautiful washes, and the kind of comfort you reach for every day.",
    imagePosition: "68% center",
  },
  {
    image: "/hero2.png",
    alt: "Model in a crisp white shirt and dark wide-leg denim",
    eyebrow: "MADE FOR EVERY DAY · 02 / 03",
    title: "An everyday icon,\nreimagined.",
    description:
      "Meet the pieces that make getting dressed feel effortless, from the first wear on.",
    imagePosition: "center 48%",
  },
  {
    image: "/img1-2-hero.png",
    alt: "Two models showcasing modern denim and tailored layers",
    eyebrow: "A NEW POINT OF VIEW · 03 / 03",
    title: "A little more\nyou, every day.",
    description:
      "Modern essentials with a confident point of view. Find your new favorites in the edit.",
    imagePosition: "center 42%",
  },
];

export default function DenimiqueHero(props: DenimiqueHeroProps) {
  // Keep compatibility with the existing home-page data contract.
  void props;

  const [activeSlide, setActiveSlide] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  const showSlide = (index: number) => {
    setActiveSlide((index + heroSlides.length) % heroSlides.length);
  };

  useEffect(() => {
    if (prefersReducedMotion) return;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [prefersReducedMotion]);

  const slide = heroSlides[activeSlide];

  return (
    <section
      className="relative isolate w-full overflow-hidden bg-[#f4f1eb] text-black"
      aria-label="Denimique featured collection"
      aria-roledescription="carousel"
    >
      <div className="relative h-[clamp(350px,56svh,620px)] w-full overflow-hidden md:absolute md:inset-0 md:h-full">
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 1.015 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              priority={activeSlide === 0}
              sizes="100vw"
              quality={85}
              className="object-cover"
              style={{ objectPosition: slide.imagePosition }}
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent md:hidden" />
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[64%] bg-gradient-to-r from-[#f7f4ed]/90 via-[#f7f4ed]/65 to-transparent md:block" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[300px] max-w-[1440px] items-center px-6 pb-24 pt-9 sm:px-10 md:min-h-[min(760px,calc(100svh-5rem))] md:px-[8vw] md:py-20">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -6 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.45, ease: "easeOut" }}
            className={`w-full max-w-[520px] ${activeSlide === 0 ? "md:mr-auto" : "md:ml-auto"}`}
            aria-live="polite"
          >
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-black sm:mb-5 sm:text-xs">
              {slide.eyebrow}
            </p>
            <h1 className="whitespace-pre-line font-heading text-[clamp(2.5rem,7vw,5.6rem)] leading-[0.98] tracking-[-0.045em] text-black md:text-[clamp(3.5rem,5.5vw,5.25rem)]">
              {slide.title}
            </h1>
            <p className="mt-4 max-w-[390px] text-sm leading-6 text-black sm:mt-6 sm:text-base sm:leading-7">
              {slide.description}
            </p>
            <a
              href="/shop"
              className="group mt-6 inline-flex min-h-12 items-center justify-center gap-3 bg-[#211f1b] px-6 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#493c30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#70583d] sm:mt-8"
            >
              Explore the collection
              <ArrowRight
                size={16}
                strokeWidth={1.7}
                className="transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </a>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-5 right-5 z-20 flex items-center gap-1.5 border border-white/60 bg-[#f7f4ed]/90 p-1 shadow-[0_8px_24px_rgba(33,31,27,0.12)] backdrop-blur sm:bottom-7 sm:right-8 md:right-[8vw]">
        <button
          type="button"
          aria-label="Previous hero image"
          onClick={() => showSlide(activeSlide - 1)}
          className="grid size-9 place-items-center text-black transition-colors hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#70583d]"
        >
          <ChevronLeft size={18} strokeWidth={1.6} aria-hidden="true" />
        </button>

        <div className="flex items-center gap-1.5 px-1" aria-label="Hero image pagination">
          {heroSlides.map((item, index) => (
            <button
              key={item.image}
              type="button"
              aria-label={`Show hero image ${index + 1}`}
              aria-current={index === activeSlide ? "true" : undefined}
              onClick={() => showSlide(index)}
              className={`h-1 transition-all duration-300 ${
                index === activeSlide
                  ? "w-7 bg-[#70583d]"
                  : "w-1.5 bg-[#211f1b]/30 hover:bg-[#211f1b]/60"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Next hero image"
          onClick={() => showSlide(activeSlide + 1)}
          className="grid size-9 place-items-center text-black transition-colors hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#70583d]"
        >
          <ChevronRight size={18} strokeWidth={1.6} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
