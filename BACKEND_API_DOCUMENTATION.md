# SuitableVastra Backend API Documentation

## 1) Overview
This document describes all backend APIs required to build a custom ecommerce frontend on top of this backend.

- Base URL (local): `http://localhost:5000`
- Base URL (prod example): `https://api.suitablevastra.com`
- API prefix: `/api`
- Content type: `application/json` (except file-upload endpoints, which use `multipart/form-data`)

## 2) Authentication and Authorization

### 2.1 Access Token
Protected APIs require:

- Header: `Authorization: Bearer <accessToken>`

### 2.2 Refresh Token
Login/Google login set an HTTP-only cookie named `refreshToken`.

- Refresh endpoint: `POST /api/auth/refresh`
- Logout endpoint: `POST /api/auth/logout`

### 2.3 Roles
- `user`
- `admin`
- `superadmin`

Role guard behavior:
- Admin-only endpoints reject non-admins with `403 { "message": "Admin only" }`
- Superadmin-only endpoints reject others with `403 { "message": "Super admin only" }`

## 3) Common Response Patterns

### 3.1 Success
- 200 / 201 with endpoint-specific JSON object or array.

### 3.2 Error
Most errors follow:

```json
{ "message": "Human readable error" }
```

Common statuses:
- `400` bad request/validation
- `401` unauthorized/invalid token
- `403` forbidden
- `404` not found
- `409` conflict (e.g. duplicate slug)
- `422` semantic validation (city SEO uniqueness)
- `500` server error

## 4) File Upload Conventions
Multer config:
- Max file size: `5MB`
- Allowed types: `jpeg|jpg|png|gif|webp`

Upload fields:
- Product images: `images` (array, max 5)
- Category/Subcategory/MainCategory image: `image` (single)
- Hero images: `images` or `sliderImages` (multi)
- Weekend combo image: `image` (single)
- Blog featured/inline image: `file` (single)

## 5) Auth APIs
Base: `/api/auth`

### POST `/signup`
Create account (email verification required).

Body:
```json
{ "name": "Rahul", "email": "rahul@example.com", "password": "secret" }
```

Response:
```json
{ "message": "Signup successful. Please verify your email." }
```

### POST `/login`
Email/password login.

Body:
```json
{ "email": "rahul@example.com", "password": "secret" }
```

Success:
```json
{ "user": { "...": "..." }, "accessToken": "..." }
```

If email not verified: `403` with verification message.

### POST `/google`
Google ID token login.

Body:
```json
{ "token": "google_id_token" }
```

Success:
```json
{ "user": { "...": "..." }, "accessToken": "..." }
```

### POST `/refresh`
Returns new access token using refresh cookie.

Response:
```json
{ "accessToken": "..." }
```

### POST `/logout`
Clears refresh token.

Response:
```json
{ "message": "Logged out" }
```

### GET `/verify-email/:token`
Verifies email.

### GET `/me` (Auth)
Returns authenticated user profile.

## 6) User Profile APIs
Base: `/api/users`

### GET `/me` (Auth)
Returns user object without password/refresh token.

### PUT `/me` (Auth)
Update profile fields.

Body (any):
```json
{ "name": "New Name", "phone": "9999999999" }
```

### POST `/me/addresses` (Auth)
Add address.

Body:
```json
{
  "label": "Home",
  "fullName": "Rahul",
  "phone": "9999999999",
  "line1": "Address line 1",
  "line2": "",
  "city": "Jaipur",
  "state": "Rajasthan",
  "postalCode": "302001",
  "country": "India",
  "isDefault": true
}
```

### PUT `/me/addresses/:addressId` (Auth)
Partial update address fields.

### DELETE `/me/addresses/:addressId` (Auth)
Delete address.

## 7) Catalog APIs

### 7.1 Main Categories
Base: `/api/main-categories`

- `GET /` (query: `includeInactive=true|false`)
- `GET /slug/:slug`
- `GET /:id`
- `POST /` (Admin, multipart with optional `image`)
- `PUT /:id` (Admin, multipart with optional `image`)
- `DELETE /:id` (Admin)

Model fields: `name`, `slug`, `description`, `image`, `isActive`, `displayOrder`.

### 7.2 Categories
Base: `/api/categories`

- `GET /hierarchy` (mainCategory -> categories -> subcategories tree)
- `GET /slug/:slug`
- `GET /` (query: `mainCategory`, `includeInactive`)
- `GET /:id`
- `POST /` (Admin, multipart `image`)
- `PUT /:id` (Admin, multipart `image`)
- `DELETE /:id` (Admin)

