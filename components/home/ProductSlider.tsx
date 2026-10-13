"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "@/components/ui/AppImage";
import { getProductPrimaryImage, getProducts } from "@/lib/storefront";

interface ProductSliderProps {
  images?: string[];
  fallbackImages?: string[];
}

export default function ProductSlider({ images, fallbackImages = [] }: ProductSliderProps) {
  const [index, setIndex] = useState(0);
  const [fallbackProducts, setFallbackProducts] = useState<string[]>(fallbackImages);

  useEffect(() => {
    if (images && images.length > 0) return;

    if (fallbackImages.length > 0) {
      return;
    }

    const loadProducts = async () => {
      try {
        const data = await getProducts({ limit: 1000 });
        setFallbackProducts(
          data.map(getProductPrimaryImage).filter(Boolean).slice(0, 5),
        );
      } catch (error) {
        console.error("Failed to load hero products:", error);
      }
    };

    loadProducts();
  }, [fallbackImages.length, images]);

  const displayImages =
    images && images.length > 0 ? images : fallbackProducts;

  useEffect(() => {
    if (displayImages.length === 0) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % displayImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [displayImages.length]);

  if (displayImages.length === 0) {
    return (
      <div className="relative w-full md:w-[620px] lg:w-[660px] h-[580px] flex items-center justify-center overflow-hidden md:justify-self-end">
        <div className="absolute w-[320px] h-[320px] md:w-[520px] md:h-[520px] bg-[#55779E] opacity-20 blur-3xl rounded-full"></div>
        <div className="relative w-[300px] h-[420px] bg-white/60 rounded-[40px] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative w-full md:w-[620px] lg:w-[660px] h-[580px] flex items-center justify-center perspective overflow-hidden md:justify-self-end">
      <div className="absolute w-[320px] h-[320px] md:w-[520px] md:h-[520px] bg-[#55779E] opacity-20 blur-1.5xl rounded-full"></div>

      <div className="relative w-full max-w-[700px] h-[540px] flex items-center justify-center">
        {displayImages.map((product, i) => {
          const normalizedIndex = index % displayImages.length;
          const position =
            (i - normalizedIndex + displayImages.length) % displayImages.length;

          let x = 0;
          let scale = 1;
          let rotateY = 0;
          let opacity = 1;
          let zIndex = 20;

          if (position === 0) {
            x = 0;
            scale = 1;
            rotateY = 0;
            opacity = 1;
            zIndex = 30;
          } else if (position === 1) {
            x = 220;
            scale = 0.8;
            rotateY = -35;
            opacity = 0.9;
            zIndex = 20;
          } else if (position === displayImages.length - 1) {
            x = -220;
            scale = 0.8;
            rotateY = 35;
            opacity = 0.9;
            zIndex = 20;
          } else {
            opacity = 0;
            scale = 0.6;
          }

          return (
            <motion.div
              key={`${product}-${i}`}
              animate={{
                x,
                scale,
                rotateY,
                opacity,
              }}
              transition={{
                duration: 0.9,
                ease: "easeInOut",
              }}
              className="absolute"
              style={{
                zIndex,
                transformStyle: "preserve-3d",
              }}
            >
              <Image
                src={product}
                alt="Denimique Product"
                width={390}
                height={520}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}






