import { IWhatsAppSession } from "../../../models/WhatsAppSession";
import { NormalizedInput } from "../types";
import { sendButtons, sendList, sendText } from "../api";
import { updateSession } from "../session";
import { sendMainMenu } from "./main";

const SUPPORT_PHONE = process.env.SUPPORT_PHONE || "+91-9999999999";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@suitablevastra.com";
const WEBSITE = "suitablevastra.com";

const FAQS: Array<{ id: string; question: string; answer: string }> = [
  {
    id: "faq_delivery",
    question: "Delivery time?",
    answer:
      `*Delivery Timeline*\n━━━━━━━━━━━━━━━\n` +
      `• Metro cities: 2–3 business days\n` +
      `• Tier 2 cities: 3–5 business days\n` +
      `• Remote areas: 5–7 business days\n\n` +
      `Orders placed before 2 PM are dispatched the same day. You'll get tracking updates on WhatsApp!`,
  },
  {
    id: "faq_shipping_charges",
    question: "Shipping charges?",
    answer:
      `*Shipping Charges*\n━━━━━━━━━━━━━━━\n` +
      `• Free shipping on orders above a minimum amount (check at checkout)\n` +
      `• Standard shipping: ₹49 for orders below the threshold\n\n` +
      `We use trusted courier partners for safe delivery.`,
  },
  {
    id: "faq_returns",
    question: "Returns & refunds?",
    answer:
      `*Returns & Refunds Policy*\n━━━━━━━━━━━━━━━\n` +
      `• We accept returns within *7 days* of delivery\n` +
      `• Items must be unopened and in original packaging\n` +
      `• Damaged/wrong items: full refund or replacement\n` +
      `• Refunds processed in 5–7 business days\n\n` +
      `To initiate a return, contact us at *${SUPPORT_EMAIL}*`,
  },
  {
    id: "faq_payment",
    question: "Payment methods?",
    answer:
      `*Accepted Payments*\n━━━━━━━━━━━━━━━\n` +
      `✅ Cash on Delivery (COD)\n` +
      `✅ UPI (PhonePe, GPay, Paytm, etc.)\n` +
      `✅ Credit / Debit Cards\n` +
      `✅ Net Banking\n` +
      `✅ EMI on select cards\n\n` +
      `All online payments are secured via Razorpay.`,
  },
  {
    id: "faq_quality",
    question: "Product quality?",
    answer:
      `*Our Quality Promise*\n━━━━━━━━━━━━━━━\n` +
      `• 100% natural, no artificial additives\n` +
      `• Premium-grade nuts, dry fruits & seeds\n` +
      `• Hygienically packed in food-safe packaging\n` +
      `• Best-before date clearly marked on every pack\n\n` +
      `We source directly from trusted farms for maximum freshness.`,
  },
  {
    id: "faq_cancel",
    question: "Cancel an order?",
    answer:
      `*Order Cancellation*\n━━━━━━━━━━━━━━━\n` +
      `• You can cancel orders within *1 hour* of placing them\n` +
      `• Once shipped, cancellation is not possible\n\n` +
      `To cancel, reply *"track <order number>"* and then contact our support team:\n` +
      `📧 ${SUPPORT_EMAIL}\n📞 ${SUPPORT_PHONE}`,
  },
  {
    id: "faq_track",
    question: "Track my order?",
    answer:
      `*Order Tracking*\n━━━━━━━━━━━━━━━\n` +
      `Reply *"track ORD-XXXXXXXXXX"* with your order number anytime to get live tracking.\n\n` +
      `You'll also receive automatic WhatsApp updates when your order is:\n` +
      `• Confirmed\n• Shipped\n• Out for delivery\n• Delivered`,
  },
  {
    id: "faq_bulk",
    question: "Bulk/wholesale orders?",
    answer:
      `*Wholesale & Bulk Orders*\n━━━━━━━━━━━━━━━\n` +
      `We offer special pricing for bulk orders!\n\n` +
      `📧 Email: ${SUPPORT_EMAIL}\n` +
      `📞 Call: ${SUPPORT_PHONE}\n` +
      `🌐 Website: ${WEBSITE}/wholesale\n\n` +
      `Our team will get back to you within 24 hours.`,
  },
  {
    id: "faq_contact",
    question: "Contact support",
    answer:
      `*Contact Us*\n━━━━━━━━━━━━━━━\n` +
      `📞 Phone/WhatsApp: *${SUPPORT_PHONE}*\n` +
      `📧 Email: *${SUPPORT_EMAIL}*\n` +
      `🌐 Website: *${WEBSITE}*\n\n` +
      `Support hours: Mon–Sat, 9 AM – 7 PM IST`,
  },
];

export async function handleSupport(to: string, session: IWhatsAppSession): Promise<void> {
  const rows = FAQS.map((faq) => ({
    id: faq.id,
    question: faq.question,
    title: faq.question.substring(0, 24),
  }));

  await sendList(
    to,
    "Choose a topic to get instant answers:",
    "Browse FAQs",
    [{ title: "Common Questions", rows }],
    "Support & FAQs",
    'Type "menu" to go back',
  );

  await updateSession(session, "support", session.data);
}

export async function handleSupportSelection(
  to: string,
  session: IWhatsAppSession,
  input: NormalizedInput,
): Promise<void> {
  if (input.value === "menu" || input.value === "back") {
    return sendMainMenu(to, session);
  }

  if (input.value === "retry_track") {
    await sendText(to, "Please enter your *Order Number*:");
    return updateSession(session, "track_input", session.data);
  }

  const faq = FAQS.find((f) => f.id === input.value);
  if (faq) {
    await sendText(to, faq.answer);
    await sendButtons(
      to,
      "Was this helpful?",
      [
        { id: "support_more", title: "More Questions" },
        { id: "menu", title: "Main Menu" },
      ],
    );
    return updateSession(session, "support", session.data);
  }

  if (input.value === "support_more") {
    return handleSupport(to, session);
  }

  return handleSupport(to, session);
}
