import User from "../models/user.model";
import { sendText } from "../services/whatsapp/api";

function normalizeToWaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits;
}

export async function notifyOrderPlaced(
  userId: string,
  orderNumber: string,
  total: number,
): Promise<void> {
  const user = await User.findById(userId).select("phone").lean();
  if (!user?.phone) return;

  const waPhone = normalizeToWaPhone(user.phone);
  await sendText(
    waPhone,
    `✅ *Order Placed!*\n\n` +
      `📦 Order *${orderNumber}* has been received.\n` +
      `💰 Total: ₹${total}\n\n` +
      `We'll notify you as soon as it ships. Reply *"track ${orderNumber}"* anytime to check status.\n\n` +
      `_Thank you for shopping with Denimique!_`,
  ).catch(() => {});
}

export async function notifyOrderShipped(
  userId: string,
  orderNumber: string,
  courierName: string,
  awbCode: string,
  trackingUrl?: string,
): Promise<void> {
  const user = await User.findById(userId).select("phone").lean();
  if (!user?.phone) return;

  const waPhone = normalizeToWaPhone(user.phone);
  let msg =
    `🚚 *Your Order is Shipped!*\n\n` +
    `📦 Order: *${orderNumber}*\n` +
    `🚀 Courier: ${courierName}\n` +
    `📍 AWB: ${awbCode}\n`;
  if (trackingUrl) msg += `\n🔗 Track live: ${trackingUrl}`;
  msg += `\n\nReply *"track ${orderNumber}"* for updates.`;

  await sendText(waPhone, msg).catch(() => {});
}

export async function notifyOrderDelivered(
  userId: string,
  orderNumber: string,
): Promise<void> {
  const user = await User.findById(userId).select("phone").lean();
  if (!user?.phone) return;

  const waPhone = normalizeToWaPhone(user.phone);
  await sendText(
    waPhone,
    `🎉 *Order Delivered!*\n\n` +
      `📦 Order *${orderNumber}* has been delivered.\n\n` +
      `We hope you love your Denimique products! ❤️\n\n` +
      `Rate us or reorder at *suitablevastra.com*\n` +
      `Reply *menu* to shop again!`,
  ).catch(() => {});
}

export async function notifyOrderStatusChanged(
  userId: string,
  orderNumber: string,
  newStatus: string,
): Promise<void> {
  const user = await User.findById(userId).select("phone").lean();
  if (!user?.phone) return;

  const statusLabels: Record<string, string> = {
    confirmed: "✅ Confirmed – we're getting it ready!",
    processing: "⚙️ Processing – being packed",
    shipped: "🚚 Shipped – on its way!",
    delivered: "🎉 Delivered – enjoy your order!",
    cancelled: "❌ Cancelled",
  };

  const statusLabel = statusLabels[newStatus] || newStatus;
  const waPhone = normalizeToWaPhone(user.phone);

  await sendText(
    waPhone,
    `📦 *Order Update*\n\n` +
      `Order *${orderNumber}* status changed to:\n*${statusLabel}*\n\n` +
      `Reply *"track ${orderNumber}"* for full details.`,
  ).catch(() => {});
}
