# suitablevastra-backend

## Razorpay setup

Add these environment variables to your `.env`:

```env
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

## Order flow

### 1. Create order

`POST /api/orders`

Send the existing order payload with:

```json
{
  "items": [
    {
      "productId": "PRODUCT_ID",
      "quantity": 1,
      "variantId": "VARIANT_ID"
    }
  ],
  "shippingAddress": {
    "fullName": "Customer Name",
    "email": "customer@example.com",
    "phone": "9999999999",
    "line1": "Address line 1",
    "city": "Jaipur",
    "state": "Rajasthan",
    "postalCode": "302001",
    "country": "India"
  },
  "shippingFee": 0,
  "promoCode": "SAVE10",
  "paymentMethod": "online"
}
```

For online payments the response now returns:

```json
{
  "order": {},
  "razorpay": {
    "keyId": "rzp_...",
    "orderId": "order_...",
    "amount": 50000,
    "currency": "INR"
  }
}
```

`amount` is returned in paise, as required by Razorpay Checkout.

### 2. Open Razorpay Checkout on frontend

Use:

- `key`: `razorpay.keyId`
- `order_id`: `razorpay.orderId`
- `amount`: `razorpay.amount`
- `currency`: `razorpay.currency`

### 3. Verify payment

After successful payment, call:

`POST /api/orders/:id/verify-payment`

```json
{
  "razorpayOrderId": "order_...",
  "razorpayPaymentId": "pay_...",
  "razorpaySignature": "signature_from_checkout"
}
```

If the signature is valid, the backend marks the order payment status as `paid`.

## Shiprocket setup

Add these environment variables to your `.env`:

```env
SHIPROCKET_EMAIL=api-user-email
SHIPROCKET_PASSWORD=api-user-password
SHIPROCKET_PICKUP_LOCATION=Primary
SHIPROCKET_PICKUP_POSTCODE=302001
SHIPROCKET_DEFAULT_WEIGHT_KG=0.5
SHIPROCKET_DEFAULT_LENGTH_CM=20
SHIPROCKET_DEFAULT_BREADTH_CM=15
SHIPROCKET_DEFAULT_HEIGHT_CM=10
SHIPROCKET_WEBHOOK_TOKEN=your_shared_secret_for_shiprocket_webhook
```

Use Shiprocket API user credentials, not your normal dashboard login. Shiprocket's support docs say the token is created from `POST /v1/external/auth/login`, and their external flow includes create order, assign AWB, generate pickup, generate label, manifest, invoice, and tracking.

### Automation behavior

- COD orders attempt Shiprocket fulfillment immediately after order creation.
- Online orders attempt Shiprocket fulfillment after Razorpay payment verification.
- If Shiprocket creates the order but cannot auto-assign an AWB yet, the order is kept in `shipmentStatus: "awb_pending"` instead of failing hard.
- Other Shiprocket failures still keep the order intact and set `shipmentStatus` to `error` for retry.

### Manual admin fallback

- `POST /api/orders/:id/shiprocket/create-shipment`
- `GET /api/orders/:id/tracking`

### Important note

Your current product model does not store package weight or dimensions. This integration uses default package values from env unless `packageDetails` is passed during order creation. For tighter automation, add shipping dimensions per product or variant next.

## Shiprocket webhook setup

Use this webhook endpoint in Shiprocket:

`POST /api/webhooks/order-updates`

For production it should look like:

`https://api.suitablevastra.com/api/webhooks/order-updates`

In Shiprocket webhook settings:

- URL: your public backend URL + `/api/webhooks/order-updates`
- Token: same value as `SHIPROCKET_WEBHOOK_TOKEN`
- Method: `POST`

The backend validates the token from header `x-api-key`, updates matching orders by `orderNumber` / `shipmentId` / `awb`, updates shipment and order status, and creates a user notification when the status changes.

Webhook audit logs are stored in MongoDB and can be inspected via admin Api:

`GET /api/admin/shiprocket-webhooks?page=1&limit=20&status=processed&search=SNK-`
