import { Request, Response } from "express";
import mongoose from "mongoose";
import Product, { IProduct } from "../models/Product";
import Category from "../models/Category";
import Subcategory from "../models/Subcategory";
import HotProduct from "../models/HotProduct";
import { uploadImagesToCloudinary } from "../utils/cloudinaryUpload";

const sanitizeStringArray = (values?: string[]) =>
  (values || [])
    .map((value) =>
      typeof value === "string"
        ? value.replace(/"/g, "").trim()
        : "",
    )
    .filter((value) => value.length > 0);

// The admin form can submit price/stock as an empty string when a field is
// left blank, which fails Mongoose's Number cast/required checks. Coerce
// those to sane numeric defaults instead of letting the save hard-fail.
const sanitizeVariants = (variants?: any[]) =>
  (variants || []).map((variant) => ({
    ...variant,
    price: Number(variant?.price) || 0,
    stock: Number(variant?.stock) || 0,
  }));

const parseOptionalNumber = (value: any) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseImageList = (value: any): string[] | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string");
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => typeof item === "string");
      }
    } catch {

      // Fall back to treating it as a single image string
      
    }

    return [trimmed];
  }

  return undefined;
};

const parseJsonField = (value: any) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed;
    } catch {
      return value;
    }
  }

  return value;
};

