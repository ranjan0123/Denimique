import { Router } from "express";
import {
  deleteUser,
  getUserById,
  getUsers,
  getUserOverview,
  updateUserRole,
} from "../controllers/admin.controller";
import { broadcast as broadcastPushNotification } from "../controllers/push.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";
import { superAdminMiddleware } from "../middleware/superadmin.middleware";

const router = Router();

router.get("/users", authMiddleware, superAdminMiddleware, getUsers);
router.get("/users/:id", authMiddleware, superAdminMiddleware, getUserById);
router.get(
  "/users/:id/overview",
  authMiddleware,
  superAdminMiddleware,
  getUserOverview,
);
router.put(
  "/users/:id/role",
  authMiddleware,
  superAdminMiddleware,
  updateUserRole,
);
router.delete("/users/:id", authMiddleware, superAdminMiddleware, deleteUser);
router.post(
  "/push/broadcast",
  authMiddleware,
  adminMiddleware,
  broadcastPushNotification,
);
export default router;
