"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { Check, Copy, Printer } from "lucide-react";

export default function PolicyActions() {
  const [copied, setCopied] = useState(false);

  const handlePrint = useCallback(() => {
    if (typeof window === "undefined") return;
    window.print();
  }, []);

  const handleCopy = useCallback(async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error("Could not copy link");
    }
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition"
        aria-label="Copy page link"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-emerald-600" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy link
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition"
        aria-label="Print this page"
      >
        <Printer className="h-4 w-4" />
        Print
      </button>
    </div>
  );
}

