import { Router } from "express";
import {
  createWeekendCombo,
  deleteWeekendCombo,
  getActiveWeekendCombo,
  getAllWeekendCombos,
  getWeekendComboById,
  toggleWeekendComboStatus,
  updateWeekendCombo,
} from "../controllers/weekendcombo.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";
import { uploadSingle } from "../config/multer";

const router = Router();

// Public
router.get("/", getActiveWeekendCombo);

// Admin
router.post(
  "/admin",
  authMiddleware,
  adminMiddleware,
  uploadSingle,
  createWeekendCombo,
);

router.get(
  "/admin",
  authMiddleware,
  adminMiddleware,
  getAllWeekendCombos,
);

router.get(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  getWeekendComboById,
);

router.put(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  uploadSingle,
  updateWeekendCombo,
);

router.patch(
  "/admin/:id/toggle",
  authMiddleware,
  adminMiddleware,
  toggleWeekendComboStatus,
);

router.delete(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  deleteWeekendCombo,
);

export default router;
