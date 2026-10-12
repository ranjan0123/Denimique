import { Router } from "express";
import { getCheckoutSummary } from "../controllers/checkout.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/summary", authMiddleware, getCheckoutSummary);

export default router;
