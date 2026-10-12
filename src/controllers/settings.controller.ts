import { Request, Response } from "express";
import { getStoreSettings, updateStoreSettings } from "../utils/settings";

export const getPublicSettings = async (_req: Request, res: Response) => {
  try {
    const settings = await getStoreSettings();
    res.json({
      codEnabled: settings.codEnabled,
      freeShippingEnabled: settings.freeShippingEnabled,
      freeShippingMinAmount: settings.freeShippingMinAmount,
      flatShippingFee: settings.flatShippingFee,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load settings." });
  }
};

export const getAdminSettings = async (_req: Request, res: Response) => {
  try {
    const settings = await getStoreSettings();
    res.json({
      codEnabled: settings.codEnabled,
      freeShippingEnabled: settings.freeShippingEnabled,
      freeShippingMinAmount: settings.freeShippingMinAmount,
      flatShippingFee: settings.flatShippingFee,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load settings." });
  }
};

export const updateAdminSettings = async (req: Request, res: Response) => {
  try {
    const codEnabled =
      typeof req.body.codEnabled === "boolean"
        ? req.body.codEnabled
        : undefined;
    const freeShippingEnabled =
      typeof req.body.freeShippingEnabled === "boolean"
        ? req.body.freeShippingEnabled
        : undefined;
    const freeShippingMinAmount =
      req.body.freeShippingMinAmount === undefined ||
      req.body.freeShippingMinAmount === null
        ? undefined
        : Number(req.body.freeShippingMinAmount);
    const flatShippingFee =
      req.body.flatShippingFee === undefined || req.body.flatShippingFee === null
        ? undefined
        : Number(req.body.flatShippingFee);

    if (
      codEnabled === undefined &&
      freeShippingEnabled === undefined &&
      freeShippingMinAmount === undefined &&
      flatShippingFee === undefined
    ) {
      return res.status(400).json({
        message: "At least one setting value is required.",
      });
    }

    if (
      freeShippingMinAmount !== undefined &&
      (!Number.isFinite(freeShippingMinAmount) || freeShippingMinAmount < 0)
    ) {
      return res
        .status(400)
        .json({ message: "freeShippingMinAmount must be a positive number." });
    }

    if (
      flatShippingFee !== undefined &&
      (!Number.isFinite(flatShippingFee) || flatShippingFee < 0)
    ) {
      return res
        .status(400)
        .json({ message: "flatShippingFee must be a positive number." });
    }

    const current = await getStoreSettings();
    const nextFreeShippingEnabled =
      freeShippingEnabled ?? current.freeShippingEnabled;
    const nextFreeShippingMinAmount =
      freeShippingMinAmount ?? current.freeShippingMinAmount;

    if (nextFreeShippingEnabled && nextFreeShippingMinAmount <= 0) {
      return res.status(400).json({
        message: "Set a minimum amount greater than 0 for free shipping.",
      });
    }

    const updated = await updateStoreSettings({
      codEnabled,
      freeShippingEnabled,
      freeShippingMinAmount,
      flatShippingFee,
    });
    res.json({
      codEnabled: updated.codEnabled,
      freeShippingEnabled: updated.freeShippingEnabled,
      freeShippingMinAmount: updated.freeShippingMinAmount,
      flatShippingFee: updated.flatShippingFee,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update settings." });
  }
};
