import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { buildCheckoutSummary, CheckoutError } from "../utils/checkout";
import { getStoreSettings } from "../utils/settings";

export const getCheckoutSummary = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await getStoreSettings();
    const summary = await buildCheckoutSummary({
      items: req.body.items || [],
      promoCode: req.body.promoCode,
      userId: req.user.id,
      shippingFee: Number(req.body.shippingFee) || 0,
      freeShipping: {
        enabled: settings.freeShippingEnabled,
        minAmount: settings.freeShippingMinAmount,
      },
    });

    res.json({
      items: summary.items,
      pricing: {
        subtotal: summary.subtotal,
        discount: summary.discount,
        shippingFee: summary.shippingFee,
        total: summary.total,
      },
      promoCode: summary.promoCode
        ? {
            id: summary.promoCode._id,
            code: summary.promoCode.code,
            type: summary.promoCode.type,
            value: summary.promoCode.value,
          }
        : null,
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return res.status(error.status).json({ message: error.message });
    }

    res.status(500).json({ message: "Server error", error });
  }
};
