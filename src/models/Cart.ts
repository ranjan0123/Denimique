import mongoose, { Document, Schema } from "mongoose";

export interface ICartItem {
  product: mongoose.Types.ObjectId;
  productId: string;
  slug: string;
  name: string;
  image?: string;
  flavor?: string;
  variantId?: string;
  variantLabel?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productId: { type: String, required: true },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String },
    flavor: { type: String },
    variantId: { type: String },
    variantLabel: { type: String },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const cartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true },
);


export default mongoose.model<ICart>("Cart", cartSchema);
