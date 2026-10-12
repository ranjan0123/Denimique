import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getOrders,
  previewPackageDetails,
  updateOrderStatus,
  verifyOrderPayment,
} from "../controllers/order.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

router.post("/", authMiddleware, createOrder);
router.post("/pack-preview", authMiddleware, adminMiddleware, previewPackageDetails);
router.post("/:id/verify-payment", authMiddleware, verifyOrderPayment);
router.get("/my-orders", authMiddleware, getMyOrders);
router.get("/:id", authMiddleware, getOrderById);
router.get("/", authMiddleware, adminMiddleware, getOrders);
router.put("/:id/status", authMiddleware, adminMiddleware, updateOrderStatus);

export default router;
