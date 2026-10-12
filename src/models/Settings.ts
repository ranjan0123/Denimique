import mongoose, { Schema } from "mongoose";

export interface ISettings extends mongoose.Document {
  codEnabled: boolean;
  freeShippingEnabled: boolean;
  freeShippingMinAmount: number;
  flatShippingFee: number;
  updatedAt?: Date;
  createdAt?: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    codEnabled: { type: Boolean, default: true },
    freeShippingEnabled: { type: Boolean, default: false },
    freeShippingMinAmount: { type: Number, default: 0 },
    flatShippingFee: { type: Number, default: 79, min: 0 },
  },
  { timestamps: true },
);

const Settings =
  mongoose.models.Settings || mongoose.model<ISettings>("Settings", settingsSchema);

export default Settings;
