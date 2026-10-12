import { Router } from "express";
import {
  getProducts,
  getProduct,
  getProductBySlug,
  getGoogleMerchantFeed,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
} from "../controllers/product.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";
import { uploadProductImages as multerUpload } from "../config/multer";

const router = Router();

// Public routes
router.get("/", getProducts);
router.get("/gmc-feed.xml", getGoogleMerchantFeed);
router.get("/slug/:slug", getProductBySlug);
router.get("/stats", authMiddleware, adminMiddleware, getProductStats);
router.get("/:id", getProduct);

// Protected routes (Admin only)
router.post("/", authMiddleware, multerUpload, createProduct);
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  multerUpload,
  updateProduct,
);
router.delete("/:id", authMiddleware, adminMiddleware, deleteProduct);

export default router;
