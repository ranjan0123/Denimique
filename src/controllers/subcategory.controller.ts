import { Request, Response } from "express";
import Subcategory from "../models/Subcategory";
import Category from "../models/Category";
import { uploadImageToCloudinary } from "../utils/cloudinaryUpload";

const getImageUrl = async (req: Request) => {
  if (!req.file) {
    return undefined;
  }

  return uploadImageToCloudinary(req.file, "subcategories");
};

// @desc    Get all subcategories
// @route   GET /api/subcategories
// @access  Public
export const getSubcategories = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    let filter: any = { isActive: true };

    if (category) {
      filter.category = category;
    }

    const subcategories = await Subcategory.find(filter)
      .populate({
        path: "category",
        select: "name slug mainCategory",
        populate: {
          path: "mainCategory",
          select: "name slug",
        },
      })
      .sort({ displayOrder: 1, createdAt: -1 });

    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Get single subcategory
// @route   GET /api/subcategories/:id
// @access  Public
export const getSubcategory = async (req: Request, res: Response) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id).populate(
      {
        path: "category",
        select: "name slug mainCategory",
        populate: {
          path: "mainCategory",
          select: "name slug",
        },
      },
    );

    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    res.json(subcategory);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Get subcategory by slug
// @route   GET /api/subcategories/slug/:slug
// @access  Public
export const getSubcategoryBySlug = async (req: Request, res: Response) => {
  try {
    const subcategory = await Subcategory.findOne({
      slug: req.params.slug,
    }).populate({
      path: "category",
      select: "name slug mainCategory",
      populate: {
        path: "mainCategory",
        select: "name slug",
      },
    });

    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    res.json(subcategory);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Create a subcategory
// @route   POST /api/subcategories
// @access  Private/Admin
export const createSubcategory = async (req: Request, res: Response) => {
  try {
    const categoryExists = await Category.findById(req.body.category);

    if (!categoryExists) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const image = await getImageUrl(req);
    const payload = image ? { ...req.body, image } : req.body;

    const subcategory = new Subcategory(payload);
    const createdSubcategory = await subcategory.save();
    await createdSubcategory.populate({
      path: "category",
      select: "name slug mainCategory",
      populate: {
        path: "mainCategory",
        select: "name slug",
      },
    });
    res.status(201).json(createdSubcategory);
  } catch (error: any) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Subcategory slug already exists in this category" });
    }
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Update a subcategory
// @route   PUT /api/subcategories/:id
// @access  Private/Admin
export const updateSubcategory = async (req: Request, res: Response) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id);

    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    if (req.body.category) {
      const categoryExists = await Category.findById(req.body.category);

      if (!categoryExists) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
    }

    const image = await getImageUrl(req);
    const payload = image ? { ...req.body, image } : req.body;

    const updatedSubcategory = await Subcategory.findByIdAndUpdate(
      req.params.id,
      payload,
      { returnDocument: "after", runValidators: true },
    ).populate({
      path: "category",
      select: "name slug mainCategory",
      populate: {
        path: "mainCategory",
        select: "name slug",
      },
    });

    res.json(updatedSubcategory);
  } catch (error: any) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Subcategory slug already exists in this category" });
    }
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Delete a subcategory
// @route   DELETE /api/subcategories/:id
// @access  Private/Admin
export const deleteSubcategory = async (req: Request, res: Response) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id);

    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    await Subcategory.findByIdAndDelete(req.params.id);

    res.json({ message: "Subcategory removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Get subcategories by category
// @route   GET /api/categories/:categoryId/subcategories
// @access  Public
export const getSubcategoriesByCategory = async (
  req: Request,
  res: Response,
) => {
  try {
    const subcategories = await Subcategory.find({
      category: req.params.categoryId,
      isActive: true,
    }).sort({ displayOrder: 1, createdAt: -1 });

    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
