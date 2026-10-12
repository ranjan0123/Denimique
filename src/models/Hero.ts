import mongoose, { Document, Schema } from "mongoose";

export interface IHeadlineLine {
  text: string;
  color: string;
}

export interface ITrustItem {
  label: string;
  icon: string;
}

export interface IHero extends Document {
  badgeText: string;
  headlinePrefix: string;
  headlineLines: IHeadlineLine[];
  description: string;
  startingPrice: number;
  ctaLabel: string;
  ctaHref: string;
  trustItems: ITrustItem[];
  sliderImages: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const headlineLineSchema = new Schema<IHeadlineLine>(
  {
    text: { type: String, required: true },
    color: { type: String, required: true },
  },
  { _id: false },
);

const trustItemSchema = new Schema<ITrustItem>(
  {
    label: { type: String, required: true },
    icon: { type: String, required: true },
  },
  { _id: false },
);

const heroSchema = new Schema<IHero>(
  {
    badgeText: { type: String, required: true },
    headlinePrefix: { type: String, required: true },
    headlineLines: { type: [headlineLineSchema], required: true },
    description: { type: String, required: true },
    startingPrice: { type: Number, required: true },
    ctaLabel: { type: String, required: true },
    ctaHref: { type: String, required: true },
    trustItems: { type: [trustItemSchema], required: true },
    sliderImages: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

heroSchema.index({ isActive: 1, createdAt: -1 });

export default mongoose.model<IHero>("Hero", heroSchema);
