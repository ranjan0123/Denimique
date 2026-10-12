import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  signup,
  login,
  refreshToken,
  logout,
  verifyEmail,
  me,
} from "../controllers/auth.controller";
import { googleLogin } from "../controllers/googleAuth";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Skip rate limiting in local development so repeated testing doesn't get
// blocked; the limiter still fully applies in production.
const skipInDevelopment = () => process.env.NODE_ENV !== "production";

// Brute-force protection for credential-guessing endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDevelopment,
  message: { message: "Too many attempts. Please try again later." },
});

// Looser limit for silent token refresh, which the frontend calls automatically.
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDevelopment,
  message: { message: "Too many requests. Please try again later." },
});

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/google", authLimiter, googleLogin); // Google login
router.post("/refresh", refreshLimiter, refreshToken);
router.post("/logout", logout);
router.get("/verify-email/:token", verifyEmail);
router.get("/me", authMiddleware, me);

export default router;
