import { Request, Response } from "express";
import HotProduct, { IHotProduct } from "../models/HotProduct";
import Product from "../models/Product";

// @desc    Get active hot product
// @route   GET /api/hot-product
// @access  Public
export const getActiveHotProduct = async (req: Request, res: Response) => {
  try {
    const hotProduct = await HotProduct.findOne({
      isEnabled: true,
      "displayDuration.startDate": { $lte: new Date() },
      "displayDuration.endDate": { $gte: new Date() },
    }).sort({ createdAt: -1 });

    if (!hotProduct) {
      return res.status(404).json({ message: "No active hot product available" });
    }

    // The underlying product may have been deleted after this hot product
    // entry was created; don't advertise a deal for a product that no
    // longer exists.
    const product = await Product.findById(hotProduct.productId).select("slug");
    if (!product) {
      return res.status(404).json({ message: "No active hot product available" });
    }

    const hotProductData: any = hotProduct.toObject();
    hotProductData.productSlug = product.slug;

    res.json(hotProductData);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Create hot product (Admin)
// @route   POST /api/admin/hot-product
// @access  Private/Admin
export const createHotProduct = async (req: Request, res: Response) => {
  try {
    const {
      productId,
      originalPrice,
      discountedPrice,
      discountPercentage,
      progressPercentage,
      couponCode,
      couponDescription,
      isEnabled,
      startDate,
      endDate,
    } = req.body;

    // Validate input
    if (!productId || !originalPrice || !discountedPrice) {
      return res.status(400).json({
        message: "Please provide productId, originalPrice, and discountedPrice",
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if discount percentage is within range
    if (discountPercentage && (discountPercentage < 0 || discountPercentage > 100)) {
      return res.status(400).json({
        message: "Discount percentage must be between 0 and 100",
      });
    }

    const hotProductData: Partial<IHotProduct> = {
      productId,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.images?.[0] || "",
      originalPrice,
      discountedPrice,
      discountPercentage: discountPercentage || 0,
      progressPercentage: progressPercentage || 0,
      couponCode: couponCode || "",
      couponDescription: couponDescription || "",
      isEnabled: isEnabled ?? false,
      displayDuration: {
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    };

    const hotProduct = new HotProduct(hotProductData);
    const createdHotProduct = await hotProduct.save();

    res.status(201).json({
      message: "Hot product created successfully",
      data: createdHotProduct,
    });
  } catch (error: any) {
    console.error("Create Hot Product Error:", error);
    res.status(500).json({
      message: "Failed to create hot product",
      error: error.message,
      details: error.errors ? Object.values(error.errors).map((e: any) => e.message) : undefined,
    });
  }
};

// @desc    Get all hot products (Admin)
// @route   GET /api/admin/hot-product
// @access  Private/Admin
export const getAllHotProducts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const hotProducts = await HotProduct.find()
      .populate("productId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await HotProduct.countDocuments();

    res.json({
      data: hotProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Get hot product by id (Admin)
// @route   GET /api/admin/hot-product/:id
// @access  Private/Admin
export const getHotProductById = async (req: Request, res: Response) => {
  try {
    const hotProduct = await HotProduct.findById(req.params.id).populate(
      "productId",
    );

    if (!hotProduct) {
      return res.status(404).json({ message: "Hot product not found" });
    }

    res.json(hotProduct);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Update hot product (Admin)
// @route   PUT /api/admin/hot-product/:id
// @access  Private/Admin
export const updateHotProduct = async (req: Request, res: Response) => {
  try {
    const {
      productId,
      originalPrice,
      discountedPrice,
      discountPercentage,
      progressPercentage,
      couponCode,
      couponDescription,
      isEnabled,
      startDate,
      endDate,
    } = req.body;

    const hotProduct = await HotProduct.findById(req.params.id);
    if (!hotProduct) {
      return res.status(404).json({ message: "Hot product not found" });
    }

    // If productId is changed, verify the new product exists and update name/image
    if (productId && productId !== hotProduct.productId.toString()) {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      hotProduct.productId = productId;
      hotProduct.productName = product.name;
      hotProduct.productSlug = product.slug;
      hotProduct.productImage = product.images?.[0] || "";
    }

    if (originalPrice !== undefined) hotProduct.originalPrice = originalPrice;
    if (discountedPrice !== undefined) hotProduct.discountedPrice = discountedPrice;
    if (discountPercentage !== undefined) {
      if (discountPercentage < 0 || discountPercentage > 100) {
        return res.status(400).json({
          message: "Discount percentage must be between 0 and 100",
        });
      }
      hotProduct.discountPercentage = discountPercentage;
    }
    if (progressPercentage !== undefined) {
      if (progressPercentage < 0 || progressPercentage > 100) {
        return res.status(400).json({
          message: "Progress percentage must be between 0 and 100",
        });
      }
      hotProduct.progressPercentage = progressPercentage;
    }
    if (couponCode !== undefined) hotProduct.couponCode = couponCode;
    if (couponDescription !== undefined) hotProduct.couponDescription = couponDescription;
    if (isEnabled !== undefined) hotProduct.isEnabled = isEnabled;

    if (startDate || endDate) {
      hotProduct.displayDuration = {
        startDate: startDate ? new Date(startDate) : hotProduct.displayDuration.startDate,
        endDate: endDate ? new Date(endDate) : hotProduct.displayDuration.endDate,
      };
    }

    const updatedHotProduct = await hotProduct.save();

    res.json({
      message: "Hot product updated successfully",
      data: updatedHotProduct,
    });
  } catch (error: any) {
    console.error("Update Hot Product Error:", error);
    res.status(500).json({
      message: "Failed to update hot product",
      error: error.message,
      details: error.errors ? Object.values(error.errors).map((e: any) => e.message) : undefined,
    });
  }
};

// @desc    Toggle hot product enabled status (Admin)
// @route   PATCH /api/admin/hot-product/:id/toggle
// @access  Private/Admin
export const toggleHotProductStatus = async (req: Request, res: Response) => {
  try {
    const hotProduct = await HotProduct.findById(req.params.id);

    if (!hotProduct) {
      return res.status(404).json({ message: "Hot product not found" });
    }

    hotProduct.isEnabled = !hotProduct.isEnabled;
    const updatedHotProduct = await hotProduct.save();

    res.json({
      message: `Hot product ${updatedHotProduct.isEnabled ? "enabled" : "disabled"} successfully`,
      data: updatedHotProduct,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Delete hot product (Admin)
// @route   DELETE /api/admin/hot-product/:id
// @access  Private/Admin
export const deleteHotProduct = async (req: Request, res: Response) => {
  try {
    const hotProduct = await HotProduct.findByIdAndDelete(req.params.id);

    if (!hotProduct) {
      return res.status(404).json({ message: "Hot product not found" });
    }

    res.json({
      message: "Hot product deleted successfully",
      data: hotProduct,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Update progress percentage (Admin)
// @route   PATCH /api/admin/hot-product/:id/progress
// @access  Private/Admin
export const updateProgressPercentage = async (req: Request, res: Response) => {
  try {
    const { progressPercentage } = req.body;

    if (progressPercentage === undefined) {
      return res.status(400).json({ message: "Progress percentage is required" });
    }

    if (progressPercentage < 0 || progressPercentage > 100) {
      return res.status(400).json({
        message: "Progress percentage must be between 0 and 100",
      });
    }

    const hotProduct = await HotProduct.findByIdAndUpdate(
      req.params.id,
      { progressPercentage },
      { new: true },
    );

    if (!hotProduct) {
      return res.status(404).json({ message: "Hot product not found" });
    }

    res.json({
      message: "Progress percentage updated successfully",
      data: hotProduct,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
