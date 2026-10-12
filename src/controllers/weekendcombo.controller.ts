import { Request, Response } from "express";
import WeekendCombo, { IWeekendCombo } from "../models/WeekendCombo";
import { uploadImageToCloudinary } from "../utils/cloudinaryUpload";

const getUploadedImageUrl = async (req: Request) => {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) return "";
  return uploadImageToCloudinary(file, "weekend-combo");
};

// @desc    Get active weekend combo
// @route   GET /api/weekend-combo
// @access  Public
export const getActiveWeekendCombo = async (req: Request, res: Response) => {
  try {
    const combo = await WeekendCombo.findOne({
      isEnabled: true,
      "displayDuration.startDate": { $lte: new Date() },
      "displayDuration.endDate": { $gte: new Date() },
    }).sort({ createdAt: -1 });

    if (!combo) {
      return res.status(404).json({ message: "No active weekend combo" });
    }

    res.json(combo);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Create weekend combo (Admin)
// @route   POST /api/weekend-combo/admin
// @access  Private/Admin
export const createWeekendCombo = async (req: Request, res: Response) => {
  try {
    const {
      badgeText,
      title,
      highlightText,
      description,
      ctaLabel,
      ctaHref,
      stockNote,
      isEnabled,
      startDate,
      endDate,
      image: bodyImage,
    } = req.body;

    if (!badgeText || !title || !highlightText || !description) {
      return res.status(400).json({
        message: "Badge, title, highlight text, and description are required",
      });
    }

    const uploadedImage = await getUploadedImageUrl(req);
    const image = uploadedImage || bodyImage || "";

    const comboData: Partial<IWeekendCombo> = {
      badgeText,
      title,
      highlightText,
      description,
      ctaLabel: ctaLabel || "Shop Combo Now",
      ctaHref: ctaHref || "/shop",
      stockNote: stockNote || "",
      image,
      isEnabled: isEnabled ?? false,
      displayDuration: {
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate
          ? new Date(endDate)
          : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    };

    const combo = new WeekendCombo(comboData);
    const createdCombo = await combo.save();

    res.status(201).json({
      message: "Weekend combo created successfully",
      data: createdCombo,
    });
  } catch (error: any) {
    console.error("Create Weekend Combo Error:", error);
    res.status(500).json({
      message: "Failed to create weekend combo",
      error: error.message,
    });
  }
};

// @desc    Get all weekend combos (Admin)
// @route   GET /api/weekend-combo/admin
// @access  Private/Admin
export const getAllWeekendCombos = async (req: Request, res: Response) => {
  try {
    const combos = await WeekendCombo.find().sort({ createdAt: -1 });
    res.json({ data: combos });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Get weekend combo by id (Admin)
// @route   GET /api/weekend-combo/admin/:id
// @access  Private/Admin
export const getWeekendComboById = async (req: Request, res: Response) => {
  try {
    const combo = await WeekendCombo.findById(req.params.id);
    if (!combo) {
      return res.status(404).json({ message: "Weekend combo not found" });
    }
    res.json(combo);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Update weekend combo (Admin)
// @route   PUT /api/weekend-combo/admin/:id
// @access  Private/Admin
export const updateWeekendCombo = async (req: Request, res: Response) => {
  try {
    const combo = await WeekendCombo.findById(req.params.id);
    if (!combo) {
      return res.status(404).json({ message: "Weekend combo not found" });
    }

    const uploadedImage = await getUploadedImageUrl(req);
    const {
      badgeText,
      title,
      highlightText,
      description,
      ctaLabel,
      ctaHref,
      stockNote,
      isEnabled,
      startDate,
      endDate,
      image: bodyImage,
    } = req.body;

    if (badgeText !== undefined) combo.badgeText = badgeText;
    if (title !== undefined) combo.title = title;
    if (highlightText !== undefined) combo.highlightText = highlightText;
    if (description !== undefined) combo.description = description;
    if (ctaLabel !== undefined) combo.ctaLabel = ctaLabel;
    if (ctaHref !== undefined) combo.ctaHref = ctaHref;
    if (stockNote !== undefined) combo.stockNote = stockNote;
    if (isEnabled !== undefined) combo.isEnabled = isEnabled;

    if (uploadedImage) {
      combo.image = uploadedImage;
    } else if (bodyImage !== undefined) {
      combo.image = bodyImage;
    }

    if (startDate || endDate) {
      combo.displayDuration = {
        startDate: startDate
          ? new Date(startDate)
          : combo.displayDuration.startDate,
        endDate: endDate ? new Date(endDate) : combo.displayDuration.endDate,
      };
    }

    const updatedCombo = await combo.save();
    res.json({
      message: "Weekend combo updated successfully",
      data: updatedCombo,
    });
  } catch (error: any) {
    console.error("Update Weekend Combo Error:", error);
    res.status(500).json({
      message: "Failed to update weekend combo",
      error: error.message,
    });
  }
};

// @desc    Toggle weekend combo enabled status (Admin)
// @route   PATCH /api/weekend-combo/admin/:id/toggle
// @access  Private/Admin
export const toggleWeekendComboStatus = async (req: Request, res: Response) => {
  try {
    const combo = await WeekendCombo.findById(req.params.id);
    if (!combo) {
      return res.status(404).json({ message: "Weekend combo not found" });
    }

    combo.isEnabled = !combo.isEnabled;
    const updatedCombo = await combo.save();

    res.json({
      message: `Weekend combo ${updatedCombo.isEnabled ? "enabled" : "disabled"} successfully`,
      data: updatedCombo,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Delete weekend combo (Admin)
// @route   DELETE /api/weekend-combo/admin/:id
// @access  Private/Admin
export const deleteWeekendCombo = async (req: Request, res: Response) => {
  try {
    const combo = await WeekendCombo.findByIdAndDelete(req.params.id);
    if (!combo) {
      return res.status(404).json({ message: "Weekend combo not found" });
    }
    res.json({
      message: "Weekend combo deleted successfully",
      data: combo,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
