import mongoose, { Document, Schema } from "mongoose";

export type FormResponseType =
  | "contact"
  | "newsletter"
  | "wholesale"
  | "blog-subscribe";

export interface IFormResponse extends Document {
  type: FormResponseType;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  city?: string;
  message?: string;
  monthlyRequirement?: string;
  sourceUrl?: string;
  status: "new" | "read" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

const formResponseSchema = new Schema<IFormResponse>(
  {
    type: { type: String, required: true },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    company: { type: String, default: "" },
    city: { type: String, default: "" },
    message: { type: String, default: "" },
    monthlyRequirement: { type: String, default: "" },
    sourceUrl: { type: String, default: "" },
    status: { type: String, default: "new" },
  },
  { timestamps: true },
);

formResponseSchema.index({ type: 1, createdAt: -1 });
formResponseSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IFormResponse>(
  "FormResponse",
  formResponseSchema,
);
