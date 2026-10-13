export type PaymentMethod = "cod" | "online";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "cod_pending";

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CartItem {
  id: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  quantity: number;
  unitPrice: number;
  basePrice?: number;
  variantId?: string;
  variantLabel?: string;
}

export interface CheckoutSummaryItem {
  productId: string;
  variantId?: string;
  quantity: number;
  name?: string;
  image?: string;
  unitPrice?: number;
  lineTotal?: number;
}

export interface CheckoutSummaryRequest {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  promoCode?: string;
  shippingFee: number;
}

export interface ShippingQuoteRequest {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  promoCode?: string;
  paymentMethod: PaymentMethod;
  shippingAddress: Pick<ShippingAddress, "postalCode">;
}

export interface ShippingQuoteResponse {
  shippingFee: number;
  serviceable: boolean;
  message?: string;
  packageDetails?: PackageDetails;
  declaredValue?: number;
  freeShippingApplied?: boolean;
  freeShippingMinAmount?: number;
}

export interface StoreSettings {
  codEnabled: boolean;
  freeShippingEnabled: boolean;
  freeShippingMinAmount: number;
  flatShippingFee: number;
}

export interface CheckoutSummaryResponse {
  items: CheckoutSummaryItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  promoCode?: string;
  message?: string;
}

export interface CreateOrderItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface PackageDetails {
  weight: number;
  length: number;
  breadth: number;
  height: number;
}

export interface CreateOrderRequest {
  items: CreateOrderItemInput[];
  promoCode?: string;
  shippingFee: number;
  paymentMethod: PaymentMethod;
  shippingAddress: ShippingAddress;
  packageDetails?: PackageDetails;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  variantId?: string;
  variantLabel?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus | string;
  orderStatus: OrderStatus | string;
  shippingAddress: ShippingAddress;
  promoCode?: string;
  packageDetails?: PackageDetails;
  createdAt?: string;
  user?: {
    _id?: string;
    name?: string;
    email?: string;
  };
}

export interface RazorpayOrderPayload {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
}

export interface CreateOrderResponse {
  order: Order;
  razorpay?: RazorpayOrderPayload;
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export type PromoCodeType = "percentage" | "fixed";

export interface PromoCode {
  _id: string;
  code: string;
  description?: string;
  type: PromoCodeType;
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  startsAt?: string;
  expiresAt?: string;
  isActive: boolean;
  applicableProducts: string[];
  applicableCategories: string[];
  excludedProducts: string[];
  createdAt?: string;
}

export interface PromoCodeForm {
  code: string;
  description: string;
  type: PromoCodeType;
  value: number;
  minOrderAmount: number;
  maxDiscount: number;
  usageLimit: number;
  perUserLimit: number;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  applicableProducts: string[];
  applicableCategories: string[];
  excludedProducts: string[];
}

export interface CartApiProduct {
  _id?: string;
  id?: string;
  slug?: string;
  handle?: string;
  name?: string;
  title?: string;
  images?: Array<string | { src?: string; url?: string }>;
  image?: string;
  basePrice?: number;
  discountPrice?: number;
}

export interface CartApiItem {
  _id?: string;
  id?: string;
  productId?: string;
  quantity?: number;
  unitPrice?: number;
  basePrice?: number;
  lineTotal?: number;
  variantId?: string;
  variantLabel?: string;
  variant?: { id?: string; _id?: string; label?: string };
  productVariant?: { id?: string; _id?: string; label?: string };
  product?: CartApiProduct;
  name?: string;
  slug?: string;
  image?: string;
  productImage?: string;
  price?: number;
}

export interface CartApiResponse {
  items?: CartApiItem[];
  subtotal?: number;
  total?: number;
  cart?: {
    items?: CartApiItem[];
    subtotal?: number;
    total?: number;
  };
}

export interface WishlistApiProduct {
  _id?: string;
  id?: string;
  slug?: string;
  name?: string;
  images?: string[];
  image?: string;
  basePrice?: number;
  discountPrice?: number;
}

export interface WishlistApiItem {
  _id?: string;
  id?: string;
  productId?: string;
  product?: WishlistApiProduct;
  name?: string;
  slug?: string;
  image?: string;
  price?: number;
}

export interface WishlistApiResponse {
  items?: WishlistApiItem[];
  wishlist?: {
    items?: WishlistApiItem[];
  };
}
