import { Request, Response } from "express";
import Blog, { IBlog } from "../models/Blog";
import { uploadImageToCloudinary } from "../utils/cloudinaryUpload";

// @desc    Create new blog post
// @route   POST /api/admin/blogs
// @access  Admin
export const createBlog = async (req: Request, res: Response) => {
  try {
    const {
      title,
      slug,
      content,
      excerpt,
      imageAlt,
      category,
      tags,
      seoTitle,
      seoDescription,
      seoKeywords,
      internalLinks,
      isPublished,
    } = req.body;

    const featuredImage = req.file
      ? await uploadImageToCloudinary(req.file, "blogs")
      : null;

    // Validate required fields
    if (!title || !slug || !excerpt || !seoTitle || !seoDescription) {
      return res
        .status(400)
        .json({ message: "Missing required fields" });
    }

    // Check if slug already exists
    const existingBlog = await Blog.findOne({ slug });
    if (existingBlog) {
      return res.status(400).json({ message: "Slug already exists" });
    }

    const blog = new Blog({
      title,
      slug: slug.toLowerCase().trim().replace(/\s+/g, "-"),
      content: content ? JSON.parse(content) : [],
      excerpt,
      featuredImage,
      imageAlt,
      author: (req as any).user._id,
      category: category || "general",
      tags: tags ? JSON.parse(tags) : [],
      seoTitle,
      seoDescription,
      seoKeywords: seoKeywords ? JSON.parse(seoKeywords) : [],
      internalLinks: internalLinks ? JSON.parse(internalLinks) : [],
      isPublished: isPublished === "true" || false,
    });

    await blog.save();
    await blog.populate("author", "name email");

    res.status(201).json({
      message: "Blog created successfully",
      blog,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Get all blogs (published and draft) for admin
// @route   GET /api/admin/blogs
// @access  Admin
export const getAllBlogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    // Filter by status
    if (req.query.status === "published") {
      filter.isPublished = true;
    } else if (req.query.status === "draft") {
      filter.isPublished = false;
    }

    // Filter by category
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Search
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { slug: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const blogs = await Blog.find(filter)
      .populate("author", "name email")
      .select(
        "title slug category isPublished viewCount createdAt updatedAt author featured"
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

// @desc    Get blog by ID for editing
// @route   GET /api/admin/blogs/:id
// @access  Admin
export const getBlogForEdit = async (req: Request, res: Response) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("author", "name email");

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json({ blog });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Update blog post
// @route   PUT /api/admin/blogs/:id
// @access  Admin
export const updateBlog = async (req: Request, res: Response) => {
  try {
    const {
      title,
      slug,
      content,
      excerpt,
      imageAlt,
      category,
      tags,
      seoTitle,
      seoDescription,
      seoKeywords,
      internalLinks,
      isPublished,
    } = req.body;

    let blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Check if slug is being changed and if new slug already exists
    if (slug && slug !== blog.slug) {
      const existingBlog = await Blog.findOne({
        slug: slug.toLowerCase().trim().replace(/\s+/g, "-"),
      });
      if (existingBlog) {
        return res.status(400).json({ message: "Slug already exists" });
      }
    }

    // Handle image upload
    if (req.file) {
      blog.featuredImage = await uploadImageToCloudinary(req.file, "blogs");
    }

    // Update fields
    blog.title = title || blog.title;
    blog.slug = slug
      ? slug.toLowerCase().trim().replace(/\s+/g, "-")
      : blog.slug;
    blog.content = content ? JSON.parse(content) : blog.content;
    blog.excerpt = excerpt || blog.excerpt;
    blog.imageAlt = imageAlt || blog.imageAlt;
    blog.category = category || blog.category;
    blog.tags = tags ? JSON.parse(tags) : blog.tags;
    blog.seoTitle = seoTitle || blog.seoTitle;
    blog.seoDescription = seoDescription || blog.seoDescription;
    blog.seoKeywords = seoKeywords
      ? JSON.parse(seoKeywords)
      : blog.seoKeywords;
    blog.internalLinks = internalLinks
      ? JSON.parse(internalLinks)
      : blog.internalLinks;
    blog.isPublished = isPublished === "true" ? true : false;

    await blog.save();
    await blog.populate("author", "name email");

    res.json({
      message: "Blog updated successfully",
      blog,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Upload inline blog image
// @route   POST /api/admin/blogs/upload-image
// @access  Admin
export const uploadBlogInlineImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const url = await uploadImageToCloudinary(req.file, "blogs");
    res.json({ url });
  } catch (error) {
    res.status(500).json({ message: "Failed to upload image" });
  }
};

// @desc    Delete blog post
// @route   DELETE /api/admin/blogs/:id
// @access  Admin
export const deleteBlog = async (req: Request, res: Response) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    await Blog.findByIdAndDelete(req.params.id);

    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Publish/Unpublish blog
// @route   PATCH /api/admin/blogs/:id/publish
// @access  Admin
export const publishBlog = async (req: Request, res: Response) => {
  try {
    const { isPublished } = req.body;
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { isPublished },
      { new: true },
    ).populate("author", "name email");

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json({
      message: isPublished ? "Blog published" : "Blog unpublished",
      blog,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Get blog analytics
// @route   GET /api/admin/blogs/analytics
// @access  Admin
export const getBlogAnalytics = async (req: Request, res: Response) => {
  try {
    const totalBlogs = await Blog.countDocuments();
    const publishedBlogs = await Blog.countDocuments({ isPublished: true });
    const draftBlogs = await Blog.countDocuments({ isPublished: false });

    const totalViews = await Blog.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$viewCount" },
        },
      },
    ]);

    const topBlogs = await Blog.find({ isPublished: true })
      .populate("author", "name email")
      .select("title slug viewCount createdAt")
      .sort({ viewCount: -1 })
      .limit(5)
      .lean();

    res.json({
      stats: {
        totalBlogs,
        publishedBlogs,
        draftBlogs,
        totalViews: totalViews[0]?.totalViews || 0,
      },
      topBlogs,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
