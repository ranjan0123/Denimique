import { Response } from "express";
import Wishlist from "../models/Wishlist";
import Product from "../models/Product";
import { AuthRequest } from "../middleware/auth.middleware";

// @desc    Get wishlist
// @route   GET /api/wishlist
// @access  Private
export const getWishlist = async (req: AuthRequest, res: Response) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, items: [] });
    }

    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Add item to wishlist
// @route   POST /api/wishlist/items
// @access  Private
export const addToWishlist = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, items: [] });
    }

    const exists = wishlist.items.some(
      (item: any) => item.product.toString() === productId,
    );

    if (!exists) {
      wishlist.items.push({
        product: product._id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images?.[0],
        flavor: product.flavor,
      } as any);
    }

    await wishlist.save();

    res.status(201).json(wishlist);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Remove item from wishlist
// @route   DELETE /api/wishlist/items/:itemId
// @access  Private
export const removeWishlistItem = async (req: AuthRequest, res: Response) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    const item = (wishlist.items as any).id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: "Wishlist item not found" });
    }

    item.deleteOne();
    await wishlist.save();

    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Clear wishlist
// @route   DELETE /api/wishlist
// @access  Private
export const clearWishlist = async (req: AuthRequest, res: Response) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    wishlist.items = [];
    await wishlist.save();

    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
