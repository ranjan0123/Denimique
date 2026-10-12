# SuitableVastra WhatsApp Automation – Complete Documentation

## Overview

Full-featured WhatsApp commerce automation built on the **Meta WhatsApp Cloud API**. Users can shop, track orders, manage their account, and get support entirely through WhatsApp — no app or website required.

---

## Architecture

```
WhatsApp User
    │ message
    ▼
Meta Cloud API
    │ webhook POST
    ▼
POST /api/whatsapp/webhook
    │
    ▼
whatsapp.controller.ts  ──── responds 200 immediately
    │ async
    ▼
handler.ts (extractInput → dispatch by session.state)
    │
    ├── flows/main.ts      – greeting, main menu
    ├── flows/shop.ts      – browse categories, products, add to cart
    ├── flows/cart.ts      – cart, checkout, address, payment, order
    ├── flows/orders.ts    – my orders, track order, wishlist
    ├── flows/support.ts   – FAQ, contact
    └── flows/account.ts   – profile, logout
```

### Session Storage

Each user's conversation state is stored in MongoDB (`WhatsAppSession` collection):

| Field | Type | Description |
|-------|------|-------------|
| `phoneNumber` | String | WhatsApp `from` number (e.g. `919876543210`) |
| `userId` | ObjectId? | Linked SuitableVastra user (auto-detected by phone number) |
| `state` | String | Current flow state (e.g. `browse_prods`) |
| `data` | Mixed | Flow-specific context (categoryId, productId, etc.) |
| `lastActivity` | Date | TTL: sessions auto-expire after **24 hours** |

---

## Environment Variables

Add these to your `.env`:

```env
# Meta WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token

# Razorpay (for payment links on WhatsApp orders)
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Support contact (shown in FAQs)
SUPPORT_PHONE=+91-9999999999
SUPPORT_EMAIL=support@suitablevastra.com

# Frontend URL (payment callback redirect)
FRONTEND_URL=https://suitablevastra.com
```

---

## Webhook Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/whatsapp/webhook` | Meta verification challenge |
| `POST` | `/api/whatsapp/webhook` | Incoming WhatsApp messages |
| `POST` | `/api/whatsapp/razorpay-webhook` | Razorpay payment confirmation |
| `POST` | `/api/whatsapp/send-notification` | Admin: send custom WhatsApp message |

---

## Meta Setup (One-Time)

