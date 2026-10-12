import { Request, Response } from "express";
import crypto from "crypto";
import { WhatsAppWebhookBody } from "../services/whatsapp/types";
import { processMessage } from "../services/whatsapp/handler";
import Order from "../models/Order";
import { createNotification } from "../utils/notifications";
import { sendText } from "../services/whatsapp/api";

/**
 * GET /api/whatsapp/webhook
 * Meta webhook verification challenge
 */
export const verifyWebhook = (req: Request, res: Response): void => {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WhatsApp] Webhook verified");
    res.status(200).send(challenge);
  } else {
    res.status(403).json({ error: "Verification failed" });
  }
};

/**
 * POST /api/whatsapp/webhook
 * Receives incoming WhatsApp messages from Meta
 */
export const receiveWebhook = async (req: Request, res: Response): Promise<void> => {
  // Always respond 200 quickly so Meta doesn't retry
  res.status(200).json({ status: "ok" });

  const body = req.body as WhatsAppWebhookBody;

  if (body?.object !== "whatsapp_business_account") return;

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value;
      if (change.field !== "messages" || !value.messages?.length) continue;

      for (const message of value.messages) {
        processMessage(message).catch((err) => {
          console.error("[WhatsApp] processMessage error:", err);
        });
      }
    }
  }
};

/**
 * POST /api/whatsapp/razorpay-webhook
 * Handles Razorpay payment_link.paid events to confirm WhatsApp-initiated orders
 */
export const razorpayWebhook = async (req: Request, res: Response): Promise<void> => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (webhookSecret) {
    const signature = req.headers["x-razorpay-signature"] as string;
    const body = JSON.stringify(req.body);
    const expected = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");

    if (signature !== expected) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }
  }

  const event = req.body?.event;
  if (event !== "payment_link.paid") {
    res.status(200).json({ status: "ignored" });
    return;
  }

  const orderNumber: string = req.body?.payload?.payment_link?.entity?.reference_id;
  const paymentId: string = req.body?.payload?.payment?.entity?.id;

  if (!orderNumber) {
    res.status(400).json({ error: "Missing reference_id" });
    return;
  }

  const order = await Order.findOne({ orderNumber }).catch(() => null);

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (order.paymentStatus === "paid") {
    res.status(200).json({ status: "already_paid" });
    return;
  }

  order.paymentStatus = "paid";
  order.paymentMethod = "online";
  order.paymentProvider = "razorpay";
  order.paymentDetails = { razorpayPaymentId: paymentId, paidAt: new Date() } as any;
  await order.save();

  await createNotification({
    userId: order.user,
    orderId: order._id,
    type: "payment_status_changed",
    title: "Payment Confirmed",
    message: `Payment for order ${orderNumber} confirmed. We're preparing your order!`,
  });

  // Notify customer on WhatsApp if their phone number is known
  const phone = order.shippingAddress.phone?.replace(/\D/g, "");
  if (phone) {
    const waPhone = phone.startsWith("91") ? phone : `91${phone}`;
    sendText(
      waPhone,
      `✅ *Payment Confirmed!*\n\n📦 Order *${orderNumber}* is now confirmed.\nWe're preparing your package and will notify you once it's shipped!\n\nReply *"track ${orderNumber}"* anytime to check status.`,
    ).catch(() => {});
  }

  res.status(200).json({ status: "ok" });
};

/**
 * POST /api/whatsapp/send-notification
 * Internal endpoint: send a WhatsApp message to a customer (admin use)
 */
export const sendNotification = async (req: Request, res: Response): Promise<void> => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    res.status(400).json({ error: "phone and message are required" });
    return;
  }

  const waPhone = phone.replace(/\D/g, "");

  try {
    await sendText(waPhone, message);
    res.status(200).json({ status: "sent" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
