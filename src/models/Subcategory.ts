import mongoose, { Document, Schema } from "mongoose";

export interface ISubcategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  category: mongoose.Types.ObjectId;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const subcategorySchema = new Schema<ISubcategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Create compound index to ensure unique slug within category
subcategorySchema.index({ category: 1, slug: 1 }, { unique: true });
subcategorySchema.index({ category: 1, isActive: 1 });
subcategorySchema.index({ isActive: 1 });
subcategorySchema.index({ displayOrder: 1 });

export default mongoose.model<ISubcategory>("Subcategory", subcategorySchema);
