import { Response } from "express";
import mongoose from "mongoose";
import Cart from "../models/Cart";
import Product from "../models/Product";
import { AuthRequest } from "../middleware/auth.middleware";

const calculateSubtotal = (items: any[]) =>
  items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);

const resolveUnitPrice = (product: any, variantId?: string) => {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const variant = variantId
    ? variants.find(
        (item: any, index: number) =>
          (item.id || item._id || item.sku || String(index)) === variantId,
      )
    : undefined;
  const variantPrice = Number(variant?.price ?? variants[0]?.price ?? 0);
  const base = Number(product.basePrice ?? product.price ?? variantPrice);
  const discount = Number(product.discountPrice ?? 0);
  const unitPrice = variant
    ? variantPrice
    : discount > 0 && discount < base
      ? discount
      : base || discount;

  return {
    price: unitPrice,
    variantLabel: variant?.label || variant?.title || undefined,
  };
};

const getProductImage = (product: any) => {
  const image = product.images?.[0] || product.image || product.productImage;
  if (typeof image === "string") return image;
  return image?.src || image?.url || "";
};

// @desc    Get cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req: AuthRequest, res: Response) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [], subtotal: 0 });
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Private
export const addToCart = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, quantity = 1, variantId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // .lean() is required here, not just a perf nicety: the bulk-imported
    // catalog's documents carry legacy Shopify fields (title, handle,
    // images as [{src}] objects) that don't exist in the Product schema.
    // A normal Mongoose-hydrated document silently drops any field not in
    // the schema, which made every legacy product snapshot into the cart
    // with name "Product" and no image (see name/getProductImage below).
    // Typed `any`, same as resolveUnitPrice/getProductImage above: this
    // intentionally reads both the real schema shape and the legacy raw
    // (Shopify-imported) shape, neither of which TS can express as one type.
    const product: any = mongoose.Types.ObjectId.isValid(productId)
      ? (await Product.findById(productId).lean()) ||
        (await Product.findOne({ id: productId }).lean())
      : await Product.findOne({ id: productId }).lean();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const qty = Math.max(1, Number(quantity || 1));
    const { price, variantLabel } = resolveUnitPrice(product, variantId);

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [], subtotal: 0 });
    }

    const existingItem = cart.items.find(
      (item: any) =>
        item.product.toString() === product._id.toString() &&
        (item.variantId || "") === (variantId || ""),
    );

    if (existingItem) {
      existingItem.quantity += qty;
      existingItem.lineTotal = existingItem.quantity * existingItem.unitPrice;
    } else {
      cart.items.push({
        product: product._id,
        productId: product.id || product._id.toString(),
        slug: product.slug || product.handle || product.id || product._id.toString(),
        name: product.name || product.title || product.handle || "Product",
        image: getProductImage(product),
        flavor: product.flavor,
        variantId,
        variantLabel,
        unitPrice: price,
        quantity: qty,
        lineTotal: price * qty,
      } as any);
    }

    cart.subtotal = calculateSubtotal(cart.items as any[]);
    await cart.save();

    res.status(201).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/items/:itemId
// @access  Private
export const updateCartItem = async (req: AuthRequest, res: Response) => {
  try {
    const { quantity } = req.body;
    const qty = Math.max(1, Number(quantity || 1));

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find((item: any) => item._id?.toString() === req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    item.quantity = qty;
    item.lineTotal = item.unitPrice * qty;

    cart.subtotal = calculateSubtotal(cart.items as any[]);
    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Remove cart item
// @route   DELETE /api/cart/items/:itemId
// @access  Private
export const removeCartItem = async (req: AuthRequest, res: Response) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex((item: any) => item._id?.toString() === req.params.itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    cart.items.splice(itemIndex, 1);
    cart.subtotal = calculateSubtotal(cart.items as any[]);
    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
export const clearCart = async (req: AuthRequest, res: Response) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];
    cart.subtotal = 0;
    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
