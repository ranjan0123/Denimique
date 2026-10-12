import mongoose, { Document, Schema } from "mongoose";

export interface IWeekendCombo extends Document {
  badgeText: string;
  title: string;
  highlightText: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  stockNote: string;
  image: string;
  isEnabled: boolean;
  displayDuration: {
    startDate: Date;
    endDate: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const weekendComboSchema = new Schema<IWeekendCombo>(
  {
    badgeText: { type: String, required: true },
    title: { type: String, required: true },
    highlightText: { type: String, required: true },
    description: { type: String, required: true },
    ctaLabel: { type: String, required: true },
    ctaHref: { type: String, required: true },
    stockNote: { type: String, default: "" },
    image: { type: String, default: "" },
    isEnabled: { type: Boolean, default: false },
    displayDuration: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
  },
  { timestamps: true },
);

weekendComboSchema.index({ isEnabled: 1, createdAt: -1 });

export default mongoose.model<IWeekendCombo>(
  "WeekendCombo",
  weekendComboSchema,
);
