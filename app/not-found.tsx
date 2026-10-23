"use client";

import Link from "next/link";
import { ArrowLeft, Home, Search, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-black">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[#F4B223] opacity-15 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#4A230F] opacity-10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(245,200,86,0.25)_1px,rgba(245,200,86,0)_2px)] bg-[size:28px_28px] opacity-40" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#1B2E27]/20 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-black shadow-sm">
          Page not found
        </div>
        <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-black md:text-7xl">
          404
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-black md:text-xl">
          The page you are looking for doesn&apos;t exist or has moved.
          Let&apos;s get you back to something stylish.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-[#1B2E27] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1B2E27]/25 transition-transform hover:scale-105"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-full border border-[#1B2E27]/20 bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:border-[#1B2E27] hover:bg-[#1B2E27]/5"
          >
            <ShoppingBag className="h-4 w-4" />
            Browse Shop
          </Link>
        </div>
        <div className="mt-10 w-full max-w-xl rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black">
            Quick Find
          </p>
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-black">
            <Search className="h-4 w-4 text-black" />
            <span className="text-sm">
              Try our Shop, Blog, or Contact page.
            </span>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm font-semibold">
            <Link
              href="/blog"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-black transition-colors hover:border-[#4A230F] hover:text-black"
            >
              Read the Blog
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-black transition-colors hover:border-[#4A230F] hover:text-black"
            >
              Contact Support
            </Link>
          </div>
        </div>
        <div className="mt-10 flex items-center gap-2 text-sm text-black">
          <ArrowLeft className="h-4 w-4" />
          <span>Use the menu above or return to safety.</span>
        </div>
      </div>
    </div>
  );
}
