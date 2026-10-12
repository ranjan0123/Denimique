import { Router } from "express";
import { subscribe, unsubscribe } from "../controllers/push.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/subscribe", authMiddleware, subscribe);
router.post("/unsubscribe", authMiddleware, unsubscribe);

export default router;
