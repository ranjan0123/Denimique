import mongoose, { Document, Schema } from "mongoose";

export interface IWhatsAppSession extends Document {
  phoneNumber: string;
  userId?: mongoose.Types.ObjectId;
  state: string;
  data: Record<string, any>;
  lastActivity: Date;
}

const schema = new Schema<IWhatsAppSession>(
  {
    phoneNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    state: { type: String, default: "idle" },
    data: { type: Schema.Types.Mixed, default: {} },
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Auto-expire sessions after 24 hours of inactivity
schema.index({ lastActivity: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model<IWhatsAppSession>("WhatsAppSession", schema);
