import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { buildCheckoutSummary, CheckoutError } from "../utils/checkout";
import { computePackageDetails, getDefaultPackageDetails } from "../utils/packing";
import { getStoreSettings } from "../utils/settings";

type QuoteResult = {
  shippingFee: number;
  packageDetails: {
    weight: number;
    length: number;
    breadth: number;
    height: number;
  };
  declaredValue: number;
  freeShippingApplied?: boolean;
  freeShippingMinAmount?: number;
  serviceable: boolean;
  message?: string;
};

// @desc    Get a flat shipping quote (free above the store's threshold)
// @route   POST /api/shipping/quote
// @access  Private
export const getShippingQuote = async (req: AuthRequest, res: Response) => {
  try {
    const paymentMethod = req.body.paymentMethod === "online" ? "online" : "cod";
    const storeSettings = await getStoreSettings();

    if (paymentMethod === "cod" && !storeSettings.codEnabled) {
      return res.status(400).json({
        message: "Cash on delivery is currently unavailable.",
      });
    }

    const summary = await buildCheckoutSummary({
      items: req.body.items || [],
      promoCode: req.body.promoCode,
      userId: req.user.id,
      shippingFee: 0,
      freeShipping: {
        enabled: storeSettings.freeShippingEnabled,
        minAmount: storeSettings.freeShippingMinAmount,
      },
    });

    const defaults = getDefaultPackageDetails();
    const packageDetails = computePackageDetails(summary.items, defaults);
    const declaredValue = Math.max(0, summary.subtotal - summary.discount);

    const freeShippingApplied =
      storeSettings.freeShippingEnabled &&
      storeSettings.freeShippingMinAmount > 0 &&
      summary.subtotal >= storeSettings.freeShippingMinAmount;

    const result: QuoteResult = {
      shippingFee: freeShippingApplied ? 0 : storeSettings.flatShippingFee,
      packageDetails,
      declaredValue,
      freeShippingApplied,
      freeShippingMinAmount: storeSettings.freeShippingMinAmount,
      serviceable: true,
    };

    return res.json(result);
  } catch (error) {
    if (error instanceof CheckoutError) {
      return res.status(error.status).json({ message: error.message });
    }

    return res.status(500).json({ message: "Failed to fetch shipping quote." });
  }
};
