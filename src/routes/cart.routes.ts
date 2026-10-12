import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  addToCart,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../controllers/cart.controller";

const router = Router();

router.get("/", authMiddleware, getCart);
router.post("/items", authMiddleware, addToCart);
router.put("/items/:itemId", authMiddleware, updateCartItem);
router.delete("/items/:itemId", authMiddleware, removeCartItem);
router.delete("/", authMiddleware, clearCart);

export default router;
