import mongoose from "mongoose";
import { Response } from "express";
import Order from "../models/Order";
import PromoCode from "../models/PromoCode";
import Product from "../models/Product";
import { AuthRequest } from "../middleware/auth.middleware";
import { buildCheckoutSummary, CheckoutError } from "../utils/checkout";
import { createNotification } from "../utils/notifications";
import { sendOrderReceivedEmail } from "../utils/sendEmail";
import {
  createRazorpayOrder,
  isRazorpayConfigured,
  verifyRazorpaySignature,
} from "../utils/razorpay";
import { getDefaultPackageDetails, computePackageDetails } from "../utils/packing";
import { getStoreSettings } from "../utils/settings";

const generateOrderNumber = () =>
  `SV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

const sanitizeShippingAddress = (address: Record<string, any>) => ({
  fullName: address.fullName?.trim(),
  email: address.email?.trim().toLowerCase(),
  phone: address.phone?.trim(),
  line1: address.line1?.trim(),
  line2: address.line2?.trim() || undefined,
  city: address.city?.trim(),
  state: address.state?.trim(),
  postalCode: address.postalCode?.trim(),
  country: address.country?.trim(),
});

const validateShippingAddress = (address: Record<string, any>) => {
  const requiredFields = [
    "fullName",
    "email",
    "phone",
    "line1",
    "city",
    "state",
    "postalCode",
    "country",
  ] as const;

  for (const field of requiredFields) {
    if (!address[field]) {
      throw new CheckoutError(`Shipping address field '${field}' is required`);
    }
  }
};

const validPaymentMethods = ["cod", "online"];

const notifyOrderReceived = async (order: any) => {
  try {
    await sendOrderReceivedEmail({
      orderNumber: order.orderNumber,
      total: order.total,
      subtotal: order.subtotal,
      discount: order.discount,
      shippingFee: order.shippingFee,
      paymentMethod: order.paymentMethod,
      items: order.items.map((item: any) => ({
        name: item.name,
        variantLabel: item.variantLabel,
        flavor: item.flavor,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
      shippingAddress: order.shippingAddress,
    });
  } catch (error) {
    console.error("Order received email failed:", error);
  }
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const paymentMethod = req.body.paymentMethod || "cod";
    if (!validPaymentMethods.includes(paymentMethod)) {
      throw new CheckoutError("Invalid payment method");
    }

    const storeSettings = await getStoreSettings();
    if (paymentMethod === "cod" && !storeSettings.codEnabled) {
      throw new CheckoutError("Cash on delivery is currently unavailable.");
    }

    if (paymentMethod === "online" && !isRazorpayConfigured()) {
      throw new CheckoutError("Razorpay is not configured on the server", 500);
    }

    const shippingAddress = sanitizeShippingAddress(req.body.shippingAddress || {});
    validateShippingAddress(shippingAddress);

    let createdOrder: any;
    let razorpayOrder:
      | {
          id: string;
          amount: number;
          currency: string;
          receipt: string;
          status: string;
        }
      | undefined;

    if (paymentMethod === "online") {
      const summary = await buildCheckoutSummary({
        items: req.body.items || [],
        promoCode: req.body.promoCode,
        userId: req.user.id,
        shippingFee: Number(req.body.shippingFee) || 0,
        freeShipping: {
          enabled: storeSettings.freeShippingEnabled,
          minAmount: storeSettings.freeShippingMinAmount,
        },
      });

      const receipt = generateOrderNumber();
      razorpayOrder = await createRazorpayOrder({
        amount: summary.total,
        receipt,
        notes: {
          userId: req.user.id,
          promoCode: summary.promoCodeSnapshot || "",
        },
      });
    }

    await session.withTransaction(async () => {
      const summary = await buildCheckoutSummary({
        items: req.body.items || [],
        promoCode: req.body.promoCode,
        userId: req.user.id,
        shippingFee: Number(req.body.shippingFee) || 0,
        session,
        freeShipping: {
          enabled: storeSettings.freeShippingEnabled,
          minAmount: storeSettings.freeShippingMinAmount,
        },
      });

      const packageDetails = {
        ...computePackageDetails(summary.items, getDefaultPackageDetails()),
        ...(req.body.packageDetails || {}),
      };

      for (const item of summary.items) {
        if (!item.variantId) {
          continue;
        }

        const product = await Product.findById(item.product).session(session);

        if (!product) {
          throw new CheckoutError(`Product not found: ${item.name}`, 404);
        }

        const variant = product.variants.find(
          (candidate) => candidate.id === item.variantId,
        );

        if (!variant) {
          throw new CheckoutError(`Variant not found for ${item.name}`);
        }

        if (variant.stock < item.quantity) {
          throw new CheckoutError(
            `Insufficient stock for ${item.name} (${item.variantLabel})`,
          );
        }

        variant.stock -= item.quantity;
        await product.save({ session });
      }

      const order = await Order.create(
        [
          {
            orderNumber: razorpayOrder?.receipt || generateOrderNumber(),
            user: req.user.id,
            items: summary.items.map((item) => ({
              product: item.product,
              productId: item.productId,
              slug: item.slug,
              name: item.name,
              image: item.image,
              flavor: item.flavor,
              variantId: item.variantId,
              variantLabel: item.variantLabel,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              lineTotal: item.lineTotal,
            })),
            shippingAddress,
            subtotal: summary.subtotal,
            discount: summary.discount,
            shippingFee: summary.shippingFee,
            total: summary.total,
            promoCode: summary.promoCode?._id,
            promoCodeSnapshot: summary.promoCodeSnapshot,
            paymentMethod,
            paymentStatus: "pending",
            paymentProvider: paymentMethod === "online" ? "razorpay" : undefined,
            paymentDetails: razorpayOrder
              ? {
                  razorpayOrderId: razorpayOrder.id,
                }
              : undefined,
            packageDetails,
            orderStatus: "placed",
            notes: req.body.notes,
          },
        ],
        { session },
      );

      if (summary.promoCode) {
        await PromoCode.findByIdAndUpdate(
          summary.promoCode._id,
          { $inc: { usedCount: 1 } },
          { session },
        );
      }

      createdOrder = order[0];

      // For COD orders, notify immediately. For online payments, notify only after
      // payment is verified (see verifyOrderPayment) to avoid a false "placed"
      // notification when the user cancels the payment modal.
      if (paymentMethod === "cod") {
        await createNotification({
          userId: req.user.id,
          orderId: createdOrder._id,
          type: "order_created",
          title: "Order placed successfully",
          message: `Your order ${createdOrder.orderNumber} has been placed.`,
          metadata: {
            orderNumber: createdOrder.orderNumber,
            orderStatus: createdOrder.orderStatus,
            paymentStatus: createdOrder.paymentStatus,
          },
          session,
        });
      }
    });

    const order = await Order.findById(createdOrder._id)
      .populate("promoCode", "code type value")
      .populate("user", "name email");

    // Fire-and-forget: doesn't feed the response body, and is an external
    // call (SMTP) that must never block checkout.
    void notifyOrderReceived(createdOrder);

    res.status(201).json({
      order,
      razorpay:
        razorpayOrder && process.env.RAZORPAY_KEY_ID
          ? {
              keyId: process.env.RAZORPAY_KEY_ID,
              orderId: razorpayOrder.id,
              amount: razorpayOrder.amount,
              currency: razorpayOrder.currency,
            }
          : null,
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return res.status(error.status).json({ message: error.message });
    }

    console.error("createOrder error:", error);
    res.status(500).json({ message: "Server error", error });
  } finally {
    await session.endSession();
  }
};

export const previewPackageDetails = async (req: AuthRequest, res: Response) => {
  try {
    const summary = await buildCheckoutSummary({
      items: req.body.items || [],
      promoCode: req.body.promoCode,
      userId: req.user.id,
      shippingFee: Number(req.body.shippingFee) || 0,
    });

    const defaults = getDefaultPackageDetails();
    const computed = computePackageDetails(summary.items, defaults);
    const packageDetails = {
      ...computed,
      ...(req.body.packageDetails || {}),
    };

    const missingDimensions = summary.items
      .map((item) => ({
        productId: item.productId,
        name: item.name,
        missing: {
          weightKg: !item.weightKg || item.weightKg <= 0,
          lengthCm: !item.lengthCm || item.lengthCm <= 0,
          breadthCm: !item.breadthCm || item.breadthCm <= 0,
          heightCm: !item.heightCm || item.heightCm <= 0,
        },
      }))
      .filter((item) =>
        Object.values(item.missing).some((value) => value === true),
      );

    res.json({
      items: summary.items,
      defaults,
      computed,
      packageDetails,
      missingDimensions,
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return res.status(error.status).json({ message: error.message });
    }

    res.status(500).json({ message: "Server error", error });
  }
};

export const verifyOrderPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id: orderId } = req.params;
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return res.status(400).json({
        message:
          "razorpayPaymentId, razorpayOrderId and razorpaySignature are required",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (order.paymentMethod !== "online" || order.paymentProvider !== "razorpay") {
      return res.status(400).json({ message: "This order is not a Razorpay order" });
    }

    const expectedRazorpayOrderId = order.paymentDetails?.razorpayOrderId;
    if (!expectedRazorpayOrderId || expectedRazorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({ message: "Razorpay order mismatch" });
    }

    const isValidSignature = verifyRazorpaySignature({
      orderId: expectedRazorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValidSignature) {
      order.paymentStatus = "failed";
      order.paymentDetails = {
        ...order.paymentDetails,
        razorpayPaymentId,
        razorpaySignature,
      };
      await order.save();

      return res.status(400).json({ message: "Invalid Razorpay signature" });
    }

    order.paymentStatus = "paid";
    order.paymentDetails = {
      ...order.paymentDetails,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paidAt: new Date(),
    };

    const updatedOrder = await order.save();

    await createNotification({
      userId: order.user,
      orderId: order._id,
      type: "order_created",
      title: "Order placed successfully",
      message: `Your order ${order.orderNumber} has been placed.`,
      metadata: {
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: "paid",
      },
    });

    await createNotification({
      userId: order.user,
      orderId: order._id,
      type: "payment_status_changed",
      title: "Payment received",
      message: `Payment received for order ${order.orderNumber}.`,
      metadata: {
        orderNumber: order.orderNumber,
        currentPaymentStatus: "paid",
        paymentProvider: "razorpay",
      },
    });

    res.json(updatedOrder);
  } catch (error) {
    if (error instanceof CheckoutError) {
      return res.status(error.status).json({ message: error.message });
    }

    res.status(500).json({ message: "Server error", error });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("promoCode", "code type value")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("promoCode", "code type value")
      .populate("user", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const rawOrderUser = order.user as any;
    const orderUserId = rawOrderUser?._id
      ? rawOrderUser._id.toString()
      : rawOrderUser.toString();

    if (orderUserId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getOrders = async (_req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("promoCode", "code type value")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const { orderStatus, paymentStatus } = req.body;
    const previousOrderStatus = order.orderStatus;
    const previousPaymentStatus = order.paymentStatus;

    if (orderStatus) {
      const validOrderStatuses = [
        "placed",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ];

      if (!validOrderStatuses.includes(orderStatus)) {
        return res.status(400).json({ message: "Invalid order status" });
      }

      order.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      const validPaymentStatuses = [
        "pending",
        "paid",
        "failed",
        "refunded",
        "cod_pending",
      ];

      if (!validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({ message: "Invalid payment status" });
      }

      order.paymentStatus = paymentStatus;
    }

    if (!orderStatus && !paymentStatus) {
      return res
        .status(400)
        .json({ message: "No order status or payment status provided" });
    }

    const updatedOrder = await order.save();

    if (orderStatus && orderStatus !== previousOrderStatus) {
      await createNotification({
        userId: order.user,
        orderId: order._id,
        type: "order_status_changed",
        title: "Order status updated",
        message: `Your order ${order.orderNumber} status changed from ${previousOrderStatus} to ${orderStatus}.`,
        metadata: {
          orderNumber: order.orderNumber,
          previousOrderStatus,
          currentOrderStatus: orderStatus,
        },
      });
    }

    if (paymentStatus && paymentStatus !== previousPaymentStatus) {
      await createNotification({
        userId: order.user,
        orderId: order._id,
        type: "payment_status_changed",
        title: "Payment status updated",
        message: `Your order ${order.orderNumber} payment status changed from ${previousPaymentStatus} to ${paymentStatus}.`,
        metadata: {
          orderNumber: order.orderNumber,
          previousPaymentStatus,
          currentPaymentStatus: paymentStatus,
        },
      });
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
