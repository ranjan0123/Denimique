import mongoose, { Document, Schema } from "mongoose";

export interface IHotProduct extends Document {
  productId: mongoose.Types.ObjectId;
  productName: string;
  productSlug: string;
  productImage: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  progressPercentage: number;
  couponCode: string;
  couponDescription: string;
  isEnabled: boolean;
  displayDuration: {
    startDate: Date;
    endDate: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const hotProductSchema = new Schema<IHotProduct>(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: { type: String, required: true },
    productSlug: { type: String, required: true },
    productImage: { type: String, default: "" },
    originalPrice: { type: Number, required: true, min: 0 },
    discountedPrice: { type: Number, required: true, min: 0 },
    discountPercentage: { type: Number, required: true, min: 0, max: 100 },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    couponCode: { type: String, required: true },
    couponDescription: { type: String, required: true },
    isEnabled: { type: Boolean, default: false },
    displayDuration: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<IHotProduct>("HotProduct", hotProductSchema);
