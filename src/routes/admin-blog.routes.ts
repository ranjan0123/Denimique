import { Router } from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogForEdit,
  updateBlog,
  deleteBlog,
  publishBlog,
  getBlogAnalytics,
  uploadBlogInlineImage,
} from "../controllers/admin-blog.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";
import { uploadBlogImage as multerUpload } from "../config/multer";

const router = Router();

// All admin blog routes require authentication and admin privileges
router.use(authMiddleware, adminMiddleware);

// Blog management routes
router.post("/", multerUpload, createBlog);
router.get("/", getAllBlogs);
router.get("/analytics", getBlogAnalytics);
router.post("/upload-image", multerUpload, uploadBlogInlineImage);
router.get("/:id", getBlogForEdit);
router.put("/:id", multerUpload, updateBlog);
router.delete("/:id", deleteBlog);
router.patch("/:id/publish", publishBlog);

export default router;
