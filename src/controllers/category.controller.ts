import { Request, Response } from "express";
import Category from "../models/Category";
import MainCategory from "../models/MainCategory";
import Subcategory from "../models/Subcategory";
import { uploadImageToCloudinary } from "../utils/cloudinaryUpload";

const getImageUrl = async (req: Request) => {
  if (!req.file) {
    return undefined;
  }

  return uploadImageToCloudinary(req.file, "categories");
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req: Request, res: Response) => {
  try {
    const filter: Record<string, any> =
      req.query.includeInactive === "true" ? {} : { isActive: true };

    if (req.query.mainCategory) {
      filter.mainCategory = req.query.mainCategory;
    }

    const categories = await Category.find(filter)
      .populate("mainCategory", "name slug")
      .sort({
      displayOrder: 1,
      createdAt: -1,
    });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
export const getCategory = async (req: Request, res: Response) => {
  try {
    const category = await Category.findById(req.params.id).populate(
      "mainCategory",
      "name slug",
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Get category by slug
// @route   GET /api/categories/slug/:slug
// @access  Public
export const getCategoryBySlug = async (req: Request, res: Response) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug }).populate(
      "mainCategory",
      "name slug",
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req: Request, res: Response) => {
  try {
    const mainCategoryExists = await MainCategory.findById(req.body.mainCategory);

    if (!mainCategoryExists) {
      return res.status(400).json({ message: "Invalid main category ID" });
    }

    const image = await getImageUrl(req);
    const payload = image ? { ...req.body, image } : req.body;

    const category = new Category(payload);
    const createdCategory = await category.save();
    await createdCategory.populate("mainCategory", "name slug");
    res.status(201).json(createdCategory);
  } catch (error: any) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Category name or slug already exists" });
    }
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (req.body.mainCategory) {
      const mainCategoryExists = await MainCategory.findById(
        req.body.mainCategory,
      );

      if (!mainCategoryExists) {
        return res.status(400).json({ message: "Invalid main category ID" });
      }
    }

    const image = await getImageUrl(req);
    const payload = image ? { ...req.body, image } : req.body;

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      payload,
      { returnDocument: "after", runValidators: true },
    ).populate("mainCategory", "name slug");

    res.json(updatedCategory);
  } catch (error: any) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Category name or slug already exists" });
    }
    res.status(500).json({ message: "Server error", error });
  }
};

export const getCategoryHierarchy = async (_req: Request, res: Response) => {
  try {
    const mainCategories = await MainCategory.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    const categories = await Category.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    const subcategories = await Subcategory.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    const subcategoriesByCategory = new Map<string, typeof subcategories>();
    for (const subcategory of subcategories) {
      const categoryId = subcategory.category.toString();
      const items = subcategoriesByCategory.get(categoryId) || [];
      items.push(subcategory);
      subcategoriesByCategory.set(categoryId, items);
    }

    const categoriesByMainCategory = new Map<string, any[]>();
    for (const category of categories) {
      const mainCategoryId = category.mainCategory.toString();
      const items = categoriesByMainCategory.get(mainCategoryId) || [];
      items.push({
        ...category,
        subcategories: subcategoriesByCategory.get(category._id.toString()) || [],
      });
      categoriesByMainCategory.set(mainCategoryId, items);
    }

    const hierarchy = mainCategories.map((mainCategory) => ({
      ...mainCategory,
      categories: categoriesByMainCategory.get(mainCategory._id.toString()) || [],
    }));

    res.json(hierarchy);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({ message: "Category removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
