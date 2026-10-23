import type { Category, MainCategory, Subcategory } from "@/lib/catalog";

export interface ProductVariant {
  id: string;
  label: string; // "50g", "100g", "Combo Pack"
  price: number;
  discountPrice?: number;
  stock: number;
}

export interface Product {
  _id?: string;
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;

  mainCategory?: MainCategory | null;
  category: Category | null;
  subcategory?: Subcategory | null;
  flavor: string;
  brand?: string;
  gender?: string;
  fabric?: string;
  fit?: string;
  material?: string;
  pattern?: string;
  color?: string;
  collection?: string;
  sizes?: string[];
  careInstructions?: string[];
  highlights?: string[];
  occasion?: string[];
  seoTitle?: string;
  seoDescription?: string;
  metaKeywords?: string[];

  images: string[];

  weightKg?: number;
  lengthCm?: number;
  breadthCm?: number;
  heightCm?: number;

  basePrice: number;
  price?: number;
  discountPrice?: number;

  // ⭐ Calculated fields (from Review collection)
  rating?: number;        // average rating (e.g. 4.6)
  reviewCount?: number;   // total reviews

  variants?: ProductVariant[];

  isBestSeller?: boolean;
  isFeatured?: boolean;

  ingredients: string[];
  nutritionalInfo: {
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  };

  tags: string[];
  createdAt?: string;
}