1. **Create Meta App** at [developers.facebook.com](https://developers.facebook.com)
2. Add **WhatsApp** product to the app
3. Go to WhatsApp → Configuration:
   - Webhook URL: `https://api.suitablevastra.com/api/whatsapp/webhook`
   - Verify Token: value of `WHATSAPP_VERIFY_TOKEN`
   - Subscribe to: `messages`
4. Copy **Phone Number ID** and **Access Token** → paste to `.env`
5. For production, generate a **Permanent Access Token** via System User

---

## Conversation Flow

### 1. Greeting / Main Menu

**Trigger:** Any greeting (`hi`, `hello`, `start`, `menu`, `suitablevastra`, etc.)

```
User: hi
Bot:  Welcome to SuitableVastra!
      Premium dry fruits, nuts & seeds delivered to your door.

      [Interactive List]
      1. Shop Now        → Browse & buy products
      2. Track Order     → Check your order status
      3. My Orders       → View your order history
      4. My Wishlist     → View saved products
      5. Support & FAQs  → Get help
      6. My Account      → Profile & settings
```

**Global shortcuts (work from any state):**
- `menu` or `home` → Returns to main menu
- `track ORD-xxx` → Directly tracks that order

---

### 2. Shopping Flow

```
[Shop Now]
    │
    ▼
[Category List – Interactive]
  • Dry Fruits
  • Nuts
  • Seeds
  • Superfoods
  • ...
    │ select category
    ▼
[Product List – Interactive, paginated 8 per page]
  • Product Name  ₹299 · Flavor
  • Product Name  ₹599
  ...
  Footer: "1–8 of 24 · "next"/"prev" to navigate"
    │ select product
    ▼
[Product Image sent]
[Product Detail Text]
  *Product Name*
  _Flavor_
  ━━━━━━━━━━━━━━━
  💰 Price: ₹299 (15% off ₹349)
  ⭐ 4.5/5 (128 reviews)
  
  Short description...

  IF single variant:
    [Add to Cart] [View Cart] [Back]
    
  IF multiple variants:
    Available Variants:
    1. 250g – ₹299 ✅
    2. 500g – ₹549 ✅
    3. 1kg  – ₹999 ❌ Out of stock
    Reply with 1, 2, or 3 to add to cart
    │
    ▼
[Add to Cart Confirmation]
  ✅ *Product Name (250g)* added!
  2 item(s) · Total: ₹598
  [View Cart] [Shop More] [Main Menu]
```

---

### 3. Cart Flow

```
[View Cart]
    │
    ▼
🛒 Your Cart (3 items)
━━━━━━━━━━━━━━━
1. Almonds (500g)
   2 × ₹549 = *₹1,098*
2. Cashews (250g)
   1 × ₹399 = *₹399*
━━━━━━━━━━━━━━━
Subtotal: ₹1,497
Type "remove 1" to remove item 1

[Proceed to Checkout] [Clear Cart] [Continue Shopping]
```

**Remove items:** Type `remove 1` (or any number) to remove that item.

---

### 4. Checkout Flow

```
[Proceed to Checkout]
    │
    ▼
[Address Selection – Interactive List]
  Your Saved Addresses:
  • Home – 123 MG Road, Mumbai – 400001
  • Office – 456 Park St, Delhi – 110001
  + Add New Address
    │
    ├─ select saved address ──────────────────────────────────┐
    │                                                         │
    └─ Add New Address                                        │
           │                                                  │
           ▼ (multi-step text input)                         │
       Enter Full Name: _                                     │
       Enter Phone Number: _                                  │
       Enter Street Address: _                                │
       Enter City: _                                          │
       Enter State: _                                         │
       Enter PIN Code: _                                      │
       ✅ Address saved!                                      │
           │                                                  │
           └──────────────────────────────────────────────────┘
                                    │
                                    ▼
                        Order Summary
                        ━━━━━━━━━━━━━━━
                        Items: ₹1,497
                        Shipping: FREE 🎉
                        ━━━━━━━━━━━━━━━
                        Total: ₹1,497

                        [Cash on Delivery] [Pay Online] [Change Address]
                            │                    │
                            │                    ▼
                            │           Razorpay Payment Link sent
                            │           "Complete payment: rzp.io/xxx"
                            │           (expires in 1 hour)
                            │
                            ▼
                    ✅ Order Placed Successfully!
                    📦 Order: ORD-1749345678901
                    💳 Payment: Cash on Delivery
                    📍 Deliver to: Mumbai, Maharashtra

                    Track anytime: reply "track ORD-1749345678901"
```

---

### 5. Track Order

```
[Track Order] or type "track ORD-xxx" from anywhere
    │
    ▼
"Please enter your Order Number:"
    │ user types: ORD-1749345678901
    ▼
📦 Order ORD-1749345678901
━━━━━━━━━━━━━━━
Status: 🚚 SHIPPED
Payment: Cash on Delivery · cod_pending
Shipment: In Transit
AWB: 123456789
Courier: Delhivery

🔗 Track live: https://shiprocket.co/tracking/xxx

Items: 3 · Total: ₹1,497
Deliver to: Mumbai, Maharashtra

[Track Another] [My Orders] [Main Menu]
```

---

### 6. My Orders

```
[My Orders]
    │
    ▼
[Interactive List]
  Recent Orders (5)
  • ORD-1749345678901  🚚 shipped · ₹1,497 · 3 Jun
  • ORD-1749234567890  ✅ confirmed · ₹599 · 1 Jun
  • ORD-1749123456789  📦 delivered · ₹399 · 28 May
    │ select order
    ▼
[Order Detail Text]
📦 ORD-1749345678901
━━━━━━━━━━━━━━━
Status: 🚚 SHIPPED
Shipment: In Transit
Payment: COD · pending

Items:
• Almonds (500g) × 2 = ₹1,098
• Cashews (250g) × 1 = ₹399

━━━━━━━━━━━━━━━
Total: ₹1,497
Deliver to: Mumbai, Maharashtra

🔗 Track: https://shiprocket.co/tracking/xxx

[Track Shipment] [All Orders] [Main Menu]
```

---

### 7. Support & FAQs

```
[Support & FAQs]
    │
    ▼
[Interactive List]
  Common Questions:
  • Delivery time?
  • Shipping charges?
  • Returns & refunds?
  • Payment methods?
  • Product quality?
  • Cancel an order?
  • Track my order?
  • Bulk/wholesale orders?
  • Contact support
    │ select topic
    ▼
[Full FAQ Answer Text]

[More Questions] [Main Menu]
```

**Contact info shown** (from `SUPPORT_PHONE` and `SUPPORT_EMAIL` env vars).

---

### 8. My Account

```
[My Account]
    │ (if linked)
    ▼
👤 My Account
━━━━━━━━━━━━━━━
Name: John Doe
Email: john@example.com
Phone: +91 98765 43210
Addresses: 2 saved
Total Orders: 8
Member since: January 2024

[My Orders] [Unlink Account] [Main Menu]

    │ (if not linked)
    ▼
Your WhatsApp number is not linked to any SuitableVastra account.

To link your account:
1. Visit suitablevastra.com and register
2. Use this WhatsApp number as your phone number
3. Come back here and your account will be auto-linked!

[Shop as Guest] [Main Menu]
```

**Account auto-linking:** When a user first messages, the system checks if their WhatsApp number matches any registered user's phone number. If found, their account is linked automatically — no login required.

---

## Outbound Notifications

Use `src/utils/whatsappNotify.ts` to send proactive messages to customers:

```typescript
import {
  notifyOrderPlaced,
  notifyOrderShipped,
  notifyOrderDelivered,
  notifyOrderStatusChanged,
} from "./utils/whatsappNotify";

// Order placed
await notifyOrderPlaced(userId, "ORD-123", 1497);

// Order shipped
await notifyOrderShipped(userId, "ORD-123", "Delhivery", "1234567890", "https://track.url");

// Order delivered
await notifyOrderDelivered(userId, "ORD-123");

// Any status change
await notifyOrderStatusChanged(userId, "ORD-123", "confirmed");
```

**Integrate with existing webhook handler** (`webhook.controller.ts`) to trigger these automatically when Shiprocket sends status updates.

---

## Admin API

### Send Custom WhatsApp Message

```
POST /api/whatsapp/send-notification
Authorization: Bearer <admin_jwt>
Content-Type: application/json

{
  "phone": "9876543210",
  "message": "Your special offer is waiting! 🎁"
}
```

```json
{ "status": "sent" }
```

---

## Payment Flow (Online)

1. Customer selects "Pay Online" at checkout
2. Backend creates the order with `paymentStatus: "pending"`
3. Razorpay Payment Link is created (1-hour expiry)
4. Link is sent via WhatsApp text message
5. Customer clicks link, pays via Razorpay's hosted checkout
6. Razorpay sends webhook to `POST /api/whatsapp/razorpay-webhook`
7. Backend verifies signature, updates order to `paymentStatus: "paid"`
8. Shiprocket fulfillment is triggered automatically
9. Customer receives WhatsApp confirmation

**Razorpay Webhook setup:**
- URL: `https://api.suitablevastra.com/api/whatsapp/razorpay-webhook`
- Event: `payment_link.paid`
- Secret: value of `RAZORPAY_WEBHOOK_SECRET`

---

## Key Files

| File | Purpose |
|------|---------|
| `src/models/WhatsAppSession.ts` | MongoDB session model with 24h TTL |
| `src/services/whatsapp/types.ts` | TypeScript types |
| `src/services/whatsapp/api.ts` | WhatsApp Cloud API client (text, image, buttons, list) |
| `src/services/whatsapp/session.ts` | Session get/create/update utilities |
| `src/services/whatsapp/handler.ts` | Message dispatcher (state machine router) |
| `src/services/whatsapp/flows/main.ts` | Greeting and main menu |
| `src/services/whatsapp/flows/shop.ts` | Category/product browsing, add to cart |
| `src/services/whatsapp/flows/cart.ts` | Cart, checkout, address, payment, order creation |
| `src/services/whatsapp/flows/orders.ts` | Order history, tracking, wishlist |
| `src/services/whatsapp/flows/support.ts` | FAQ and contact support |
| `src/services/whatsapp/flows/account.ts` | Profile view and account management |
| `src/controllers/whatsapp.controller.ts` | HTTP route handlers |
| `src/routes/whatsapp.routes.ts` | Express route definitions |
| `src/utils/razorpayLink.ts` | Razorpay Payment Link creation |
| `src/utils/whatsappNotify.ts` | Outbound notification helpers |

---

## Flow State Reference

| State | Description |
|-------|-------------|
| `idle` | No active conversation |
| `main_menu` | Showing main menu options |
| `browse_cats` | Browsing product categories |
| `browse_prods` | Browsing products in a category |
| `view_product` | Viewing a single product detail |
| `cart` | Viewing cart |
| `checkout_addr` | Selecting delivery address |
| `checkout_new_addr` | Entering new address (multi-step) |
| `checkout_pay` | Selecting payment method |
| `track_input` | Waiting for order number input |
| `my_orders` | Viewing order list |
| `view_order` | Viewing single order detail |
| `support` | Support / FAQ menu |
| `account` | Account management |

---

## WhatsApp Message Types Used

| Type | When Used | Limits |
|------|-----------|--------|
| Text | Product details, confirmations, tracking | 4096 chars |
| Image | Product images | Cloudinary URL |
| Interactive List | Menus with 4–10 options | Max 10 rows, 24 char titles |
| Interactive Buttons | 2–3 action choices | Max 3 buttons, 20 char labels |

---

## Testing

### Test Locally with ngrok

```bash
ngrok http 5000
# Copy HTTPS URL, e.g. https://abc123.ngrok.io
```

Set in Meta Developer Console:
- Webhook URL: `https://abc123.ngrok.io/api/whatsapp/webhook`

### Send Test Messages (curl)

```bash
# Simulate incoming text message
curl -X POST http://localhost:5000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "test",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {"display_phone_number": "test", "phone_number_id": "test"},
          "contacts": [{"profile": {"name": "Test User"}, "wa_id": "919876543210"}],
          "messages": [{
            "id": "wamid.test123",
            "from": "919876543210",
            "timestamp": "1706000000",
            "type": "text",
            "text": {"body": "hi"}
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

### Simulate Razorpay Payment

```bash
curl -X POST http://localhost:5000/api/whatsapp/razorpay-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "payment_link.paid",
    "payload": {
      "payment_link": {"entity": {"reference_id": "ORD-1749345678901"}},
      "payment": {"entity": {"id": "pay_test123"}}
    }
  }'
