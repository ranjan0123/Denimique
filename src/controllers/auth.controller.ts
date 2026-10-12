import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import { hashPassword, comparePassword } from "../utils/password";
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenCookieOptions,
} from "../utils/jwt";
import { sanitizeUser } from "../utils/sanitizeUser";
import crypto from "crypto";
import { sendVerificationEmail, isEmailConfigured } from "../utils/sendEmail";

// export const signup = async (req: Request, res: Response) => {
//   const { name, email, password } = req.body;

//   const existingUser = await User.findOne({ email });

//   if (existingUser) return res.status(400).json({ message: "User exists" });

//   const hashed = await hashPassword(password);

//   const user = await User.create({
//     name,
//     email,
//     password: hashed,
//   });

//   const accessToken = generateAccessToken(user);
//   const refreshToken = generateRefreshToken(user);

//   user.refreshToken = refreshToken;
//   await user.save();

//   res.cookie("refreshToken", refreshToken, {
//     httpOnly: true,
//     secure: true,
//     sameSite: "strict",
//   });

//   res.json({
//     user,
//     accessToken,
//   });
// };

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, password } = req.body;
    const email = String(req.body.email ?? "").trim().toLowerCase();

    const existingUser = await User.findOne({ email });

    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashed = await hashPassword(password);

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const emailConfigured = isEmailConfigured();

    const user = await User.create({
      name,
      email,
      password: hashed,
      verificationToken,
      verificationTokenExpiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
      // No SMTP creds configured (e.g. local dev) means we can't deliver a
      // verification link, so there's nothing for the user to click — skip
      // the gate rather than lock them out of an account they can never verify.
      isVerified: !emailConfigured,
    });

    if (emailConfigured) {
      await sendVerificationEmail(email, verificationToken);
    }

    res.json({
      message: emailConfigured
        ? "Signup successful. Please verify your email."
        : "Signup successful. You can now sign in.",
    });
  } catch (error) {
    console.error("Signup error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const email = String(req.body.email ?? "").trim().toLowerCase();

    const user = await User.findOne({ email });

    if (!user || !user.password)
      return res.status(400).json({ message: "Invalid credentials" });

    const match = await comparePassword(password, user.password);

    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      if (!isEmailConfigured()) {
        // Same reasoning as signup: can't send a verification link without
        // SMTP creds, so don't block sign-in on a step that can never complete.
        user.isVerified = true;
      } else {
        const verificationToken = crypto.randomBytes(32).toString("hex");

        user.verificationToken = verificationToken;
        user.verificationTokenExpiresAt = new Date(
          Date.now() + VERIFICATION_TOKEN_TTL_MS,
        );
        await user.save();

        await sendVerificationEmail(user.email, verificationToken);

        return res.status(403).json({
          message:
            "Please verify your email address before signing in. Check your inbox for the verification link.",
        });
      }
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

    res.json({
      user: sanitizeUser(user),
      accessToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET as string,
    ) as any;

    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie("refreshToken", newRefreshToken, getRefreshTokenCookieOptions());

    res.json({ accessToken });
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;

  if (!token) return res.sendStatus(204);

  const user = await User.findOne({ refreshToken: token });

  if (user) {
    user.refreshToken = "";
    await user.save();
  }

  res.clearCookie("refreshToken", getRefreshTokenCookieOptions());

  res.json({ message: "Logged out" });
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.params;

  const user = await User.findOne({
    verificationToken: token,
  });

  if (!user)
    return res.status(400).json({
      message: "Invalid verification link",
    });

  if (
    user.verificationTokenExpiresAt &&
    user.verificationTokenExpiresAt.getTime() < Date.now()
  ) {
    return res.status(400).json({
      message:
        "This verification link has expired. Please log in again to receive a new one.",
    });
  }

  user.isVerified = true;
  user.verificationToken = "";
  user.verificationTokenExpiresAt = undefined;

  await user.save();

  res.json({
    message: "Email verified successfully",
  });
};

export const me = async (req: Request, res: Response) => {
  try {
    const user = await User.findById((req as any).user.id).select(
      "-password -refreshToken -verificationToken -verificationTokenExpiresAt",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
