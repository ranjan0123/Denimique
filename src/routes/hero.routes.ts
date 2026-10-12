import { Router } from "express";
import {
  createHero,
  deleteHero,
  getHero,
  updateHero,
} from "../controllers/hero.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";
import { uploadHeroImages } from "../config/multer";

const router = Router();

// Public
router.get("/", getHero);

// Admin
router.post("/", authMiddleware, adminMiddleware, uploadHeroImages, createHero);
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  uploadHeroImages,
  updateHero,
);
router.delete("/:id", authMiddleware, adminMiddleware, deleteHero);

export default router;
