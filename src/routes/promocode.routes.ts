import { Router } from "express";
import {
  createPromoCode,
  deletePromoCode,
  getPromoCode,
  getPromoCodes,
  updatePromoCode,
} from "../controllers/promocode.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

router.get("/", authMiddleware, adminMiddleware, getPromoCodes);
router.get("/:id", authMiddleware, adminMiddleware, getPromoCode);
router.post("/", authMiddleware, adminMiddleware, createPromoCode);
router.put("/:id", authMiddleware, adminMiddleware, updatePromoCode);
router.delete("/:id", authMiddleware, adminMiddleware, deletePromoCode);

export default router;
