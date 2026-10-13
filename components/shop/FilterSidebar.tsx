"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";

export interface FilterOption {
  name: string;
  slug?: string;
  count: number;
}

export interface PriceBucket {
  key: string;
  label: string;
}

export const PRICE_BUCKETS: PriceBucket[] = [
  { key: "0-999", label: "Under ₹999" },
  { key: "999-1999", label: "₹999 - ₹1,999" },
  { key: "1999-2999", label: "₹1,999 - ₹2,999" },
  { key: "2999-4999", label: "₹2,999 - ₹4,999" },
  { key: "4999-", label: "₹4,999 & above" },
];

// A best-effort name → hex map so common color names render as real
// swatches; anything unrecognized falls back to a labeled chip instead.
const COLOR_HEX: Record<string, string> = {
  black: "#111827",
  white: "#ffffff",
  ivory: "#fffff0",
  cream: "#fdf6e3",
  beige: "#e8dcc8",
  brown: "#7a3511",
  tan: "#d2b48c",
  maroon: "#7a1f2b",
  red: "#dc2626",
  pink: "#ec4899",
  magenta: "#c026d3",
  purple: "#7c3aed",
  lavender: "#c4b5fd",
  blue: "#2563eb",
  navy: "#1e3a8a",
  teal: "#0d9488",
  turquoise: "#06b6d4",
  green: "#16a34a",
  olive: "#556b2f",
  mint: "#a7f3d0",
  yellow: "#eab308",
  mustard: "#c9a227",
  gold: "#d4af37",
  orange: "#ea580c",
  rust: "#b7410e",
  grey: "#6b7280",
  gray: "#6b7280",
  silver: "#c0c0c0",
  multicolor: "conic-gradient(from 0deg, #dc2626, #eab308, #16a34a, #2563eb, #7c3aed, #dc2626)",
};

const getColorSwatch = (name: string): string | null => {
  const key = name.trim().toLowerCase();
  if (COLOR_HEX[key]) return COLOR_HEX[key];
  const match = Object.keys(COLOR_HEX).find((k) => key.includes(k));
  return match ? COLOR_HEX[match] : null;
};

interface FilterSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function FilterSection({ title, defaultOpen = true, children }: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#f0e4d7] py-3 first:pt-0 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-xs font-semibold text-[#3d2418]">{title}</span>
        <ChevronDown
          size={14}
          className={`text-[#8C7466] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="mt-2.5 space-y-2">{children}</div>}
    </div>
  );
}

function OptionRow({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-2 text-left group"
    >
      <span className="flex items-center gap-2 min-w-0">
        <span
          className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border transition-colors ${
            active
              ? "border-[#7A3511] bg-[#7A3511]"
              : "border-[#d8c7b4] bg-white group-hover:border-[#7A3511]/60"
          }`}
        >
          {active && <span className="h-1.5 w-1.5 rounded-[2px] bg-white" />}
        </span>
        <span
          className={`break-words text-[11px] leading-5 ${
            active ? "font-semibold text-[#7A3511]" : "text-[#4b3a2d]"
          }`}
        >
          {label}
        </span>
      </span>
      {typeof count === "number" && (
        <span className="shrink-0 text-[10px] text-gray-400">{count}</span>
      )}
    </button>
  );
}

export interface FilterSidebarProps {
  mainCategoryOptions: FilterOption[];
  categoryOptions: FilterOption[];
  subcategoryOptions: FilterOption[];
  collections: FilterOption[];
  sizeOptions: FilterOption[];
  colorOptions: FilterOption[];
  mainCategory: string | null;
  category: string | null;
  subcategory: string | null;
  flavor: string | null;
  sizes: string[];
  colors: string[];
  price: string | null;
  minRating: string | null;
  onSingleChange: (key: string, value: string | null) => void;
  onToggleArray: (key: string, value: string) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  onClose?: () => void;
}

