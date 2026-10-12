import { Router } from "express";
import {
  deleteFormResponse,
  getFormResponseById,
  getFormResponses,
  submitBlogSubscribeForm,
  submitContactForm,
  submitNewsletterForm,
  submitWholesaleForm,
  updateFormResponseStatus,
} from "../controllers/formresponse.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

// Public submissions
router.post("/contact", submitContactForm);
router.post("/newsletter", submitNewsletterForm);
router.post("/blog-subscribe", submitBlogSubscribeForm);
router.post("/wholesale", submitWholesaleForm);

// Admin management
router.get("/admin", authMiddleware, adminMiddleware, getFormResponses);
router.get("/admin/:id", authMiddleware, adminMiddleware, getFormResponseById);
router.patch(
  "/admin/:id/status",
  authMiddleware,
  adminMiddleware,
  updateFormResponseStatus,
);
router.delete(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  deleteFormResponse,
);

export default router;
