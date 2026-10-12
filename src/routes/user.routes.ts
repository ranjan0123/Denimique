import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  addAddress,
  deleteAddress,
  getProfile,
  updateAddress,
  updateProfile,
} from "../controllers/profile.controller";

const router = Router();

router.get("/me", authMiddleware, getProfile);
router.put("/me", authMiddleware, updateProfile);
router.post("/me/addresses", authMiddleware, addAddress);
router.put("/me/addresses/:addressId", authMiddleware, updateAddress);
router.delete("/me/addresses/:addressId", authMiddleware, deleteAddress);

export default router;
