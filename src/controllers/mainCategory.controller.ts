import { Request, Response } from "express";
import MainCategory from "../models/MainCategory";
import { uploadImageToCloudinary } from "../utils/cloudinaryUpload";

const getImageUrl = async (req: Request) => {
  if (!req.file) {
    return undefined;
  }

  return uploadImageToCloudinary(req.file, "main-categories");
};

export const getMainCategories = async (req: Request, res: Response) => {
  try {
    const filter =
      req.query.includeInactive === "true" ? {} : { isActive: true };

    const mainCategories = await MainCategory.find(filter).sort({
      displayOrder: 1,
      createdAt: -1,
    });

    res.json(mainCategories);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getMainCategory = async (req: Request, res: Response) => {
  try {
    const mainCategory = await MainCategory.findById(req.params.id);

    if (!mainCategory) {
      return res.status(404).json({ message: "Main category not found" });
    }

    res.json(mainCategory);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getMainCategoryBySlug = async (req: Request, res: Response) => {
  try {
    const mainCategory = await MainCategory.findOne({ slug: req.params.slug });

    if (!mainCategory) {
      return res.status(404).json({ message: "Main category not found" });
    }

    res.json(mainCategory);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const createMainCategory = async (req: Request, res: Response) => {
  try {
    const image = await getImageUrl(req);
    const payload = image ? { ...req.body, image } : req.body;

    const mainCategory = new MainCategory(payload);
    const createdMainCategory = await mainCategory.save();
    res.status(201).json(createdMainCategory);
  } catch (error: any) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Main category name or slug already exists" });
    }

    res.status(500).json({ message: "Server error", error });
  }
};

export const updateMainCategory = async (req: Request, res: Response) => {
  try {
    const mainCategory = await MainCategory.findById(req.params.id);

    if (!mainCategory) {
      return res.status(404).json({ message: "Main category not found" });
    }

    const image = await getImageUrl(req);
    const payload = image ? { ...req.body, image } : req.body;

    const updatedMainCategory = await MainCategory.findByIdAndUpdate(
      req.params.id,
      payload,
      { returnDocument: "after", runValidators: true },
    );

    res.json(updatedMainCategory);
  } catch (error: any) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Main category name or slug already exists" });
    }

    res.status(500).json({ message: "Server error", error });
  }
};

export const deleteMainCategory = async (req: Request, res: Response) => {
  try {
    const mainCategory = await MainCategory.findById(req.params.id);

    if (!mainCategory) {
      return res.status(404).json({ message: "Main category not found" });
    }

    await MainCategory.findByIdAndDelete(req.params.id);

    res.json({ message: "Main category removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