export default function FilterSidebar({
  mainCategoryOptions,
  categoryOptions,
  subcategoryOptions,
  collections,
  sizeOptions,
  colorOptions,
  mainCategory,
  category,
  subcategory,
  flavor,
  sizes,
  colors,
  price,
  minRating,
  onSingleChange,
  onToggleArray,
  onClearAll,
  hasActiveFilters,
  onClose,
}: FilterSidebarProps) {
  return (
    <div className="rounded-lg border border-[#f1e4d6] bg-white p-4">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#3d2418]">Filters</h2>
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-semibold text-[#7A3511] hover:underline"
            >
              Clear all
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-gray-500 hover:bg-gray-100 lg:hidden"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {mainCategoryOptions.length > 0 && (
        <FilterSection title="Category">
          {mainCategoryOptions.map((opt) => (
            <OptionRow
              key={opt.slug}
              label={opt.name}
              count={opt.count}
              active={mainCategory === opt.slug}
              onClick={() =>
                onSingleChange("mainCategory", mainCategory === opt.slug ? null : opt.slug!)
              }
            />
          ))}
        </FilterSection>
      )}

      {categoryOptions.length > 0 && (
        <FilterSection title="Product Type">
          <div className="max-h-80 space-y-2 overflow-y-auto overscroll-contain pr-1">
            {categoryOptions.map((opt) => (
              <OptionRow
                key={opt.slug}
                label={opt.name}
                count={opt.count}
                active={category === opt.slug}
                onClick={() =>
                  onSingleChange("category", category === opt.slug ? null : opt.slug!)
                }
              />
            ))}
          </div>
        </FilterSection>
      )}

      {subcategoryOptions.length > 0 && (
        <FilterSection title="Subcategory" defaultOpen={false}>
          {subcategoryOptions.map((opt) => (
            <OptionRow
              key={opt.slug}
              label={opt.name}
              count={opt.count}
              active={subcategory === opt.slug}
              onClick={() =>
                onSingleChange("subcategory", subcategory === opt.slug ? null : opt.slug!)
              }
            />
          ))}
        </FilterSection>
      )}

      <FilterSection title="Price">
        {PRICE_BUCKETS.map((bucket) => (
          <OptionRow
            key={bucket.key}
            label={bucket.label}
            active={price === bucket.key}
            onClick={() => onSingleChange("price", price === bucket.key ? null : bucket.key)}
          />
        ))}
      </FilterSection>

      {sizeOptions.length > 0 && (
        <FilterSection title="Size">
          <div className="flex flex-wrap gap-2">
            {sizeOptions.map((opt) => {
              const active = sizes.includes(opt.name);
              return (
                <button
                  key={opt.name}
                  type="button"
                  onClick={() => onToggleArray("sizes", opt.name)}
                  className={`min-w-[1.75rem] rounded border px-2 py-1.5 text-[11px] font-semibold transition ${
                    active
                      ? "border-[#7A3511] bg-[#7A3511] text-white"
                      : "border-[#e2d3c1] text-[#4b3a2d] hover:border-[#7A3511]/60"
                  }`}
                >
                  {opt.name}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {colorOptions.length > 0 && (
        <FilterSection title="Color">
          <div className="flex flex-wrap gap-3">
            {colorOptions.map((opt) => {
              const active = colors.includes(opt.name);
              const swatch = getColorSwatch(opt.name);
              return (
                <button
                  key={opt.name}
                  type="button"
                  onClick={() => onToggleArray("colors", opt.name)}
                  title={opt.name}
                  className="group flex flex-col items-center gap-1"
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition ${
                      active ? "border-[#7A3511]" : "border-transparent"
                    }`}
                  >
                    {swatch ? (
                      <span
                        className="h-6 w-6 rounded-full ring-1 ring-black/10"
                        style={{ background: swatch }}
                      />
                    ) : (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[9px] font-semibold text-gray-500 ring-1 ring-black/10">
                        {opt.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span
                    className={`max-w-[3.5rem] truncate text-[10px] ${
                      active ? "font-semibold text-[#7A3511]" : "text-gray-500"
                    }`}
                  >
                    {opt.name}
                  </span>
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Customer Rating">
        {[4, 3, 2].map((r) => (
          <OptionRow
            key={r}
            label={`${r}★ & up`}
            active={minRating === String(r)}
            onClick={() =>
              onSingleChange("rating", minRating === String(r) ? null : String(r))
            }
          />
        ))}
      </FilterSection>

      {collections.length > 0 && (
        <FilterSection title="Collections" defaultOpen={false}>
          {collections.map((opt) => (
            <OptionRow
              key={opt.name}
              label={opt.name}
              count={opt.count}
              active={flavor === opt.name}
              onClick={() =>
                onSingleChange("flavor", flavor === opt.name ? null : opt.name)
              }
            />
          ))}
        </FilterSection>
      )}
    </div>
  );
}