Fields: `name`, `slug`, `description`, `image`, `mainCategory`, `isActive`, `displayOrder`.

### 7.3 Subcategories
Base: `/api/subcategories`

- `GET /` (query: `category`)
- `GET /slug/:slug`
- `GET /category/:categoryId`
- `GET /:id`
- `POST /` (Admin, multipart `image`)
- `PUT /:id` (Admin, multipart `image`)
- `DELETE /:id` (Admin)

Fields: `name`, `slug`, `description`, `image`, `category`, `isActive`, `displayOrder`.

## 8) Product APIs
Base: `/api/products`

### GET `/`
List products with pagination and filters.

Query:
- `page` (default 1)
- `limit` (default 10)
- `category`
- `subcategory`
- `flavor`
- `isBestSeller=true`
- `isFeatured=true`
- `search`

Response:
```json
{
  "products": ["..."],
  "pagination": { "page": 1, "limit": 10, "total": 0, "pages": 0 }
}
```

### GET `/slug/:slug`
Get single product by slug.

### GET `/:id`
Get single product by Mongo `_id`.

### GET `/gmc-feed.xml`
Google Merchant XML feed.

### GET `/stats` (Admin)
Returns product stats:
- `totalProducts`
- `bestSellers`
- `featured`
- `categories`
- `totalStock`

### POST `/` (Auth; currently no admin middleware in route)
Create product (recommended via `multipart/form-data`).

Key fields:
- `id` (unique product id string)
- `slug` (unique)
- `name`
- `shortDescription`
- `description`
- `category` (ObjectId)
- `subcategory` (optional ObjectId)
- `flavor`
- `basePrice`
- `discountPrice`
- `rating` (default 0)
- `reviewCount` (default 0)
- `variants` (JSON array)
- `ingredients` (JSON array)
- `nutritionalInfo` (JSON object)
- `tags` (JSON array)
- `images` (file uploads or array/string)
- Optional shipping dims: `weightKg`, `lengthCm`, `breadthCm`, `heightCm`

Variant shape:
```json
{ "id": "100g", "label": "100g Pack", "price": 99, "stock": 10 }
```

### PUT `/:id` (Admin)
Update product; supports partial updates and new image uploads.

### DELETE `/:id` (Admin)
Delete product.

## 9) Cart APIs (Auth)
Base: `/api/cart`

- `GET /` get/create user cart
- `POST /items` add item
- `PUT /items/:itemId` update quantity
- `DELETE /items/:itemId` remove item
- `DELETE /` clear cart

Add item body:
```json
{ "productId": "<mongoProductId>", "quantity": 2, "variantId": "100g" }
```

## 10) Wishlist APIs (Auth)
Base: `/api/wishlist`

- `GET /`
- `POST /items` body: `{ "productId": "<mongoProductId>" }`
- `DELETE /items/:itemId`
- `DELETE /`

## 11) Promo Code APIs (Admin)
Base: `/api/promocodes`

- `GET /`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

Promo fields:
- `code`, `description`, `type` (`percentage|fixed`), `value`
- `minOrderAmount`, `maxDiscount`
- `usageLimit`, `perUserLimit`, `startsAt`, `expiresAt`, `isActive`
- `applicableProducts[]`, `applicableCategories[]`, `excludedProducts[]`

## 12) Settings APIs
Base: `/api/settings`

- `GET /` public store settings
- `GET /admin` (Admin)
- `PATCH /admin` (Admin)

Patch body (any):
```json
{
  "codEnabled": true,
  "freeShippingEnabled": true,
  "freeShippingMinAmount": 499
}
```

## 13) Checkout + Shipping Quote APIs (Auth)

### POST `/api/checkout/summary`
Calculates pricing for frontend checkout review.

Body:
```json
{
  "items": [{ "productId": "...", "quantity": 1, "variantId": "100g" }],
  "promoCode": "SAVE10",
  "shippingFee": 0
}
```

Response:
```json
{
  "items": ["...normalized items..."],
  "pricing": { "subtotal": 0, "discount": 0, "shippingFee": 0, "total": 0 },
  "promoCode": { "id": "...", "code": "SAVE10", "type": "percentage", "value": 10 }
}
```

### POST `/api/shipping/quote`
Gets best courier estimate using Shiprocket.

Body:
```json
{
  "items": [{ "productId": "...", "quantity": 1, "variantId": "100g" }],
  "promoCode": "SAVE10",
  "shippingAddress": { "postalCode": "302001" },
  "paymentMethod": "cod",
  "preference": "cheapest"
}
```

Response includes:
- `shippingFee`
- `courier` + `couriers`
- `packageDetails`
- `declaredValue`
- `freeShippingApplied`
- `serviceable`

