import mongoose, { Document, Schema } from "mongoose";

export type NotificationType =
  | "order_created"
  | "order_status_changed"
  | "payment_status_changed"
  | "order_updated";

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  order?: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    type: {
      type: String,
      enum: [
        "order_created",
        "order_status_changed",
        "payment_status_changed",
        "order_updated",
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
    readAt: { type: Date },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export default mongoose.model<INotification>(
  "Notification",
  notificationSchema,
);
