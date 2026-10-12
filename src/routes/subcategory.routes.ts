import { Router } from "express";
import {
  getSubcategories,
  getSubcategory,
  getSubcategoryBySlug,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  getSubcategoriesByCategory,
} from "../controllers/subcategory.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";
import { uploadSingle } from "../config/multer";

const router = Router();

// Public routes
router.get("/", getSubcategories);
router.get("/slug/:slug", getSubcategoryBySlug);
router.get("/category/:categoryId", getSubcategoriesByCategory);
router.get("/:id", getSubcategory);

// Protected routes (Admin only)
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  uploadSingle,
  createSubcategory,
);
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  uploadSingle,
  updateSubcategory,
);
router.delete("/:id", authMiddleware, adminMiddleware, deleteSubcategory);

export default router;
