import mongoose, { Document, Schema } from "mongoose";

export type PromoCodeType = "percentage" | "fixed";

export interface IPromoCode extends Document {
  code: string;
  description?: string;
  type: PromoCodeType;
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit?: number;
  startsAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  applicableProducts: mongoose.Types.ObjectId[];
  applicableCategories: mongoose.Types.ObjectId[];
  excludedProducts: mongoose.Types.ObjectId[];
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const promoCodeSchema = new Schema<IPromoCode>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: { type: String },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    value: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    usageLimit: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    perUserLimit: { type: Number, min: 1 },
    startsAt: { type: Date },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
    applicableProducts: [
      { type: Schema.Types.ObjectId, ref: "Product", default: [] },
    ],
    applicableCategories: [
      { type: Schema.Types.ObjectId, ref: "Category", default: [] },
    ],
    excludedProducts: [
      { type: Schema.Types.ObjectId, ref: "Product", default: [] },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

promoCodeSchema.index({ isActive: 1 });
promoCodeSchema.index({ expiresAt: 1 });

export default mongoose.model<IPromoCode>("PromoCode", promoCodeSchema);
