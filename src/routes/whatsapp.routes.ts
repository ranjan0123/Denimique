import { Router } from "express";
import {
  verifyWebhook,
  receiveWebhook,
  razorpayWebhook,
  sendNotification,
} from "../controllers/whatsapp.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

// Meta webhook verification (GET) and incoming messages (POST)
router.get("/webhook", verifyWebhook);
router.post("/webhook", receiveWebhook);

// Razorpay payment link payment confirmation
router.post("/razorpay-webhook", razorpayWebhook);

// Admin: manually send a WhatsApp notification to a customer
router.post("/send-notification", authMiddleware, adminMiddleware, sendNotification);

export default router;
