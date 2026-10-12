import mongoose from "mongoose";
import Order from "../models/Order";
import Product from "../models/Product";
import PromoCode, { IPromoCode } from "../models/PromoCode";

export interface CheckoutItemInput {
  productId: string;
  quantity: number;
  variantId?: string;
}

export interface ShippingAddressInput {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ResolvedCheckoutItem {
  product: mongoose.Types.ObjectId;
  productId: string;
  slug: string;
  name: string;
  image?: string;
  flavor?: string;
  variantId?: string;
  variantLabel?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  category: mongoose.Types.ObjectId;
  weightKg?: number;
  lengthCm?: number;
  breadthCm?: number;
  heightCm?: number;
}

export interface CheckoutSummary {
  items: ResolvedCheckoutItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  promoCode: IPromoCode | null;
  promoCodeSnapshot?: string;
}

export class CheckoutError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

export const sanitizePromoCode = (code?: string) => code?.trim().toUpperCase();

const getPromoEligibility = (
  promoCode: IPromoCode,
  item: ResolvedCheckoutItem,
) => {
  const applicableProducts = promoCode.applicableProducts.map((id) =>
    id.toString(),
  );
  const applicableCategories = promoCode.applicableCategories.map((id) =>
    id.toString(),
  );
  const excludedProducts = promoCode.excludedProducts.map((id) => id.toString());

  if (excludedProducts.includes(item.product.toString())) {
    return false;
  }

  if (applicableProducts.length === 0 && applicableCategories.length === 0) {
    return true;
  }

  if (applicableProducts.includes(item.product.toString())) {
    return true;
  }

  if (applicableCategories.includes(item.category.toString())) {
    return true;
  }

  return false;
};

export const buildCheckoutSummary = async ({
  items,
  promoCode: rawPromoCode,
  userId,
  shippingFee = 0,
  freeShipping,
  session,
}: {
  items: CheckoutItemInput[];
  promoCode?: string;
  userId: string;
  shippingFee?: number;
  freeShipping?: {
    enabled: boolean;
    minAmount: number;
  };
  session?: mongoose.ClientSession;
}): Promise<CheckoutSummary> => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new CheckoutError("At least one item is required");
  }

  const normalizedItems = items.map((item) => ({
    productId: item.productId,
    quantity: Number(item.quantity),
    variantId: item.variantId,
  }));

  for (const item of normalizedItems) {
    if (!item.productId || typeof item.productId !== "string") {
      throw new CheckoutError(`Invalid product ID: ${item.productId}`);
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new CheckoutError("Quantity must be a positive integer");
    }
  }

  const productIds = normalizedItems.map((item) => item.productId);
  
  // Query products using both MongoDB _id (for ObjectIds) and custom id field (for slug-like IDs)

  const products = await Product.find({
    $or: [
      { _id: { $in: productIds.filter((id) => mongoose.Types.ObjectId.isValid(id)) } },
      { id: { $in: productIds } },
    ],
  })
    .session(session || null)
    .lean();

  // Build map using both _id and custom id for lookup
  
  const productMap = new Map<string, any>();
  products.forEach((product) => {
    productMap.set(product._id.toString(), product);
    if (product.id) {
      productMap.set(product.id, product);
    }
  });

  if (productMap.size === 0) {
    throw new CheckoutError("One or more products were not found", 404);
  }

  const resolvedItems: ResolvedCheckoutItem[] = normalizedItems.map((item) => {
    const product = productMap.get(item.productId);

    if (!product) {
      throw new CheckoutError(`Product not found: ${item.productId}`, 404);
    }

    const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
    const selectedVariant = hasVariants
      ? product.variants.find((variant: any) => variant.id === item.variantId) ||
        (product.variants.length === 1 ? product.variants[0] : undefined)
      : undefined;

    if (hasVariants && !selectedVariant) {
      throw new CheckoutError(
        `Variant selection is required for ${product.name}`,
      );
    }

    if (selectedVariant && selectedVariant.stock < item.quantity) {
      throw new CheckoutError(
        `Insufficient stock for ${product.name} (${selectedVariant.label})`,
      );
    }

    const unitPrice = selectedVariant?.price ?? product.discountPrice;
    const lineTotal = roundCurrency(unitPrice * item.quantity);

    return {
      product: product._id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images?.[0],
      flavor: product.flavor,
      variantId: selectedVariant?.id,
      variantLabel: selectedVariant?.label,
      unitPrice,
      quantity: item.quantity,
      lineTotal,
      category: product.category,
      weightKg: product.weightKg,
      lengthCm: product.lengthCm,
      breadthCm: product.breadthCm,
      heightCm: product.heightCm,
    };
  });

  const subtotal = roundCurrency(
    resolvedItems.reduce((sum, item) => sum + item.lineTotal, 0),
  );

  let appliedPromoCode: IPromoCode | null = null;
  let discount = 0;

  const promoCodeValue = sanitizePromoCode(rawPromoCode);
  if (promoCodeValue) {
    const promoCode = await PromoCode.findOne({ code: promoCodeValue }).session(
      session || null,
    );

    if (!promoCode) {
      throw new CheckoutError("Promo code not found", 404);
    }

    if (!promoCode.isActive) {
      throw new CheckoutError("Promo code is inactive");
    }

    const now = new Date();
    if (promoCode.startsAt && promoCode.startsAt > now) {
      throw new CheckoutError("Promo code is not active yet");
    }

    if (promoCode.expiresAt && promoCode.expiresAt < now) {
      throw new CheckoutError("Promo code has expired");
    }

    if (
      promoCode.usageLimit !== undefined &&
      promoCode.usedCount >= promoCode.usageLimit
    ) {
      throw new CheckoutError("Promo code usage limit reached");
    }

    if (subtotal < promoCode.minOrderAmount) {
      throw new CheckoutError(
        `Minimum order amount for this promo code is ${promoCode.minOrderAmount}`,
      );
    }

    if (promoCode.perUserLimit !== undefined) {
      const usedByUser = await Order.countDocuments({
        user: userId,
        promoCode: promoCode._id,
        orderStatus: { $ne: "cancelled" },
      }).session(session || null);

      if (usedByUser >= promoCode.perUserLimit) {
        throw new CheckoutError("Promo code usage limit reached for this user");
      }
    }

    const eligibleSubtotal = roundCurrency(
      resolvedItems
        .filter((item) => getPromoEligibility(promoCode, item))
        .reduce((sum, item) => sum + item.lineTotal, 0),
    );

    if (eligibleSubtotal <= 0) {
      throw new CheckoutError("Promo code is not applicable to these products");
    }

    discount =
      promoCode.type === "percentage"
        ? roundCurrency((eligibleSubtotal * promoCode.value) / 100)
        : roundCurrency(promoCode.value);

    if (promoCode.maxDiscount !== undefined) {
      discount = Math.min(discount, promoCode.maxDiscount);
    }

    discount = Math.min(discount, eligibleSubtotal);
    appliedPromoCode = promoCode;
  }

  let resolvedShippingFee = shippingFee;

  if (
    freeShipping?.enabled &&
    Number.isFinite(freeShipping.minAmount) &&
    freeShipping.minAmount > 0 &&
    subtotal >= freeShipping.minAmount
  ) {
    resolvedShippingFee = 0;
  }

  const total = roundCurrency(subtotal - discount + resolvedShippingFee);

  return {
    items: resolvedItems,
    subtotal,
    discount,
    shippingFee: resolvedShippingFee,
    total,
    promoCode: appliedPromoCode,
    promoCodeSnapshot: appliedPromoCode?.code,
  };
};