## 14) Order APIs
Base: `/api/orders`

### POST `/` (Auth)
Create order (`cod` or `online`).

Body:
```json
{
  "items": [{ "productId": "...", "quantity": 1, "variantId": "100g" }],
  "shippingAddress": {
    "fullName": "Customer",
    "email": "c@example.com",
    "phone": "9999999999",
    "line1": "Address",
    "city": "Jaipur",
    "state": "Rajasthan",
    "postalCode": "302001",
    "country": "India"
  },
  "shippingFee": 0,
  "promoCode": "SAVE10",
  "paymentMethod": "online",
  "notes": "optional",
  "packageDetails": { "weight": 0.5, "length": 20, "breadth": 15, "height": 10 }
}
```

Response:
```json
{
  "order": { "..." },
  "razorpay": {
    "keyId": "rzp_...",
    "orderId": "order_...",
    "amount": 50000,
    "currency": "INR"
  }
}
```

### POST `/:id/verify-payment` (Auth)
Verify Razorpay payment.

Body:
```json
{
  "razorpayOrderId": "order_...",
  "razorpayPaymentId": "pay_...",
  "razorpaySignature": "..."
}
```

### POST `/pack-preview` (Admin)
Preview computed package dimensions.

### POST `/:id/shiprocket/create-shipment` (Admin)
Manual shipment creation trigger.

### POST `/:id/shiprocket/cancel-shipment` (Admin)
Manual shipment cancel.

### GET `/my-orders` (Auth)
User�s own orders.

### GET `/:id/tracking` (Auth owner/admin)
Fetch and sync tracking status.

### GET `/:id` (Auth owner/admin)
Order by id.

### GET `/` (Admin)
All orders.

### PUT `/:id/status` (Admin)
Update order/payment status.

Body (one or both):
```json
{ "orderStatus": "processing", "paymentStatus": "paid" }
```

Order statuses:
- `placed|confirmed|processing|shipped|delivered|cancelled`

Payment statuses accepted by controller:
- `pending|paid|failed|refunded|cod_pending`

Note: for Shiprocket-managed orders, order status updates may be blocked by backend.

## 15) Notification APIs (Auth)
Base: `/api/notifications`

- `GET /` list notifications
- `GET /unread-count`
- `PUT /:id/read`
- `PUT /read-all`

## 16) Hero APIs
Base: `/api/hero`

- `GET /` active hero
- `POST /` (Admin, multipart)
- `PUT /:id` (Admin, multipart)
- `DELETE /:id` (Admin)

Key fields:
- `badgeText`, `headlinePrefix`, `headlineLines[]`, `description`
- `startingPrice`, `ctaLabel`, `ctaHref`, `trustItems[]`, `sliderImages[]`, `isActive`

## 17) Hot Product APIs
Base: `/api/hot-product`

- `GET /` active hot product
- `POST /admin` (Admin)
- `GET /admin` (Admin, paginated with `page`, `limit`)
- `GET /admin/:id`
- `PUT /admin/:id`
- `PATCH /admin/:id/toggle`
- `PATCH /admin/:id/progress`
- `DELETE /admin/:id`

Core fields:
- `productId`, `originalPrice`, `discountedPrice`, `discountPercentage`
- `progressPercentage`, `couponCode`, `couponDescription`
- `isEnabled`, `startDate`, `endDate`

## 18) Weekend Combo APIs
Base: `/api/weekend-combo`

- `GET /` active combo
- `POST /admin` (Admin, optional multipart `image`)
- `GET /admin`
- `GET /admin/:id`
- `PUT /admin/:id`
- `PATCH /admin/:id/toggle`
- `DELETE /admin/:id`

Core fields:
- `badgeText`, `title`, `highlightText`, `description`
- `ctaLabel`, `ctaHref`, `stockNote`, `image`
- `isEnabled`, `startDate`, `endDate`

## 19) Blog APIs

### Public blog APIs
Base: `/api/blogs`

- `GET /` with query `page`, `limit`, `category`, `tags`, `search`
- `GET /trending` (query `limit`)
- `GET /categories`
- `GET /tags`
- `GET /:slug`
- `GET /id/:id`

Blog fields include: `title`, `slug`, `content[]`, `excerpt`, `featuredImage`, `imageAlt`, `author`, `category`, `tags`, SEO fields, `internalLinks`, `isPublished`, `viewCount`.

### Admin blog APIs
Base: `/api/admin/blogs` (Auth + Admin)

