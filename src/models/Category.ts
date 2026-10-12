import mongoose, { Document, Schema } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  mainCategory: mongoose.Types.ObjectId;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    image: { type: String },
    mainCategory: {
      type: Schema.Types.ObjectId,
      ref: "MainCategory",
      required: true,
    },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Create indexes
categorySchema.index({ mainCategory: 1 });
categorySchema.index({ mainCategory: 1, isActive: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ displayOrder: 1 });

export default mongoose.model<ICategory>("Category", categorySchema);