```

---

## Production Checklist

- [ ] Set `WHATSAPP_ACCESS_TOKEN` (permanent system user token)
- [ ] Set `WHATSAPP_PHONE_NUMBER_ID`
- [ ] Set `WHATSAPP_VERIFY_TOKEN`
- [ ] Register webhook in Meta Developer Console
- [ ] Subscribe to `messages` field
- [ ] Set `RAZORPAY_WEBHOOK_SECRET` in Razorpay dashboard
- [ ] Add Razorpay webhook URL in dashboard
- [ ] Set `SUPPORT_PHONE` and `SUPPORT_EMAIL`
- [ ] Set `FRONTEND_URL`
- [ ] Test all flows end-to-end on real WhatsApp number
- [ ] Pre-approve message templates for proactive notifications (if needed)
- [ ] Create MongoDB TTL index on `WhatsAppSession.lastActivity` (auto-created on model init)

---

## WhatsApp Business API Tier Limits

| Tier | Max conversations/day |
|------|-----------------------|
| Tier 1 (default) | 1,000 |
| Tier 2 | 10,000 |
| Tier 3 | 100,000 |
| Unlimited | Unlimited |

Tier upgrades happen automatically based on message volume and quality score. Monitor at Meta Business Manager → WhatsApp → Insights.

---

## User-Side Quick Reference

Share this with customers:

```
📱 Shop on WhatsApp!

Add +91-XXXXXXXXXX to your contacts.
Send "hi" to start shopping!

Quick commands:
• hi / hello / menu – Main menu
• track ORD-xxx – Track order
• menu – Go back anytime
```
