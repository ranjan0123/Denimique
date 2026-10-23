"use client";

import { useEffect } from "react";
import Script from "next/script";

export default function MbgChat() {
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.ktt10) {
        window.ktt10.setup({
          id: "Ltdr8d8cHRJMgAVjZ",
          accountId: "1798182",
          color: "#1B2E27",
        });
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, []);


  return (
    <Script
      src="https://app.mbgcart.com/webchat/plugin.js?v=6"
      strategy="afterInteractive"
    />
  );
}