import api, { resolveApiAssetUrl } from "@/lib/api";
import type {
  CheckoutSummaryRequest,
  CheckoutSummaryResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  Order,
  OrderItem,
  PackageDetails,
  PaymentMethod,
  PromoCode,
  PromoCodeForm,
  StoreSettings,
  ShippingQuoteRequest,
  ShippingQuoteResponse,
  ShippingAddress,
  VerifyPaymentRequest,
} from "@/types/commerce";

const toTitleCase = (value?: string): string => {
  if (!value) return "";
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

type EntityRef = string | { _id?: string; name?: string; code?: string } | null | undefined;

type RawOrderItem = {
  product?: {
    _id?: string;
    name?: string;
    images?: string[];
  } | string | null;
  productId?: string;
  name?: string;
  image?: string;
  quantity?: number;
  unitPrice?: number;
  price?: number;
  total?: number;
  lineTotal?: number;
  variantId?: string;
  variantLabel?: string;
};

type RawOrder = {
  _id?: string;
  orderNumber?: string;
  items?: RawOrderItem[];
  subtotal?: number;
  discount?: number;
  shippingFee?: number;
  total?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: string;
  orderStatus?: string;
  shippingAddress?: Partial<ShippingAddress>;
  promoCode?: EntityRef;
  packageDetails?: Partial<PackageDetails>;
  createdAt?: string;
  user?: {
    _id?: string;
    name?: string;
    email?: string;
  };
};

type RawPromoCode = {
  _id?: string;
  code?: string;
  description?: string;
  type?: "percentage" | "fixed";
  value?: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  startsAt?: string;
  expiresAt?: string;
  isActive?: boolean;
  applicableProducts?: EntityRef[];
  applicableCategories?: EntityRef[];
  excludedProducts?: EntityRef[];
  createdAt?: string;
};

type RawCheckoutSummary = {
  items?: CheckoutSummaryResponse["items"];
  subtotal?: number;
  discount?: number;
  discountAmount?: number;
  shippingFee?: number;
  shipping?: number;
  total?: number;
  promoCode?: string;
  message?: string;
  summary?: RawCheckoutSummary;
  data?: RawCheckoutSummary;
  pricing?: {
    subtotal?: number;
    discount?: number;
    discountAmount?: number;
    shippingFee?: number;
    shipping?: number;
    total?: number;
  };
  totals?: {
    subtotal?: number;
    discount?: number;
    discountAmount?: number;
    shippingFee?: number;
    shipping?: number;
    total?: number;
  };
  amounts?: {
    subtotal?: number;
    discount?: number;
    discountAmount?: number;
    shippingFee?: number;
    shipping?: number;
    total?: number;
  };
};

const getEntityId = (value: EntityRef): string => {
  if (!value) return "";
  return typeof value === "string" ? value : value._id || "";
};

const getEntityCode = (value: EntityRef): string => {
  if (!value) return "";
  return typeof value === "string" ? value : value.code || value.name || "";
};

const pickNumber = (...values: Array<number | undefined | null>): number => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return 0;
};

const normalizeOrderItem = (item: RawOrderItem): OrderItem => {
  const product =
    item.product && typeof item.product !== "string" ? item.product : null;
  const quantity = item.quantity || 0;
  const unitPrice = item.unitPrice ?? item.price ?? 0;

  return {
    productId: item.productId || getEntityId(item.product) || "",
    name: item.name || product?.name || "Product",
    image: resolveApiAssetUrl(item.image || product?.images?.[0] || ""),
    quantity,
    unitPrice,
    lineTotal: item.lineTotal ?? item.total ?? unitPrice * quantity,
    variantId: item.variantId,
    variantLabel: item.variantLabel,
  };
};

const isRawOrder = (value: unknown): value is RawOrder => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate._id === "string" ||
    typeof candidate.orderNumber === "string" ||
    Array.isArray(candidate.items)
  );
};

const extractRawOrder = (value: unknown): RawOrder | null => {
  if (isRawOrder(value)) return value;
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const nestedCandidates = [record.order, record.data];

  for (const candidate of nestedCandidates) {
    if (isRawOrder(candidate)) return candidate;
    if (
      candidate &&
      typeof candidate === "object" &&
      "order" in candidate &&
      isRawOrder((candidate as Record<string, unknown>).order)
    ) {
      return (candidate as { order: RawOrder }).order;
    }
  }

  return null;
};

