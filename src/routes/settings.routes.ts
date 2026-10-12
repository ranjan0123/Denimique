import { Router } from "express";
import {
  getAdminSettings,
  getPublicSettings,
  updateAdminSettings,
} from "../controllers/settings.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

router.get("/", getPublicSettings);
router.get("/admin", authMiddleware, adminMiddleware, getAdminSettings);
router.patch("/admin", authMiddleware, adminMiddleware, updateAdminSettings);

export default router;
