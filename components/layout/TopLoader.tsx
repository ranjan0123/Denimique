"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function TopLoader() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const ticking = useRef(false);

  // Reset to the top on every navigation, since the new page starts
  // unscrolled. Adjusting state during render (rather than in an effect)
  // avoids a one-frame flash of the previous page's progress bar width.
  const [trackedPathname, setTrackedPathname] = useState(pathname);
  if (pathname !== trackedPathname) {
    setTrackedPathname(pathname);
    setProgress(0);
  }

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, percent)));
      ticking.current = false;
    };

    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [pathname]);

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] pointer-events-none">
      <div className="absolute inset-0 bg-[#1B2E27]/8" />
      <div
        className="relative h-full bg-gradient-to-r from-[#D4AF37] via-[#1B2E27] to-[#2B1206] transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      >
        {progress > 0 && (
          <div className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-[#D4AF37] shadow-[0_0_10px_3px_rgba(212,175,55,0.85)]" />
        )}
      </div>
    </div>
  );
}
