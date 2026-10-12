import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import User from "../models/user.model";
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenCookieOptions,
} from "../utils/jwt";
import { sanitizeUser } from "../utils/sanitizeUser";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Token is required",
      });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(400).json({
        message: "Invalid Google token",
      });
    }

    const { email, name, sub } = payload;
    const normalizedEmail = String(email ?? "").trim().toLowerCase();

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = await User.create({
        email: normalizedEmail,
        name,
        googleId: sub,
        isVerified: true,
      });
    } else if (!user.isVerified) {
      user.isVerified = true;
      user.verificationToken = "";
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
    res.status(500).json({
      message: "Google authentication failed",
    });
  }
};
