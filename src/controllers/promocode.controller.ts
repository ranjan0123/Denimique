import { Request, Response } from "express";
import PromoCode from "../models/PromoCode";
import { AuthRequest } from "../middleware/auth.middleware";
import { sanitizePromoCode } from "../utils/checkout";

const normalizePromoPayload = (body: Record<string, any>) => ({
  ...body,
  code: sanitizePromoCode(body.code),
});

export const getPromoCodes = async (_req: Request, res: Response) => {
  try {
    const promoCodes = await PromoCode.find()
      .populate("applicableProducts", "name slug")
      .populate("applicableCategories", "name slug")
      .populate("excludedProducts", "name slug")
      .sort({ createdAt: -1 });

    res.json(promoCodes);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getPromoCode = async (req: Request, res: Response) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id)
      .populate("applicableProducts", "name slug")
      .populate("applicableCategories", "name slug")
      .populate("excludedProducts", "name slug");

    if (!promoCode) {
      return res.status(404).json({ message: "Promo code not found" });
    }

    res.json(promoCode);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const createPromoCode = async (req: AuthRequest, res: Response) => {
  try {
    const payload = normalizePromoPayload(req.body);
    const promoCode = new PromoCode({
      ...payload,
      createdBy: req.user?.id,
    });
    const createdPromoCode = await promoCode.save();
    res.status(201).json(createdPromoCode);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Promo code already exists" });
    }

    res.status(500).json({ message: "Server error", error });
  }
};

export const updatePromoCode = async (req: Request, res: Response) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);

    if (!promoCode) {
      return res.status(404).json({ message: "Promo code not found" });
    }

    const payload = normalizePromoPayload(req.body);
    const updatedPromoCode = await PromoCode.findByIdAndUpdate(
      req.params.id,
      payload,
      { returnDocument: "after", runValidators: true },
    );

    res.json(updatedPromoCode);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Promo code already exists" });
    }

    res.status(500).json({ message: "Server error", error });
  }
};

export const deletePromoCode = async (req: Request, res: Response) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);

    if (!promoCode) {
      return res.status(404).json({ message: "Promo code not found" });
    }

    await PromoCode.findByIdAndDelete(req.params.id);

    res.json({ message: "Promo code removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
