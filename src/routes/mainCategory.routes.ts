import { Router } from "express";
import {
  createMainCategory,
  deleteMainCategory,
  getMainCategories,
  getMainCategory,
  getMainCategoryBySlug,
  updateMainCategory,
} from "../controllers/mainCategory.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";
import { uploadSingle } from "../config/multer";

const router = Router();

router.get("/", getMainCategories);
router.get("/slug/:slug", getMainCategoryBySlug);
router.get("/:id", getMainCategory);

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  uploadSingle,
  createMainCategory,
);
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  uploadSingle,
  updateMainCategory,
);
router.delete("/:id", authMiddleware, adminMiddleware, deleteMainCategory);

export default router;
