import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  addToWishlist,
  clearWishlist,
  getWishlist,
  removeWishlistItem,
} from "../controllers/wishlist.controller";

const router = Router();

router.get("/", authMiddleware, getWishlist);
router.post("/items", authMiddleware, addToWishlist);
router.delete("/items/:itemId", authMiddleware, removeWishlistItem);
router.delete("/", authMiddleware, clearWishlist);

export default router;
