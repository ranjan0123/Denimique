import mongoose, { Document, Schema } from "mongoose";

export interface IShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IOrderItem {
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

export type PaymentMethod = "cod" | "online";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type OrderStatus =
  | "placed"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface IRazorpayPaymentDetails {
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paidAt?: Date;
}

export interface IPackageDetails {
  weight: number;
  length: number;
  breadth: number;
  height: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  promoCode?: mongoose.Types.ObjectId;
  promoCodeSnapshot?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentProvider?: "razorpay";
  paymentDetails?: IRazorpayPaymentDetails;
  packageDetails: IPackageDetails;
  orderStatus: OrderStatus;
  notes?: string;
  placedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const orderItemSchema = new Schema<IOrderItem>(
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
  { _id: false },
);

const razorpayPaymentDetailsSchema = new Schema<IRazorpayPaymentDetails>(
  {
    razorpayOrderId: { type: String, trim: true },
    razorpayPaymentId: { type: String, trim: true },
    razorpaySignature: { type: String, trim: true },
    paidAt: { type: Date },
  },
  { _id: false },
);

const packageDetailsSchema = new Schema<IPackageDetails>(
  {
    weight: { type: Number, required: true, min: 0.1 },
    length: { type: Number, required: true, min: 1 },
    breadth: { type: Number, required: true, min: 1 },
    height: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    shippingFee: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    promoCode: { type: Schema.Types.ObjectId, ref: "PromoCode" },
    promoCodeSnapshot: { type: String },
    paymentMethod: {
      type: String,
      enum: ["cod", "online"],
      required: true,
      default: "cod",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      required: true,
      default: "pending",
    },
    paymentProvider: {
      type: String,
      enum: ["razorpay"],
    },
    paymentDetails: { type: razorpayPaymentDetailsSchema },
    packageDetails: { type: packageDetailsSchema, required: true },
    orderStatus: {
      type: String,
      enum: ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      required: true,
      default: "placed",
    },
    notes: { type: String },
    placedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });

export default mongoose.model<IOrder>("Order", orderSchema);
