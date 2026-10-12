import { Request, Response } from "express";
import User from "../models/user.model";
import { AuthRequest } from "../middleware/auth.middleware";

const sanitizeUser = (user: any) =>
  user?.toObject
    ? user.toObject({ versionKey: false })
    : user;

const ensureSingleDefault = (addresses: any[], defaultIndex: number) => {
  addresses.forEach((addr, idx) => {
    addr.isDefault = idx === defaultIndex;
  });
};

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -refreshToken -verificationToken -verificationTokenExpiresAt",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findById(req.user.id).select(
      "-password -refreshToken -verificationToken -verificationTokenExpiresAt",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Add address
// @route   POST /api/users/me/addresses
// @access  Private
export const addAddress = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const {
      label,
      fullName,
      phone,
      line1,
      line2,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = req.body;

    const newAddress = {
      label,
      fullName,
      phone,
      line1,
      line2,
      city,
      state,
      postalCode,
      country,
      isDefault: !!isDefault,
    };

    user.addresses.push(newAddress as any);

    if (newAddress.isDefault || user.addresses.length === 1) {
      ensureSingleDefault(user.addresses as any[], user.addresses.length - 1);
    }

    await user.save();

    res.status(201).json({ addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Update address
// @route   PUT /api/users/me/addresses/:addressId
// @access  Private
export const updateAddress = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const address = (user.addresses as any).id(req.params.addressId);

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    const updatableFields = [
      "label",
      "fullName",
      "phone",
      "line1",
      "line2",
      "city",
      "state",
      "postalCode",
      "country",
    ] as const;

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        (address as any)[field] = req.body[field];
      }
    });

    if (req.body.isDefault !== undefined) {
      address.isDefault = !!req.body.isDefault;
    }

    if (address.isDefault) {
      const index = user.addresses.findIndex((addr) =>
        (addr as any)._id.equals((address as any)._id),
      );
      ensureSingleDefault(user.addresses as any[], index);
    } else if (!user.addresses.some((addr) => addr.isDefault)) {
      ensureSingleDefault(user.addresses as any[], 0);
    }

    await user.save();

    res.json({ addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Delete address
// @route   DELETE /api/users/me/addresses/:addressId
// @access  Private
export const deleteAddress = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const address = (user.addresses as any).id(req.params.addressId);

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    const wasDefault = address.isDefault;
    address.deleteOne();

    if (wasDefault && user.addresses.length > 0) {
      ensureSingleDefault(user.addresses as any[], 0);
    }

    await user.save();

    res.json({ addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
