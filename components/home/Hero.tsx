"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { resolveApiAssetUrl } from "@/lib/api";

type DenimiqueHeroProps = {
  initialHero?: unknown;
  initialSliderFallbackImages?: string[];
};

const heroSlides = [
  {
    eyebrow: "THE DENIM EDIT",
    title: "Wide leg. No apologies.",
    image: "/women2.png",
    alt: "Denimique model wearing wide-leg denim jeans with a black crop top",
    tag: "DENIMIQUE / 001",
  },
  {
    eyebrow: "THE NEW COLLECTION",
    title: "Two takes on denim outerwear.",
    image: "/img1-2-hero.png",
    alt: "Two Denimique models wearing denim blazer and jacket looks",
    tag: "DENIMIQUE / 002",
  },
  {
    eyebrow: "WOMEN'S DENIM",
    title: "Black high-waist cargo, styled your way.",
    image: resolveApiAssetUrl("/uploads/products/black-cargo-jeans/01.jpeg"),
    alt: "Denimique women's black high-waist cargo jeans",
    tag: "DENIMIQUE / 003",
  },
];

export default function DenimiqueHero(props: DenimiqueHeroProps) {
  // Kept for compatibility with the existing home-page data contract.
  void props;

  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slide = heroSlides[activeSlide % heroSlides.length];

  useEffect(() => {
    if (isPaused) return;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  return (
    <section
      className="relative isolate min-h-[calc(100svh-5rem)] w-full overflow-hidden bg-[#191714] sm:min-h-[calc(100svh-6rem)]"
      aria-label="Featured Denimique collection"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* =========================================================
          HERO IMAGE SLIDER
          ========================================================= */}

      <AnimatePresence mode="sync">
        <motion.div
          key={activeSlide}
          initial={{
            opacity: 0,
            scale: 1.02,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          exit={{
            opacity: 0,
          }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
          }}
          className="absolute inset-0 z-0"
        >
          {/* 
            IMPORTANT:
            object-contain = complete image remains visible.
            No part of the image will be cropped.
          */}
          <div className="absolute inset-0 flex items-center justify-center bg-[#191714]">
            <img
              src={slide.image}
              alt={slide.alt}
              className="block h-full w-full object-cover object-center"
              fetchPriority="high"
              loading="eager"
              decoding="async"
              onError={(event) => {
                event.currentTarget.src = "/women2.png";
                event.currentTarget.onerror = null;
              }}
            />
          </div>

          {/* 
            Dark gradient overlay for readable text.
            It does NOT affect image dimensions.
          */}
          <div
            className="
              absolute inset-0
              bg-[linear-gradient(90deg,rgba(25,23,20,0.58)_0%,rgba(25,23,20,0.2)_38%,transparent_72%),linear-gradient(0deg,rgba(25,23,20,0.35)_0%,transparent_38%)]
            "
          />
        </motion.div>
      </AnimatePresence>

      {/* =========================================================
          HERO CONTENT
          ========================================================= */}

      <div
        className="
          relative z-10
          flex min-h-[calc(100svh-5rem)]
          flex-col justify-between
          p-4
          sm:min-h-[calc(100svh-6rem)]
          sm:p-8
          md:p-12
          lg:px-20
        "
      >
        {/* =======================================================
            TOP CONTENT
            ======================================================= */}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{
              opacity: 0,
              y: 16,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -10,
            }}
            transition={{
              duration: 0.4,
              ease: "easeOut",
            }}
            className="max-w-[540px]"
          >
            {/* Eyebrow */}
            <span
              className="
                inline-flex
                items-center
                gap-2
                border
                border-white/40
                bg-black/15
                px-3
                py-1.5
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.22em]
                text-white
                backdrop-blur-sm
                sm:text-[10px]
              "
            >
              <Sparkles size={11} />

              {slide.eyebrow}
            </span>

            {/* Title */}
            {slide.title && (
              <h1
                className="
                  font-heading
                  mt-4
                  text-3xl
                  font-medium
                  leading-[1.02]
                  text-white
                  sm:text-5xl
                  md:mt-6
                  md:text-7xl
                "
              >
                {slide.title}
              </h1>
            )}
          </motion.div>
        </AnimatePresence>

        {/* =======================================================
            BOTTOM CONTENT
            ======================================================= */}

        <div>
          <div
            className="
              flex
              flex-wrap
              items-end
              justify-between
              gap-4
            "
          >
            {/* ===================================================
                BUTTONS
                =================================================== */}

            <div
              className="
                flex
                flex-wrap
                items-center
                gap-3
              "
            >
              {/* Shop Collection */}
              <Link
                href="/shop?sort=newest"
                className="
                  inline-flex
                  w-fit
                  items-center
                  gap-3
                  bg-[#191714]
                  px-5
                  py-3
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.15em]
                  text-white
                  transition-colors
                  hover:bg-[#92764A]
                  sm:px-6
                  sm:py-3.5
                  sm:text-xs
                "
              >
                Shop collection
                <ArrowUpRight size={14} />
              </Link>

              {/* Explore All */}
              <Link
                href="/shop"
                className="
                  inline-flex
                  w-fit
                  items-center
                  gap-2
                  border
                  border-white/75
                  bg-white/5
                  px-5
                  py-3
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.15em]
                  text-white
                  backdrop-blur-sm
                  transition-colors
                  hover:bg-white
                  hover:text-[#191714]
                  sm:px-6
                  sm:py-3.5
                  sm:text-xs
                "
              >
                Explore all
              </Link>
            </div>

            {/* ===================================================
                SLIDE TAG
                =================================================== */}

            <AnimatePresence mode="wait">
              <motion.p
                key={activeSlide}
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                transition={{
                  duration: 0.3,
                }}
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.2em]
                  text-white/90
                  sm:text-xs
                  md:text-sm
                "
              >
                {slide.tag}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* =====================================================
              SLIDER DOTS
              ===================================================== */}

          <div
            className="
              mt-3
              flex
              justify-center
              gap-2
              md:mt-6
            "
            aria-label="Hero slide controls"
          >
            {heroSlides.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Show slide ${index + 1}`}
                aria-current={index === activeSlide}
                onClick={() => setActiveSlide(index)}
                className={`
                  h-1
                  transition-all
                  ${
                    index === activeSlide
                      ? "w-8 bg-[#D7C39A]"
                      : "w-1.5 bg-white/55 hover:bg-white"
                  }
                `}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
