import { Router } from "express";
import {
  getActiveHotProduct,
  createHotProduct,
  getAllHotProducts,
  getHotProductById,
  updateHotProduct,
  toggleHotProductStatus,
  deleteHotProduct,
  updateProgressPercentage,
} from "../controllers/hotproduct.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

// Public routes
router.get("/", getActiveHotProduct);

// Admin routes
router.post(
  "/admin",
  authMiddleware,
  adminMiddleware,
  createHotProduct,
);

router.get(
  "/admin",
  authMiddleware,
  adminMiddleware,
  getAllHotProducts,
);

router.get(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  getHotProductById,
);

router.put(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  updateHotProduct,
);

router.patch(
  "/admin/:id/toggle",
  authMiddleware,
  adminMiddleware,
  toggleHotProductStatus,
);

router.patch(
  "/admin/:id/progress",
  authMiddleware,
  adminMiddleware,
  updateProgressPercentage,
);

router.delete(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  deleteHotProduct,
);

export default router;
