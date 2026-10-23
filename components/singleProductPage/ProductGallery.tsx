"use client";

import Image from "@/components/ui/AppImage";
import { motion, AnimatePresence } from "framer-motion";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { X, ZoomIn } from "lucide-react";
import { createPortal } from "react-dom";

interface ProductGalleryProps {
  images: string[];
  selectedImage: string;
  setSelectedImage: Dispatch<SetStateAction<string>>;
}

export default function ProductGallery({
  images,
  selectedImage,
  setSelectedImage,
}: ProductGalleryProps) {
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Classic hydration-safe "client mounted" flag, used below to defer
    // the createPortal zoom modal until after hydration — there is no
    // render-phase way to detect this.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-[30px] border border-[#f0e2d3] bg-[linear-gradient(135deg,#fffaf4_0%,#f7f1ea_100%)] p-3 shadow-[0_20px_40px_rgba(82,53,32,0.08)] md:p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(122,53,17,0.08),transparent_45%)]" />

        <button
          type="button"
          onClick={() => setIsZoomOpen(true)}
          className="absolute right-5 top-5 z-20 inline-flex items-center gap-2 rounded-full border border-[#1B2E27]/10 bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-black shadow-md backdrop-blur-sm transition hover:bg-white"
          aria-label="Zoom product image"
        >
          <ZoomIn size={12} />
          Zoom
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedImage}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35 }}
            className="relative z-10 overflow-hidden rounded-[24px] bg-white"
          >
            <div className="aspect-[4/5] w-full overflow-hidden">
              <Image
                src={selectedImage}
                alt="Denimique Product"
                width={560}
                height={700}
                priority
                className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {isZoomOpen && (
              <motion.div
                className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => setIsZoomOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(false)}
                  className="absolute right-4 top-4 z-[10000] inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-[#1B2E27]/10 text-black hover:bg-[#FFF7EA]"
                  aria-label="Close zoomed image"
                >
                  <X size={20} />
                </button>
                <motion.div
                  className="relative w-full max-w-5xl bg-white rounded-3xl p-4 md:p-6 shadow-2xl max-h-[85vh]"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative w-full h-[75vh]">
                    <Image
                      src={selectedImage}
                      alt="Denimique Product Zoomed"
                      fill
                      sizes="(max-width: 768px) 90vw, 70vw"
                      className="object-contain"
                      priority
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      <div className="mt-5 flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {images.map((img, i) => {
          const isActive = selectedImage === img;

          return (
            <motion.button
              key={i}
              onClick={() => setSelectedImage(img)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative h-[86px] w-[86px] shrink-0 overflow-hidden rounded-[18px] border transition-all duration-300 ${
                isActive
                  ? "border-[#1B2E27] shadow-[0_10px_22px_rgba(122,53,17,0.18)]"
                  : "border-[#efdccc] hover:border-[#1B2E27]/40"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeRing"
                  className="absolute inset-0 rounded-[18px] border-2 border-[#1B2E27]"
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                />
              )}

              <Image
                src={img}
                alt={`Thumbnail ${i + 1}`}
                fill
                sizes="86px"
                className="object-contain"
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}


