import { Router } from "express";
import {
  getCategoryHierarchy,
  getCategories,
  getCategory,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";
import { uploadSingle } from "../config/multer";

const router = Router();

// Public routes
router.get("/hierarchy", getCategoryHierarchy);
router.get("/slug/:slug", getCategoryBySlug);
router.get("/", getCategories);
router.get("/:id", getCategory);

// Protected routes (Admin only)
router.post("/", authMiddleware, adminMiddleware, uploadSingle, createCategory);
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  uploadSingle,
  updateCategory,
);
router.delete("/:id", authMiddleware, adminMiddleware, deleteCategory);

export default router;