const sanitizeProductResponse = <T extends {
  ingredients?: string[];
  tags?: string[];
  highlights?: string[];
  careInstructions?: string[];
  sizes?: string[];
  metaKeywords?: string[];
  occasion?: string[];
}>(product: T | null) => {
  if (!product) {
    return product;
  }

  return {
    ...product,
    ingredients: sanitizeStringArray(product.ingredients),
    tags: sanitizeStringArray(product.tags),
    highlights: sanitizeStringArray(product.highlights),
    careInstructions: sanitizeStringArray(product.careInstructions),
    sizes: sanitizeStringArray(product.sizes),
    metaKeywords: sanitizeStringArray(product.metaKeywords),
    occasion: sanitizeStringArray(product.occasion),
  };
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const normalizeImageUrl = (imageUrl: string, baseUrl: string) => {
  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  if (imageUrl.startsWith("/")) {
    return `${baseUrl}${imageUrl}`;
  }

  return `${baseUrl}/${imageUrl}`;
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req: Request, res: Response) => {
  try {
    const rawPage = Number.parseInt(String(req.query.page ?? "1"), 10);
    const rawLimit = Number.parseInt(String(req.query.limit ?? "10"), 10);

    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    // The shop page currently fetches the whole catalog in one request and
    // filters/paginates client-side (see frontend/app/shop/page.tsx), so the
    // cap here has to stay above the total product count or older products
    // silently disappear once the catalog grows past it.
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 5000) : 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    const categoryValue = typeof req.query.category === "string" ? req.query.category.trim() : "";
    if (categoryValue && mongoose.Types.ObjectId.isValid(categoryValue)) {
      filter.category = new mongoose.Types.ObjectId(categoryValue);
    }

    const subcategoryValue = typeof req.query.subcategory === "string" ? req.query.subcategory.trim() : "";
    if (subcategoryValue && mongoose.Types.ObjectId.isValid(subcategoryValue)) {
      filter.subcategory = new mongoose.Types.ObjectId(subcategoryValue);
    }

    const flavorValue = typeof req.query.flavor === "string" ? req.query.flavor.trim() : "";
    if (flavorValue) {
      filter.flavor = flavorValue;
    }

    if (req.query.isBestSeller === "true") {
      filter.isBestSeller = true;
    }

    if (req.query.isFeatured === "true") {
      filter.isFeatured = true;
    }

    const searchValue = typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (searchValue) {
      const safeSearch = escapeRegExp(searchValue);
      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
        { tags: { $in: [new RegExp(safeSearch, "i")] } },
      ];
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "category",
        select: "name slug mainCategory",
        populate: {
          path: "mainCategory",
          select: "name slug",
        },
      })
      .populate("subcategory", "name slug")
      .lean();

    const total = await Product.countDocuments(filter);

    res.json({
      products: products.map((product) => sanitizeProductResponse(product)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getProducts error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProduct = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const productQuery = mongoose.Types.ObjectId.isValid(id)
      ? Product.findById(id)
      : Product.findOne({ id });
    const product = await productQuery
      .populate({
        path: "category",
        select: "name slug mainCategory",
        populate: {
          path: "mainCategory",
          select: "name slug",
        },
      })
      .populate("subcategory", "name slug")
      .lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(sanitizeProductResponse(product));
  } catch (error) {
    console.error("getProduct error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Get product by slug
// @route   GET /api/products/slug/:slug
// @access  Public

export const getProductBySlug = async (req: Request, res: Response) => {
  try {
    const slug = String(req.params.slug);
    const query: any = { slug };

    if (mongoose.Types.ObjectId.isValid(slug)) {
      query.$or = [{ slug }, { _id: slug }];
      delete query.slug;
    }

    const product = await Product.findOne(query)
      .populate({
        path: "category",
        select: "name slug mainCategory",
        populate: {
          path: "mainCategory",
          select: "name slug",
        },
      })
      .populate("subcategory", "name slug")
      .lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(sanitizeProductResponse(product));
  } catch (error) {
    console.error("getProductBySlug error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin

export const createProduct = async (req: Request, res: Response) => {
  try {
    let productData: any = {};

    // Handle FormData (multipart/form-data)

    if (req.body && typeof req.body === "object") {
      // If files are uploaded, generate URLs for them
      let uploadedImageUrls: string[] = [];
      if (req.files && (req.files as Express.Multer.File[]).length > 0) {
        const files = req.files as Express.Multer.File[];
        try {
          uploadedImageUrls = await uploadImagesToCloudinary(files, "products");
        } catch (uploadError: any) {
          console.error("Image upload failed during product creation:", uploadError);
          return res.status(502).json({
            message:
              "Image upload failed. Please try again, or contact support if this keeps happening.",
          });
        }
        console.log(
          `Uploaded ${uploadedImageUrls.length} images:`,
          uploadedImageUrls,
        );
      }

      // Parse form fields and merge with uploaded images

      productData = {
        ...req.body,
        rating: req.body.rating || 0,
        reviewCount: req.body.reviewCount || 0,
        weightKg: parseOptionalNumber(req.body.weightKg),
        lengthCm: parseOptionalNumber(req.body.lengthCm),
        breadthCm: parseOptionalNumber(req.body.breadthCm),
        heightCm: parseOptionalNumber(req.body.heightCm),
        brand: req.body.brand || "",
        gender: req.body.gender || "",
        fabric: req.body.fabric || "",
        fit: req.body.fit || "",
        material: req.body.material || "",
        pattern: req.body.pattern || "",
        color: req.body.color || "",
        seoTitle: req.body.seoTitle || "",
        seoDescription: req.body.seoDescription || "",

        // Use uploaded images if any, otherwise use images from form data
        images:
          uploadedImageUrls.length > 0
            ? uploadedImageUrls
            : req.body.images || [],

        // Handle nested objects that come as strings from FormData
        nutritionalInfo: parseJsonField(req.body.nutritionalInfo) || undefined,
        variants: sanitizeVariants(parseJsonField(req.body.variants) || []),
        ingredients: parseJsonField(req.body.ingredients) || [],
        tags: parseJsonField(req.body.tags) || [],
        sizes: parseJsonField(req.body.sizes) || [],
        careInstructions: parseJsonField(req.body.careInstructions) || [],
        highlights: parseJsonField(req.body.highlights) || [],
        occasion: parseJsonField(req.body.occasion) || [],
        metaKeywords: parseJsonField(req.body.metaKeywords) || [],
      };

      productData.ingredients = sanitizeStringArray(productData.ingredients);
      productData.tags = sanitizeStringArray(productData.tags);
      productData.sizes = sanitizeStringArray(productData.sizes);
      productData.careInstructions = sanitizeStringArray(productData.careInstructions);
      productData.highlights = sanitizeStringArray(productData.highlights);
      productData.occasion = sanitizeStringArray(productData.occasion);
      productData.metaKeywords = sanitizeStringArray(productData.metaKeywords);

      console.log("Final productData.images:", productData.images);
    } else {
      // Handle JSON payload (fallback)
      productData = {
        ...req.body,
        rating: req.body.rating || 0,
        reviewCount: req.body.reviewCount || 0,
        weightKg: parseOptionalNumber(req.body.weightKg),
        lengthCm: parseOptionalNumber(req.body.lengthCm),
        breadthCm: parseOptionalNumber(req.body.breadthCm),
        heightCm: parseOptionalNumber(req.body.heightCm),
      };
    }

    productData.ingredients = sanitizeStringArray(productData.ingredients);
    productData.tags = sanitizeStringArray(productData.tags);
    if (productData.subcategory === "") {
      productData.subcategory = undefined;
    }

    // Validate that category and subcategory exist

    const categoryExists = await Category.findById(productData.category);
    if (!categoryExists) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    if (productData.subcategory) {
      const subcategoryExists = await Subcategory.findById(
        productData.subcategory,
      );
      if (!subcategoryExists) {
        return res.status(400).json({ message: "Invalid subcategory ID" });
      }
    }

    const product = new Product(productData);
    const createdProduct = await product.save();
    await createdProduct.populate({
      path: "category",
      select: "name slug mainCategory",
      populate: {
        path: "mainCategory",
        select: "name slug",
      },
    });
    await createdProduct.populate("subcategory", "name slug");
    res.status(201).json(createdProduct);
  } catch (error: any) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Product ID or slug already exists" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Product creation error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let updateData: any = {};

    // Handle FormData (multipart/form-data)

    if (req.body && typeof req.body === "object") {

      // If new files are uploaded, generate URLs for them

      let uploadedImageUrls: string[] = [];
      if (req.files && (req.files as Express.Multer.File[]).length > 0) {
        const files = req.files as Express.Multer.File[];
        try {
          uploadedImageUrls = await uploadImagesToCloudinary(files, "products");
        } catch (uploadError: any) {
          console.error("Image upload failed during product update:", uploadError);
          return res.status(502).json({
            message:
              "Image upload failed. Please try again, or contact support if this keeps happening.",
          });
        }
        console.log(
          `Uploaded ${uploadedImageUrls.length} images for update:`,
          uploadedImageUrls,
        );
      }

      const existingImages = parseImageList(req.body.existingImages ?? req.body.images);
      const mergedImages =
        uploadedImageUrls.length > 0 || existingImages !== undefined
          ? [...(existingImages || []), ...uploadedImageUrls]
          : undefined;

      // Parse form fields and merge with uploaded images

      updateData = {
        ...req.body,
        weightKg: parseOptionalNumber(req.body.weightKg),
        lengthCm: parseOptionalNumber(req.body.lengthCm),
        breadthCm: parseOptionalNumber(req.body.breadthCm),
        heightCm: parseOptionalNumber(req.body.heightCm),
        brand: req.body.brand ?? undefined,
        gender: req.body.gender ?? undefined,
        fabric: req.body.fabric ?? undefined,
        fit: req.body.fit ?? undefined,
        material: req.body.material ?? undefined,
        pattern: req.body.pattern ?? undefined,
        color: req.body.color ?? undefined,
        seoTitle: req.body.seoTitle ?? undefined,
        seoDescription: req.body.seoDescription ?? undefined,

        // Use uploaded images if any, otherwise use images from form data
        images: mergedImages,

        // Handle nested objects that come as strings from FormData
        nutritionalInfo: parseJsonField(req.body.nutritionalInfo) || undefined,
        variants: req.body.variants
          ? sanitizeVariants(parseJsonField(req.body.variants) || [])
          : undefined,
        ingredients: req.body.ingredients
          ? parseJsonField(req.body.ingredients) || undefined
          : undefined,
        tags: req.body.tags
          ? parseJsonField(req.body.tags) || undefined
          : undefined,
        sizes: req.body.sizes ? parseJsonField(req.body.sizes) || undefined : undefined,
        careInstructions: req.body.careInstructions
          ? parseJsonField(req.body.careInstructions) || undefined
          : undefined,
        highlights: req.body.highlights
          ? parseJsonField(req.body.highlights) || undefined
          : undefined,
        occasion: req.body.occasion
          ? parseJsonField(req.body.occasion) || undefined
          : undefined,
        metaKeywords: req.body.metaKeywords
          ? parseJsonField(req.body.metaKeywords) || undefined
          : undefined,
      };

      delete updateData.existingImages;

      if (updateData.ingredients !== undefined) {
        updateData.ingredients = sanitizeStringArray(updateData.ingredients);
      }

      if (updateData.tags !== undefined) {
        updateData.tags = sanitizeStringArray(updateData.tags);
      }

      if (updateData.sizes !== undefined) {
        updateData.sizes = sanitizeStringArray(updateData.sizes);
      }

      if (updateData.careInstructions !== undefined) {
        updateData.careInstructions = sanitizeStringArray(updateData.careInstructions);
      }

      if (updateData.highlights !== undefined) {
        updateData.highlights = sanitizeStringArray(updateData.highlights);
      }

      if (updateData.occasion !== undefined) {
        updateData.occasion = sanitizeStringArray(updateData.occasion);
      }

      if (updateData.metaKeywords !== undefined) {
        updateData.metaKeywords = sanitizeStringArray(updateData.metaKeywords);
      }

      console.log("Final updateData.images:", updateData.images);
    } else {
      // Handle JSON payload (fallback)
      updateData = {
        ...req.body,
        weightKg: parseOptionalNumber(req.body.weightKg),
        lengthCm: parseOptionalNumber(req.body.lengthCm),
        breadthCm: parseOptionalNumber(req.body.breadthCm),
        heightCm: parseOptionalNumber(req.body.heightCm),
      };
    }

    const shippingFields = ["weightKg", "lengthCm", "breadthCm", "heightCm"] as const;
    for (const field of shippingFields) {
      if (updateData[field] === undefined) {
        delete updateData[field];
      }
    }

    if (updateData.ingredients !== undefined) {
      updateData.ingredients = sanitizeStringArray(updateData.ingredients);
    }

    if (updateData.tags !== undefined) {
      updateData.tags = sanitizeStringArray(updateData.tags);
    }

    // Validate that category and subcategory exist if they're being updated

    if (updateData.category === "") {
      return res.status(400).json({ message: "Category is required." });
    }

    if (updateData.category) {
      const categoryExists = await Category.findById(updateData.category);
      if (!categoryExists) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
    }

    if (updateData.subcategory === "") {
      updateData.subcategory = null;
    }

    if (updateData.subcategory) {
      const subcategoryExists = await Subcategory.findById(
        updateData.subcategory,
      );
      if (!subcategoryExists) {
        return res.status(400).json({ message: "Invalid subcategory ID" });
      }
    }


    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: "after", runValidators: true },
    )
      .populate({
        path: "category",
        select: "name slug mainCategory",
        populate: {
          path: "mainCategory",
          select: "name slug",
        },
      })
      .populate("subcategory", "name slug");

    res.json(updatedProduct);
  } catch (error: any) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Product ID or slug already exists" });
    }
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Product update error:", error);
    res
      .status(500)
      .json({ message: error.message || "Server error", error: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // A deleted product must not keep appearing via the Hot Product
    // banner, which stores a denormalized copy of the product's data
    // independent of the Product collection.

    try {
      await HotProduct.deleteMany({ productId: req.params.id });
    } catch (cleanupError) {
      // The product is already gone; a stale hot-product reference should not
      // make the dashboard report that deletion failed.
      console.error(
        "Failed to remove deleted product from Hot Product:",
        cleanupError,
      );
    }

    return res.json({ message: "Product removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Get product statistics
// @route   GET /api/products/stats
// @access  Private/Admin

export const getProductStats = async (req: Request, res: Response) => {
  try {
    const totalProducts = await Product.countDocuments();
    const bestSellers = await Product.countDocuments({ isBestSeller: true });
    const featured = await Product.countDocuments({ isFeatured: true });
    const categories = await Product.distinct("category");
    const totalStock = await Product.aggregate([
      { $unwind: "$variants" },
      { $group: { _id: null, total: { $sum: "$variants.stock" } } },
    ]);

    res.json({
      totalProducts,
      bestSellers,
      featured,
      categories: categories.length,
      totalStock: totalStock[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Google Merchant Center product feed (XML)
// @route   GET /api/products/gmc-feed.xml
// @access  Public

export const getGoogleMerchantFeed = async (req: Request, res: Response) => {
  try {
    const storefrontBaseUrl = (
      (process.env.STOREFRONT_URL || process.env.FRONTEND_URL || "https://www.suitablevastra.com").trim()
    ).replace(/\/+$/, "");

    const products = await Product.find({})
      .select("id slug name shortDescription description images basePrice discountPrice variants brand category")
      .populate({
        path: "category",
        select: "name slug mainCategory",
        populate: {
          path: "mainCategory",
          select: "name slug",
        },
      })
      .lean();

    const xmlTag = (tag: string, value: string | number) =>
      `<${tag}>${escapeXml(String(value))}</${tag}>`;

    const itemsXml = products
      .filter(
        (product) =>
          product.slug &&
          product.name &&
          typeof product.basePrice === "number" &&
          typeof product.discountPrice === "number" &&
          Array.isArray(product.images) &&
          product.images.length > 0,
      )
      .map((product) => {
        // One malformed product (e.g. a partial/failed manual DB insert)
        // must not take down the entire feed — skip it and keep going.
        try {
          const firstVariant = Array.isArray(product.variants) && product.variants.length > 0
            ? product.variants[0]
            : null;
          const stock = firstVariant?.stock ?? 0;
          const effectivePrice =
            Number(product.discountPrice) > 0 ? Number(product.discountPrice) : Number(product.basePrice);
          const imageLink = normalizeImageUrl(product.images[0], storefrontBaseUrl);
          const productLink = `${storefrontBaseUrl}/products/${product.slug}`;
          const description = product.shortDescription || product.description || product.name;
          const safeId = String(product.id);
          const safeTitle = product.name;
          const safeDescription = description.slice(0, 4990);
          const safeLink = productLink;
          const safeImage = imageLink;
          const availability = stock > 0 ? "in stock" : "out of stock";
          const additionalImages = Array.isArray(product.images)
            ? product.images.slice(1, 10).map((url) => normalizeImageUrl(url, storefrontBaseUrl))
            : [];
          const productType = (product as any).category?.name || "Apparel";

          return [
            "<item>",
            xmlTag("g:id", safeId),
            xmlTag("title", safeTitle),
            xmlTag("description", safeDescription),
            xmlTag("link", safeLink),
            xmlTag("g:image_link", safeImage),
            ...additionalImages.map((img) => xmlTag("g:additional_image_link", img)),
            xmlTag("g:availability", availability),
            xmlTag("g:condition", "new"),
            xmlTag("g:price", `${effectivePrice.toFixed(2)} INR`),
            xmlTag("g:brand", (process.env.GMC_BRAND || "Denimique").trim()),
            xmlTag("g:google_product_category", "Apparel & Accessories > Clothing"),
            xmlTag("g:product_type", productType),
            xmlTag("g:identifier_exists", "no"),
            "</item>",
          ].join("");
        } catch (itemError) {
          console.error("Skipping product in GMC feed due to error:", product.slug, itemError);
          return "";
        }
      })
      .join("");

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
      "<channel>",
      "<title>Denimique Product Feed</title>",
      `<link>${escapeXml(storefrontBaseUrl)}</link>`,
      "<description>Google Merchant Center product feed for Denimique</description>",
      itemsXml,
      "</channel>",
      "</rss>",
    ].join("");

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.send(xml);
  } catch (error: any) {
    const details =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);
    console.error("Failed to generate GMC feed:", error);
    res.status(500).json({ message: "Failed to generate GMC feed.", error: details });
  }

};


