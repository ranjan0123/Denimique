import mongoose, { Document, Schema } from "mongoose";

export interface IVariant {
  id: string;
  label: string;
  price: number;
  stock: number;
}

export interface INutritionalInfo {
  calories?: string;
  protein?: string;
  carbs?: string;
  fat?: string;
}

export interface IProduct extends Document {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: mongoose.Types.ObjectId;
  subcategory?: mongoose.Types.ObjectId | null;
  flavor?: string;
  brand?: string;
  gender?: string;
  fabric?: string;
  fit?: string;
  material?: string;
  pattern?: string;
  color?: string;
  sizes?: string[];
  careInstructions?: string[];
  highlights?: string[];
  occasion?: string[];
  seoTitle?: string;
  seoDescription?: string;
  metaKeywords?: string[];
  images: string[];
  basePrice: number;
  discountPrice: number;
  rating: number;
  reviewCount: number;
  variants: IVariant[];
  isBestSeller: boolean;
  isFeatured: boolean;
  ingredients: string[];
  nutritionalInfo?: INutritionalInfo;
  tags: string[];
  weightKg?: number;
  lengthCm?: number;
  breadthCm?: number;
  heightCm?: number;
  createdAt: Date;
  updatedAt: Date;
}

const variantSchema = new Schema<IVariant>({
  id: { type: String, required: true },
  label: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
});

const nutritionalInfoSchema = new Schema<INutritionalInfo>({
  calories: { type: String, required: false },
  protein: { type: String, required: false },
  carbs: { type: String, required: false },
  fat: { type: String, required: false },
});

const productSchema = new Schema<IProduct>(
  {
    id: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    shortDescription: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    subcategory: {
      type: Schema.Types.ObjectId,
      ref: "Subcategory",
      required: false,
      default: null,
    },
    flavor: { type: String, default: "" },
    brand: { type: String, default: "" },
    gender: { type: String, default: "" },
    fabric: { type: String, default: "" },
    fit: { type: String, default: "" },
    material: { type: String, default: "" },
    pattern: { type: String, default: "" },
    color: { type: String, default: "" },
    sizes: [{ type: String }],
    careInstructions: [{ type: String }],
    highlights: [{ type: String }],
    occasion: [{ type: String }],
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    metaKeywords: [{ type: String }],
    images: [{ type: String }],
    basePrice: { type: Number, required: true },
    discountPrice: { type: Number, required: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    reviewCount: { type: Number, required: true, default: 0 },
    variants: [variantSchema],
    isBestSeller: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    ingredients: [{ type: String }],
    nutritionalInfo: { type: nutritionalInfoSchema, required: false },
    tags: [{ type: String }],
    weightKg: { type: Number, min: 0.01 },
    lengthCm: { type: Number, min: 1 },
    breadthCm: { type: Number, min: 1 },
    heightCm: { type: Number, min: 1 },
  },
  { timestamps: true },
);

// Create indexes for better query performance
productSchema.index({ category: 1 });
productSchema.index({ subcategory: 1 });
productSchema.index({ isBestSeller: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ tags: 1 });

export default mongoose.model<IProduct>("Product", productSchema);
