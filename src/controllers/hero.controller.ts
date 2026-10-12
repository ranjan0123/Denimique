import { Request, Response } from "express";
import Hero from "../models/Hero";
import { uploadImagesToCloudinary } from "../utils/cloudinaryUpload";

const parseJsonIfString = <T>(value: unknown, fallback: T): T => {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  return value as T;
};

const getUploadedImageUrls = async (req: Request) => {
  const files = req.files as
    | Express.Multer.File[]
    | Record<string, Express.Multer.File[]>
    | undefined;

  if (!files) {
    return [];
  }

  const fileList = Array.isArray(files)
    ? files
    : Object.values(files).flat();

  if (!fileList.length) {
    return [];
  }

  return uploadImagesToCloudinary(fileList, "hero");
};

// @desc    Get active hero content
// @route   GET /api/hero
// @access  Public
export const getHero = async (req: Request, res: Response) => {
  try {
    const hero = await Hero.findOne({ isActive: true }).sort({ createdAt: -1 });

    if (!hero) {
      return res.status(404).json({ message: "Hero content not found" });
    }

    res.json(hero);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Create hero content
// @route   POST /api/hero
// @access  Private/Admin
export const createHero = async (req: Request, res: Response) => {
  try {
    const uploadedImages = await getUploadedImageUrls(req);

    const heroData = {
      ...req.body,
      headlineLines: parseJsonIfString(req.body.headlineLines, []),
      trustItems: parseJsonIfString(req.body.trustItems, []),
      sliderImages:
        uploadedImages.length > 0
          ? uploadedImages
          : parseJsonIfString(req.body.sliderImages, []),
    };

    const hero = new Hero(heroData);
    const createdHero = await hero.save();
    res.status(201).json(createdHero);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update hero content
// @route   PUT /api/hero/:id
// @access  Private/Admin
export const updateHero = async (req: Request, res: Response) => {
  try {
    const hero = await Hero.findById(req.params.id);

    if (!hero) {
      return res.status(404).json({ message: "Hero content not found" });
    }

    const uploadedImages = await getUploadedImageUrls(req);

    const updateData = {
      ...req.body,
      headlineLines:
        req.body.headlineLines !== undefined
          ? parseJsonIfString(req.body.headlineLines, [])
          : undefined,
      trustItems:
        req.body.trustItems !== undefined
          ? parseJsonIfString(req.body.trustItems, [])
          : undefined,
      sliderImages:
        uploadedImages.length > 0
          ? uploadedImages
          : req.body.sliderImages !== undefined
            ? parseJsonIfString(req.body.sliderImages, [])
            : undefined,
    };

    const updatedHero = await Hero.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: "after", runValidators: true },
    );

    res.json(updatedHero);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete hero content
// @route   DELETE /api/hero/:id
// @access  Private/Admin
export const deleteHero = async (req: Request, res: Response) => {
  try {
    const hero = await Hero.findById(req.params.id);

    if (!hero) {
      return res.status(404).json({ message: "Hero content not found" });
    }

    await Hero.findByIdAndDelete(req.params.id);

    res.json({ message: "Hero content removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