export const normalizeOrder = (order: RawOrder): Order => ({
  _id: order._id || "",
  orderNumber: order.orderNumber || order._id || "",
  items: (order.items || []).map(normalizeOrderItem),
  subtotal: order.subtotal || 0,
  discount: order.discount || 0,
  shippingFee: order.shippingFee || 0,
  total: order.total || 0,
  paymentMethod: order.paymentMethod || "cod",
  paymentStatus: order.paymentStatus || "pending",
  orderStatus: order.orderStatus || "pending",
  shippingAddress: {
    fullName: order.shippingAddress?.fullName || "",
    email: order.shippingAddress?.email || "",
    phone: order.shippingAddress?.phone || "",
    line1: order.shippingAddress?.line1 || "",
    line2: order.shippingAddress?.line2 || "",
    city: order.shippingAddress?.city || "",
    state: order.shippingAddress?.state || "",
    postalCode: order.shippingAddress?.postalCode || "",
    country: order.shippingAddress?.country || "",
  },
  promoCode: getEntityCode(order.promoCode) || undefined,
  packageDetails: order.packageDetails
    ? {
        weight: pickNumber(order.packageDetails.weight),
        length: pickNumber(order.packageDetails.length),
        breadth: pickNumber(order.packageDetails.breadth),
        height: pickNumber(order.packageDetails.height),
      }
    : undefined,
  createdAt: order.createdAt,
  user: order.user,
});

export const normalizePromoCode = (promoCode: RawPromoCode): PromoCode => ({
  _id: promoCode._id || "",
  code: promoCode.code || "",
  description: promoCode.description || "",
  type: promoCode.type || "percentage",
  value: promoCode.value || 0,
  minOrderAmount: promoCode.minOrderAmount || 0,
  maxDiscount: promoCode.maxDiscount || 0,
  usageLimit: promoCode.usageLimit || 0,
  perUserLimit: promoCode.perUserLimit || 0,
  startsAt: promoCode.startsAt,
  expiresAt: promoCode.expiresAt,
  isActive: promoCode.isActive ?? true,
  applicableProducts: (promoCode.applicableProducts || []).map(getEntityId).filter(Boolean),
  applicableCategories: (promoCode.applicableCategories || []).map(getEntityId).filter(Boolean),
  excludedProducts: (promoCode.excludedProducts || []).map(getEntityId).filter(Boolean),
  createdAt: promoCode.createdAt,
});

export const getCheckoutSummary = async (
  payload: CheckoutSummaryRequest,
): Promise<CheckoutSummaryResponse> => {
  const response = await api.post("/checkout/summary", payload);
  const raw = response.data as RawCheckoutSummary;
  const summary = raw.summary || raw.data || raw;
  const totals = summary.pricing || summary.totals || summary.amounts || {};

  return {
    items: summary.items || payload.items,
    subtotal: pickNumber(summary.subtotal, totals.subtotal),
    discount: pickNumber(
      summary.discount,
      summary.discountAmount,
      totals.discount,
      totals.discountAmount,
    ),
    shippingFee: pickNumber(
      summary.shippingFee,
      summary.shipping,
      totals.shippingFee,
      totals.shipping,
    ),
    total: pickNumber(summary.total, totals.total),
    promoCode: summary.promoCode || payload.promoCode,
    message: summary.message,
  };
};

export const getShippingQuote = async (
  payload: ShippingQuoteRequest,
): Promise<ShippingQuoteResponse> => {
  const response = await api.post("/shipping/quote", payload);
  return response.data as ShippingQuoteResponse;
};

export const getStoreSettings = async (): Promise<StoreSettings> => {
  const response = await api.get("/settings");
  return response.data as StoreSettings;
};

export const updateStoreSettings = async (
  payload: Partial<StoreSettings>,
): Promise<StoreSettings> => {
  const response = await api.patch("/settings/admin", payload);
  return response.data as StoreSettings;
};

export const createOrder = async (
  payload: CreateOrderRequest,
): Promise<CreateOrderResponse> => {
  const response = await api.post("/orders", payload);
  const rawOrder = extractRawOrder(response.data);

  if (!rawOrder) {
    throw new Error("Order response is invalid.");
  }

  const order = normalizeOrder(rawOrder);

  return {
    order,
    razorpay: response.data.razorpay
      ? {
          keyId: response.data.razorpay.keyId || "",
          orderId: response.data.razorpay.orderId || "",
          amount: response.data.razorpay.amount || 0,
          currency: response.data.razorpay.currency || "INR",
        }
      : undefined,
  };
};