- `POST /` (multipart `file` for featured image)
- `GET /` (query: `page`, `limit`, `status`, `category`, `search`)
- `GET /analytics`
- `POST /upload-image` (multipart `file`, returns `{ url }`)
- `GET /:id`
- `PUT /:id` (multipart `file` optional)
- `DELETE /:id`
- `PATCH /:id/publish` body `{ "isPublished": true }`

## 20) Form APIs
Base: `/api/forms`

Public:
- `POST /contact` body: `firstName`, `lastName`, `email`, `message`, `sourceUrl`
- `POST /newsletter` body: `email`, `sourceUrl`
- `POST /blog-subscribe` body: `email`, `sourceUrl`
- `POST /wholesale` body: `name`, `businessName`, `phone`, `email`, `city`, `monthlyRequirement`, `message`, `sourceUrl`

Admin:
- `GET /admin` (query: `type`, `status`)
- `GET /admin/:id`
- `PATCH /admin/:id/status` body: `{ "status": "new|read|closed" }`
- `DELETE /admin/:id`

## 21) City Page APIs
Base: `/api/city-pages`

Public:
- `GET /` list active pages
- `GET /:slug`

Admin:
- `GET /admin/all`
- `POST /admin`
- `PUT /admin/:id`
- `DELETE /admin/:id`

Important validations:
- Required: `city`, `heroTitle`, `heroSubtitle`, `intro`, `metaTitle`, `metaDescription`, `citySeoContent`
- `citySeoContent` word count: `350-650`
- Minimum service areas: `3`
- Minimum FAQs: `4`
- Duplicate/high-similarity SEO content can return `422`

## 22) Admin APIs
Base: `/api/admin`

### Superadmin user management
- `GET /users` (query: `page`, `limit`, `search`)
- `GET /users/:id` (query optional: `ordersPage`, `ordersLimit`)
- `GET /users/:id/overview` (query optional: `ordersPage`, `ordersLimit`, `cartPage`, `cartLimit`, `wishlistPage`, `wishlistLimit`)
- `PUT /users/:id/role` body `{ "role": "user|admin|superadmin" }`
- `DELETE /users/:id`

### Admin webhook log access
- `GET /shiprocket-webhooks` (query: `page`, `limit`, `status`, `search`)

## 23) Webhook APIs
Base: `/api/webhooks`

- `POST /shiprocket`
- `POST /order-updates`
- `POST /logistics-updates`

Auth:
- Header `x-api-key` must match `SHIPROCKET_WEBHOOK_TOKEN`

Webhook behavior:
- Matches order by `orderNumber`, `shipmentId`, `awb`
- Updates shipment + order status
- Logs every event in `ShiprocketWebhookLog`
- Creates user notification on status change

## 24) Data Contract Highlights

### 24.1 Cart/Order item input shape
Frontend sends item list like:
```json
[{ "productId": "<mongoId>", "quantity": 2, "variantId": "100g" }]
```

### 24.2 Shipping address shape
```json
{
  "fullName": "...",
  "email": "...",
  "phone": "...",
  "line1": "...",
  "line2": "...",
  "city": "...",
  "state": "...",
  "postalCode": "...",
  "country": "..."
}
```

### 24.3 Order object enums
- `paymentMethod`: `cod|online`
- `paymentStatus`: `pending|paid|failed|refunded`
- `orderStatus`: `placed|confirmed|processing|shipped|delivered|cancelled`
- `shipmentStatus`: `not_created|created|awb_pending|awb_assigned|pickup_scheduled|label_generated|manifest_generated|shipped|delivered|cancelled|error`

## 25) Integration Checklist for External Frontend Teams
1. Implement auth flow (`signup/login/google`, token refresh, logout).
2. Persist and attach `Authorization: Bearer <accessToken>` to protected APIs.
3. Use catalog APIs (`main-categories/categories/subcategories/products`) for navigation/filtering.
4. Use cart/wishlist endpoints as user-side source of truth.
5. Use `/checkout/summary` and `/shipping/quote` before order creation.
6. For online payments, integrate Razorpay using `order` + `razorpay` response from `POST /orders`, then call `verify-payment`.
7. Use `/orders/my-orders` and `/orders/:id/tracking` for post-order UX.
8. Subscribe notification UI to `/notifications` APIs.
9. If building admin frontend, use admin routes exactly as listed above.

## 26) Current Implementation Notes (Important)
- `POST /api/products` route currently applies auth middleware but does not enforce `adminMiddleware` in route definition.
- In public blog routes, `GET /:slug` is declared before `GET /id/:id`; depending on router matching behavior, `/id/:id` can be shadowed.

These are backend implementation details as of current codebase and should be considered during frontend integration and backend hardening.
