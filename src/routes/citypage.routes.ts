import { Router } from "express";
import {
  createCityPage,
  deleteCityPage,
  getAllCityPages,
  getCityPageBySlug,
  getCityPages,
  updateCityPage,
} from "../controllers/citypage.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

// Admin
router.get("/admin/all", authMiddleware, adminMiddleware, getAllCityPages);
router.post("/admin", authMiddleware, adminMiddleware, createCityPage);
router.put("/admin/:id", authMiddleware, adminMiddleware, updateCityPage);
router.delete("/admin/:id", authMiddleware, adminMiddleware, deleteCityPage);

// Public
router.get("/", getCityPages);
router.get("/:slug", getCityPageBySlug);

export default router;
