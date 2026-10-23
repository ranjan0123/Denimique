"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const StoreChat = dynamic(() => import("@/components/StoreChat"), {
  ssr: false,
});
const WhatsAppButton = dynamic(() => import("@/components/WhatsAppButton"), {
  ssr: false,
});

export default function DeferredEnhancements() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setEnabled(true);
    }, 2500);

    return () => window.clearTimeout(timerId);
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <StoreChat />
      <WhatsAppButton />
    </>
  );
}
