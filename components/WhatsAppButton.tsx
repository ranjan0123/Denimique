"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const WHATSAPP_NUMBER = "919625610749";
// Matches the scrollY threshold ProductClient uses to show its desktop StickyBar.
const STICKY_BAR_SCROLL_THRESHOLD = 500;

export default function WhatsAppButton() {
  const pathname = usePathname();
  const isProductPage = pathname?.startsWith("/products/") ?? false;
  const [desktopBarVisible, setDesktopBarVisible] = useState(false);

  useEffect(() => {
    // bottomClass below ignores desktopBarVisible whenever !isProductPage,
    // so no reset is needed here — just skip attaching the listener.
    if (!isProductPage) {
      return;
    }

    const handleScroll = () =>
      setDesktopBarVisible(window.scrollY > STICKY_BAR_SCROLL_THRESHOLD);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isProductPage]);

  // MobileStickyBar is always on screen on product pages, so stay lifted there.
  // The desktop StickyBar only appears after scrolling, so only lift for it then.
  const bottomClass = isProductPage
    ? desktopBarVisible
      ? "bottom-24 md:bottom-36"
      : "bottom-24 md:bottom-6"
    : "bottom-6";

  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className={`fixed right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform duration-300 hover:scale-110 ${bottomClass}`}
    >
      <svg
        viewBox="0 0 32 32"
        className="h-8 w-8 fill-white"
        aria-hidden="true"
      >
        <path d="M16.004 3C9.376 3 4 8.373 4 15c0 2.34.65 4.527 1.78 6.394L4 29l7.84-1.74A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3zm0 21.6c-1.96 0-3.79-.55-5.35-1.5l-.384-.228-4.65 1.032 1.05-4.53-.25-.39A9.56 9.56 0 0 1 5.4 15c0-5.85 4.756-10.6 10.604-10.6S26.6 9.15 26.6 15 21.852 24.6 16.004 24.6zm5.84-7.94c-.32-.16-1.89-.93-2.183-1.04-.293-.107-.507-.16-.72.16-.213.32-.827 1.04-1.014 1.254-.187.213-.373.24-.693.08-.32-.16-1.35-.498-2.572-1.59-.95-.847-1.592-1.893-1.78-2.213-.187-.32-.02-.493.14-.652.144-.144.32-.373.48-.56.16-.187.213-.32.32-.534.107-.213.053-.4-.027-.56-.08-.16-.72-1.733-.987-2.373-.26-.624-.524-.54-.72-.55-.187-.01-.4-.012-.613-.012-.213 0-.56.08-.853.4-.293.32-1.12 1.094-1.12 2.667s1.146 3.094 1.306 3.307c.16.213 2.255 3.444 5.464 4.83.764.33 1.36.527 1.825.674.766.244 1.464.21 2.016.127.615-.092 1.89-.773 2.157-1.52.267-.747.267-1.387.187-1.52-.08-.134-.293-.214-.613-.374z" />
      </svg>
    </a>
  );
}
