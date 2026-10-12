import mongoose, { Document, Schema } from "mongoose";

export interface IMainCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const mainCategorySchema = new Schema<IMainCategory>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    image: { type: String },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

mainCategorySchema.index({ isActive: 1 });
mainCategorySchema.index({ displayOrder: 1 });

export default mongoose.model<IMainCategory>(
  "MainCategory",
  mainCategorySchema,
);
