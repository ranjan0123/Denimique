import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export const superAdminMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user || req.user.role !== "superadmin") {
    return res.status(403).json({
      message: "Super admin only",
    });
  }

  next();
};
