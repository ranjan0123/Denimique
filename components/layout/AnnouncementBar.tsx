"use client";

export default function AnnouncementBar() {
  const items = [
    {
      text: "Denimique Insider Deals - Fresh drops every week",
    },
    {
      text: "Enjoy free shipping across all orders",
    },
    {
      text: "B2B partnerships for retail chains, distributors, and gifting teams",
    },
    {
      text: "Premium fabrics, timeless craftsmanship, everyday comfort",
    },
    {
      text: "Call for bulk pricing: +91 9625610749",
      href: "tel:+919625610749",
    },
    {
      text: "WhatsApp support for large orders",
      href: "https://wa.me/919625610749",
    },
  ];

  return (
    <div className="relative overflow-hidden border-b border-white/10 bg-[#102B50] text-white">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#102B50] to-transparent"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#102B50] to-transparent"></div>

      {/* ===== Scrolling glow loader ===== */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] overflow-hidden">
        <div className="absolute inset-0 bg-white/10" />
        <div className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#8DA9C9] shadow-[0_0_10px_3px_rgba(141,169,201,0.7)] animate-bulb" />
      </div>

      <div className="relative overflow-x-auto md:overflow-x-hidden">
        <div
          className="flex items-center gap-8 md:gap-16 whitespace-nowrap px-4 py-1.5 text-[12px] font-medium tracking-[0.2px] animate-marquee hover:[animation-play-state:paused] relative z-10"
        >
          {[...items, ...items].map((item, index) => {
            const content = (
              <div className="inline-flex items-center px-2 py-1">
                <span className="mx-2 text-[#8DA9C9]">|</span>
                <span className="text-white">{item.text}</span>
              </div>
            );

            return item.href ? (
              <a
                key={`${item.text}-${index}`}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                className="ml-10 inline-flex transition-colors hover:text-[#B7CCE4]"
              >
                {content}
              </a>
            ) : (
              <div key={`${item.text}-${index}`} className="inline-flex">
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
