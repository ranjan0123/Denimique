"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-[#E5DED3] bg-[#F5F2EC] text-black">
      {/* ===== Main Content ===== */}
      <div className="relative mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 py-16 sm:grid-cols-2 md:grid-cols-5 md:py-20">
        {/* Brand */}
        <div>
          <div className="mb-6 flex items-center gap-3">
            <Image
              src="/final-logo.png"
              alt="Denimique"
              width={160}
              height={60}
              className="h-14 w-auto object-contain"
            />
            <span className="font-heading text-2xl font-bold tracking-wide">
              Denimique
            </span>
          </div>
          <p className="text-black text-[15px] leading-relaxed">
            Denimique and lifestyle fashion designed for everyday confidence,
            comfort, and personal style.
          </p>
        </div>

        {/* Explore */}

        <div>
          <h3 className="font-heading mb-7 text-sm font-bold uppercase tracking-[0.16em] text-black">
            Shop
          </h3>
          <ul className="space-y-4 text-[15px] text-black">
            {[
              { label: "New Arrivals", href: "/shop?sort=newest" },
              { label: "Best Sellers", href: "/shop?sort=rating" },
              { label: "Women", href: "/shop?gender=women" },
              // { label: "The Denim Edit", href: "/shop?search=denim" },
              // { label: "Bulk Orders", href: "/shop" },
            ].map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="relative after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-[#92764A] transition duration-300 hover:text-black hover:after:w-full after:transition-all after:duration-300"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h3 className="font-heading mb-7 text-sm font-bold uppercase tracking-[0.16em] text-black">
            The House
          </h3>
          <ul className="space-y-4 text-[15px] text-black">
            {[
              { label: "About Us", href: "/about" },
              { label: "Style Guide", href: "/style-guide" },
              { label: "Blog", href: "/blog" },
              { label: "Contact Us", href: "/contact" },
            ].map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="relative after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-[#92764A] transition duration-300 hover:text-black hover:after:w-full after:transition-all after:duration-300"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="font-heading mb-7 text-sm font-bold uppercase tracking-[0.16em] text-black">
            Customer Care
          </h3>
          <ul className="space-y-4 text-[15px] text-black">
            <li>
              <Link href="/shipping-policy" className="hover:text-black">
                Shipping
              </Link>
            </li>
            <li>
              <Link
                href="/refund-and-cancellation-policy"
                className="hover:text-black"
              >
                Returns &amp; exchanges
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-black">
                Help &amp; contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-heading mb-7 text-sm font-bold uppercase tracking-[0.16em] text-black">
            Contact
          </h3>
          <ul className="space-y-4 text-[13px] leading-relaxed text-black">
            <li>
              <a
                href="mailto:care@denimique.com"
                className="hover:text-black"
              >
                care@denimique.com
              </a>
            </li>
            <li>
            <a href="tel:+919625610749" className="hover:text-black">
                +91 9213970893
              </a>
            </li>
            <li>
              Denimique
              <br />
              Delhi, India 110001
            </li>
          </ul>
        </div>
      </div>

      <div className="relative flex max-w-7xl flex-col items-start justify-between gap-3 px-6 py-3 text-sm text-black md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <Link
            href="https://www.facebook.com/profile.php?id=61590298204029"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#211F1B]/20 bg-white/50 text-black transition hover:border-[#92764A] hover:bg-white"
            aria-label="Denimique on Facebook"
          >
            <Facebook className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* ===== Bottom Bar ===== */}
      <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 border-t border-[#211F1B]/15 px-6 py-6 text-[13px] text-black md:flex-row md:items-center">
        <p>&copy; 2026 Denimique. All rights reserved.</p>

        <div className="flex flex-1 flex-wrap items-center gap-x-5 gap-y-2 font-medium text-black md:justify-center">
          <Link
            href="/privacy-policy"
            className="relative after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-[#92764A] transition duration-300 hover:text-black hover:after:w-full after:transition-all after:duration-300"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms-of-service"
            className="relative after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-[#92764A] transition duration-300 hover:text-black hover:after:w-full after:transition-all after:duration-300"
          >
            Terms of Service
          </Link>
          <Link
            href="/refund-and-cancellation-policy"
            className="relative after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-[#92764A] transition duration-300 hover:text-black hover:after:w-full after:transition-all after:duration-300"
          >
            Refund & Cancellation
          </Link>
          <Link
            href="/shipping-policy"
            className="relative after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-[#92764A] transition duration-300 hover:text-black hover:after:w-full after:transition-all after:duration-300"
          >
            Shipping Policy
          </Link>
        </div>

        <p className="font-heading text-base font-semibold italic tracking-wide text-black">
          Denim &amp; Lifestyle Fashion.
        </p>
      </div>
    </footer>
  );
}