export const verifyOrderPayment = async (
  id: string,
  payload: VerifyPaymentRequest,
): Promise<Order> => {
  const response = await api.post(`/orders/${id}/verify-payment`, payload);
  const rawOrder = extractRawOrder(response.data);

  if (!rawOrder) {
    throw new Error("Payment verification response is invalid.");
  }

  return normalizeOrder(rawOrder);
};

export const getMyOrders = async (): Promise<Order[]> => {
  const response = await api.get("/orders/my-orders");
  const orders: RawOrder[] = response.data.orders || response.data || [];
  return orders.map(normalizeOrder);
};

export const getOrderById = async (id: string): Promise<Order> => {
  const response = await api.get(`/orders/${id}`);
  return normalizeOrder(response.data.order || response.data);
};

export const getAdminOrders = async (): Promise<Order[]> => {
  const response = await api.get("/orders");
  const orders: RawOrder[] = response.data.orders || response.data || [];
  return orders.map(normalizeOrder);
};

export const updateOrderStatus = async (
  id: string,
  payload: { orderStatus?: string; paymentStatus?: string },
): Promise<Order> => {
  const response = await api.put(`/orders/${id}/status`, payload);
  return normalizeOrder(response.data.order || response.data);
};

export const getPromoCodes = async (): Promise<PromoCode[]> => {
  const response = await api.get("/promocodes");
  const promoCodes: RawPromoCode[] = response.data.promocodes || response.data || [];
  return promoCodes.map(normalizePromoCode);
};

export const getPromoCodeById = async (id: string): Promise<PromoCode> => {
  const response = await api.get(`/promocodes/${id}`);
  return normalizePromoCode(response.data.promocode || response.data);
};

const buildPromoCodePayload = (form: PromoCodeForm) => ({
  code: form.code.trim().toUpperCase(),
  description: form.description.trim(),
  type: form.type,
  value: Number(form.value) || 0,
  minOrderAmount: Number(form.minOrderAmount) || 0,
  maxDiscount: Number(form.maxDiscount) || 0,
  usageLimit: Number(form.usageLimit) || 0,
  perUserLimit: Number(form.perUserLimit) || 0,
  startsAt: form.startsAt || undefined,
  expiresAt: form.expiresAt || undefined,
  isActive: form.isActive,
  applicableProducts: form.applicableProducts,
  applicableCategories: form.applicableCategories,
  excludedProducts: form.excludedProducts,
});

export const createPromoCode = async (form: PromoCodeForm): Promise<PromoCode> => {
  const response = await api.post("/promocodes", buildPromoCodePayload(form));
  return normalizePromoCode(response.data.promocode || response.data);
};

export const updatePromoCode = async (
  id: string,
  form: PromoCodeForm,
): Promise<PromoCode> => {
  const response = await api.put(`/promocodes/${id}`, buildPromoCodePayload(form));
  return normalizePromoCode(response.data.promocode || response.data);
};

export const deletePromoCode = async (id: string): Promise<void> => {
  await api.delete(`/promocodes/${id}`);
};

export const formatStatusLabel = (value?: string): string => {
  if (!value) return "";
  if (value === "cod_pending") return "Pending";
  return toTitleCase(value);
};

export const getPaymentStatusTone = (value?: string): string => {
  switch (value) {
    case "paid":
      return "bg-emerald-50 text-black";
    case "pending":
    case "cod_pending":
      return "bg-amber-50 text-black";
    case "failed":
      return "bg-red-50 text-black";
    case "refunded":
      return "bg-slate-100 text-black";
    default:
      return "bg-gray-100 text-black";
  }
};

export const getOrderStatusTone = (value?: string): string => {
  switch (value) {
    case "delivered":
      return "bg-emerald-50 text-black";
    case "shipped":
      return "bg-blue-50 text-black";
    case "processing":
    case "confirmed":
      return "bg-violet-50 text-black";
    case "pending":
      return "bg-amber-50 text-black";
    case "cancelled":
      return "bg-red-50 text-black";
    default:
      return "bg-gray-100 text-black";
  }
};

