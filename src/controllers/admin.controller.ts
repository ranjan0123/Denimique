import { Request, Response } from "express";
import User from "../models/user.model";
import Cart from "../models/Cart";
import Wishlist from "../models/Wishlist";
import Order from "../models/Order";

// @desc    Get all users (paginated)
// @route   GET /api/admin/users
// @access  Super Admin
export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (req.query.search) {
      const search = req.query.search as string;
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("-password -refreshToken -verificationToken -verificationTokenExpiresAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(filter);

    res.json({
      users,
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

// @desc    Get user by id
// @route   GET /api/admin/users/:id
// @access  Super Admin
export const getUserById = async (req: Request, res: Response) => {
  try {
    const ordersPage = parseInt(req.query.ordersPage as string) || 1;
    const ordersLimit = parseInt(req.query.ordersLimit as string) || 10;
    const ordersSkip = (ordersPage - 1) * ordersLimit;

    const user = await User.findById(req.params.id).select(
      "-password -refreshToken -verificationToken -verificationTokenExpiresAt",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const [cart, wishlist, orders, ordersTotal] = await Promise.all([
      Cart.findOne({ user: user._id }),
      Wishlist.findOne({ user: user._id }),
      Order.find({ user: user._id })
        .sort({ createdAt: -1 })
        .skip(ordersSkip)
        .limit(ordersLimit),
      Order.countDocuments({ user: user._id }),
    ]);

    res.json({
      user,
      cart,
      wishlist,
      orders,
      ordersPagination: {
        page: ordersPage,
        limit: ordersLimit,
        total: ordersTotal,
        pages: Math.ceil(ordersTotal / ordersLimit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Get user overview (profile + cart + wishlist + orders)
// @route   GET /api/admin/users/:id/overview
// @access  Super Admin
export const getUserOverview = async (req: Request, res: Response) => {
  try {
    const ordersPage = parseInt(req.query.ordersPage as string) || 1;
    const ordersLimit = parseInt(req.query.ordersLimit as string) || 10;
    const ordersSkip = (ordersPage - 1) * ordersLimit;

    const cartPage = parseInt(req.query.cartPage as string) || 1;
    const cartLimit = parseInt(req.query.cartLimit as string) || 10;
    const cartSkip = (cartPage - 1) * cartLimit;

    const wishlistPage = parseInt(req.query.wishlistPage as string) || 1;
    const wishlistLimit = parseInt(req.query.wishlistLimit as string) || 10;
    const wishlistSkip = (wishlistPage - 1) * wishlistLimit;

    const user = await User.findById(req.params.id).select(
      "-password -refreshToken -verificationToken -verificationTokenExpiresAt",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const [cartDoc, wishlistDoc, orders, ordersTotal, orderTotals] =
      await Promise.all([
        Cart.findOne({ user: user._id }).lean(),
        Wishlist.findOne({ user: user._id }).lean(),
        Order.find({ user: user._id })
          .sort({ createdAt: -1 })
          .skip(ordersSkip)
          .limit(ordersLimit),
        Order.countDocuments({ user: user._id }),
        Order.aggregate([
          { $match: { user: user._id } },
          {
            $group: {
              _id: "$user",
              totalSpent: { $sum: "$total" },
              totalOrders: { $sum: 1 },
            },
          },
        ]),
      ]);

    const cartItems = cartDoc?.items || [];
    const wishlistItems = wishlistDoc?.items || [];

    const cartPageItems = cartItems.slice(cartSkip, cartSkip + cartLimit);
    const wishlistPageItems = wishlistItems.slice(
      wishlistSkip,
      wishlistSkip + wishlistLimit,
    );

    const totals = orderTotals[0] || { totalSpent: 0, totalOrders: 0 };

    res.json({
      user,
      cart: {
        subtotal: cartDoc?.subtotal || 0,
        items: cartPageItems,
        totalItems: cartItems.length,
        pagination: {
          page: cartPage,
          limit: cartLimit,
          total: cartItems.length,
          pages: Math.ceil(cartItems.length / cartLimit),
        },
      },
      wishlist: {
        items: wishlistPageItems,
        totalItems: wishlistItems.length,
        pagination: {
          page: wishlistPage,
          limit: wishlistLimit,
          total: wishlistItems.length,
          pages: Math.ceil(wishlistItems.length / wishlistLimit),
        },
      },
      orders: {
        items: orders,
        pagination: {
          page: ordersPage,
          limit: ordersLimit,
          total: ordersTotal,
          pages: Math.ceil(ordersTotal / ordersLimit),
        },
      },
      summary: {
        totalOrders: totals.totalOrders || 0,
        totalSpent: totals.totalSpent || 0,
        cartItems: cartItems.length,
        wishlistItems: wishlistItems.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Super Admin
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    const allowedRoles = ["user", "admin", "superadmin"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (req.params.id === (req as any).user?.id) {
      return res.status(400).json({ message: "You cannot change your own role" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "superadmin" && role !== "superadmin") {
      const superAdminCount = await User.countDocuments({ role: "superadmin" });
      if (superAdminCount <= 1) {
        return res.status(400).json({ message: "At least one super admin required" });
      }
    }

    user.role = role;
    await user.save();

    const sanitized = await User.findById(req.params.id).select(
      "-password -refreshToken -verificationToken -verificationTokenExpiresAt",
    );

    res.json({ user: sanitized });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Super Admin
export const deleteUser = async (req: Request, res: Response) => {
  try {
    if (req.params.id === (req as any).user?.id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "superadmin") {
      const superAdminCount = await User.countDocuments({ role: "superadmin" });
      if (superAdminCount <= 1) {
        return res.status(400).json({ message: "At least one super admin required" });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "User removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
