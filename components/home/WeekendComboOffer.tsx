"use client";

import { motion } from "framer-motion";
import Image from "@/components/ui/AppImage";
import { useEffect, useState } from "react";
import api, { resolveApiAssetUrl } from "@/lib/api";

export interface WeekendCombo {
  _id: string;
  badgeText: string;
  title: string;
  highlightText: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  stockNote: string;
  image: string;
  isEnabled: boolean;
  displayDuration: {
    startDate: string;
    endDate: string;
  };
}

const getTimeLeft = (endDate: string) => {
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const diff = Math.max(0, end - now);
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds, isExpired: diff <= 0 };
};

interface WeekendComboOfferProps {
  initialCombo?: WeekendCombo | null;
}

export default function WeekendComboOffer({
  initialCombo,
}: WeekendComboOfferProps) {
  const [combo, setCombo] = useState<WeekendCombo | null>(initialCombo ?? null);
  const [timeLeft, setTimeLeft] = useState(() =>
    getTimeLeft(initialCombo?.displayDuration?.endDate || new Date().toISOString()),
  );
  const [loading, setLoading] = useState(initialCombo === undefined);

  useEffect(() => {
    if (initialCombo !== undefined) {
      return;
    }

    let isMounted = true;

    const loadCombo = async () => {
      try {
        const response = await api.get("/weekend-combo");
        if (!isMounted) return;
        setCombo(response.data);
        setTimeLeft(getTimeLeft(response.data.displayDuration.endDate));
      } catch (error) {
        if (!isMounted) return;
        setCombo(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadCombo();

    return () => {
      isMounted = false;
    };
  }, [initialCombo]);

  useEffect(() => {
    if (!combo?.displayDuration?.endDate) return;

    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(combo.displayDuration.endDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [combo?.displayDuration?.endDate]);

  if (loading && !combo) {
    return null;
  }

  if (!combo || timeLeft.isExpired) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-white py-16 md:py-20 text-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(23,63,112,0.06),transparent_55%)]" />
      {/* <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 bottom-0 w-[35%] -translate-x-full animate-[header-shine_6s_ease-in-out_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.35),rgba(255,255,255,0.6),rgba(255,255,255,0.35),transparent)] blur-[2px]" />
      </div> */}

      <div className="relative max-w-7xl mx-auto px-5 md:px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#173F70]/15 bg-[#EFF4F9] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black">
            {combo.badgeText}
          </span>

          <h2 className="mt-6 text-4xl md:text-6xl font-bold leading-tight text-black">
            {combo.title}
            <span className="text-black"> {combo.highlightText}</span>
          </h2>

          <p className="mt-6 text-base md:text-lg text-black max-w-xl">
            {combo.description}
          </p>

          <motion.div
            className="mt-8 flex flex-wrap gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            transition={{ staggerChildren: 0.08 }}
          >
            {[
              { key: "hours", value: timeLeft.hours },
              { key: "minutes", value: timeLeft.minutes },
              { key: "seconds", value: timeLeft.seconds },
            ].map((item) => (
              <motion.div
                key={item.key}
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                className="flex min-w-[92px] flex-col items-center rounded-2xl border border-[#173F70]/15 bg-[#EFF4F9] px-5 py-4 shadow-sm"
              >
                <span className="text-3xl font-bold text-black">
                  {String(item.value).padStart(2, "0")}
                </span>
                <span className="text-xs uppercase tracking-wide text-black">
                  {item.key}
                </span>
              </motion.div>
            ))}
          </motion.div>

          <motion.a
            href={combo.ctaHref}
            whileHover={{ y: -2 }}
            className="mt-10 inline-flex rounded-full bg-[#173F70] px-10 py-4 font-bold text-white shadow-lg transition-all duration-300 hover:bg-[#081E3A] hover:shadow-xl"
          >
            {combo.ctaLabel}
          </motion.a>

          <p className="mt-4 text-sm text-black">
            {combo.stockNote || "Limited time offer"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative flex justify-center"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="relative"
          >
            <div className="absolute -inset-6 rounded-[32px] bg-white/10 blur-2xl" />
            <Image
              src={combo.image ? resolveApiAssetUrl(combo.image) : "/images/combo.png"}
              alt={combo.title}
              width={460}
              height={460}
              className="drop-shadow-[0_30px_60px_rgba(0,0,0,0.35)]"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}



