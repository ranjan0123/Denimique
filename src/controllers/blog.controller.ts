import { Request, Response } from "express";
import Blog, { IBlog } from "../models/Blog";

// @desc    Get all published blogs with pagination
// @route   GET /api/blogs
// @access  Public
export const getBlogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = { isPublished: true };

    // Filter by category
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Filter by tags
    if (req.query.tags) {
      const tags = Array.isArray(req.query.tags)
        ? req.query.tags
        : [req.query.tags];
      filter.tags = { $in: tags };
    }

    // Search in title, excerpt, and content
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { excerpt: { $regex: req.query.search, $options: "i" } },
        { seoKeywords: { $in: [new RegExp(req.query.search as string, "i")] } },
      ];
    }

    const blogs = await Blog.find(filter)
      .populate("author", "name email")
      .select(
        "title slug excerpt featuredImage imageAlt author category tags seoTitle seoDescription seoKeywords isPublished viewCount createdAt updatedAt"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Blog.countDocuments(filter);

    res.json({
      blogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Get blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
export const getBlogBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOne({
      slug,
      isPublished: true,
    }).populate("author", "name email");

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Increment view count
    blog.viewCount += 1;
    await blog.save();

    // Get related blogs by tags
    const relatedBlogs = await Blog.find({
      _id: { $ne: blog._id },
      tags: { $in: blog.tags },
      isPublished: true,
    })
      .populate("author", "name email")
      .select(
        "title slug excerpt featuredImage imageAlt author category tags seoTitle seoDescription isPublished viewCount createdAt updatedAt"
      )
      .limit(3)
      .lean();

    res.json({
      blog,
      relatedBlogs,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Get blog by ID
// @route   GET /api/blogs/id/:id
// @access  Public (published) / Admin (draft)
export const getBlogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?._id;

    const blog = await Blog.findById(id).populate("author", "name email");

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Only show draft blogs to the author or admin
    if (!blog.isPublished && blog.author._id.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ blog });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Get trending blogs
// @route   GET /api/blogs/trending
// @access  Public
export const getTrendingBlogs = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;

    const blogs = await Blog.find({ isPublished: true })
      .populate("author", "name email")
      .select("title slug excerpt featuredImage imageAlt author category tags seoTitle seoDescription isPublished viewCount createdAt updatedAt")
      .sort({ viewCount: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ blogs });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Get blog categories
// @route   GET /api/blogs/categories
// @access  Public
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Blog.distinct("category", { isPublished: true });

    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => ({
        name: cat,
        count: await Blog.countDocuments({
          category: cat,
          isPublished: true,
        }),
      })),
    );

    res.json({ categories: categoriesWithCount });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Get all tags
// @route   GET /api/blogs/tags
// @access  Public
export const getAllTags = async (req: Request, res: Response) => {
  try {
    const tags = await Blog.distinct("tags", { isPublished: true });

    const tagsWithCount = await Promise.all(
      tags.map(async (tag) => ({
        name: tag,
        count: await Blog.countDocuments({
          tags: tag,
          isPublished: true,
        }),
      })),
    );

    res.json({ tags: tagsWithCount });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
