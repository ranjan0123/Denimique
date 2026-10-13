"use client";

import { useEffect, useRef } from "react";

export default function ClickBurst() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current) return;

      const burst = document.createElement("div");
      burst.className = "click-burst";
      burst.style.left = `${event.clientX}px`;
      burst.style.top = `${event.clientY}px`;

      const core = document.createElement("span");
      core.className = "burst-core";
      burst.appendChild(core);

      const particleCount = 22;
      for (let i = 0; i < particleCount; i += 1) {
        const particle = document.createElement("span");
        particle.className = "burst-particle";
        const angle = (360 / particleCount) * i + Math.random() * 12;
        const distance = 80 + Math.random() * 60;
        const hue = 170 + Math.random() * 40;
        particle.style.setProperty("--angle", `${angle}deg`);
        particle.style.setProperty("--distance", `${distance}px`);
        particle.style.setProperty("--hue", `${hue}`);
        burst.appendChild(particle);
      }

      containerRef.current.appendChild(burst);
      window.setTimeout(() => {
        burst.remove();
      }, 900);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return <div ref={containerRef} className="fixed inset-0 z-[9999] pointer-events-none" />;
}
