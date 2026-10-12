import { Router } from "express";
import {
  getBlogs,
  getBlogBySlug,
  getBlogById,
  getTrendingBlogs,
  getCategories,
  getAllTags,
} from "../controllers/blog.controller";

const router = Router();

// Public routes
router.get("/", getBlogs);
router.get("/trending", getTrendingBlogs);
router.get("/categories", getCategories);
router.get("/tags", getAllTags);
router.get("/:slug", getBlogBySlug);
router.get("/id/:id", getBlogById);

export default router;
