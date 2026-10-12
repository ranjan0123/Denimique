import { Router } from "express";
import { getShippingQuote } from "../controllers/shipping.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/quote", authMiddleware, getShippingQuote);

export default router;
