import mongoose, { Document, Schema } from "mongoose";

export interface IHeading {
  level: "h1" | "h2" | "h3";
  text: string;
}

export interface IInternalLink {
  url: string;
  text: string;
}

export interface IBlogContent {
  type: "text" | "heading" | "image" | "list";
  value: string;
  heading?: IHeading;
  imageAlt?: string;
  isList?: boolean;
  listItems?: string[];
}

export interface IBlog extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  content: IBlogContent[];
  excerpt: string;
  featuredImage: string;
  imageAlt: string;
  author: mongoose.Types.ObjectId;
  category: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  internalLinks: IInternalLink[];
  isPublished: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const headingSchema = new Schema<IHeading>({
  level: { type: String, enum: ["h1", "h2", "h3"], required: true },
  text: { type: String, required: true },
});

const internalLinkSchema = new Schema<IInternalLink>({
  url: { type: String, required: true },
  text: { type: String, required: true },
});

const blogContentSchema = new Schema<IBlogContent>({
  type: { type: String, enum: ["text", "heading", "image", "list"], required: true },
  value: { type: String },
  heading: headingSchema,
  imageAlt: { type: String },
  isList: { type: Boolean, default: false },
  listItems: [{ type: String }],
});

const BlogSchema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9-]+$/,
    },
    content: [blogContentSchema],
    excerpt: {
      type: String,
      required: true,
      maxlength: 500,
    },
    featuredImage: {
      type: String,
      required: true,
    },
    imageAlt: {
      type: String,
      required: true,
      maxlength: 150,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "bras",
        "lingerie",
        "bridal",
        "sleepwear",
        "shapewear",
        "style-guide",
        "fabric-care",
        "testimonials",
        "news",
        "general",
      ],
      default: "general",
    },
    tags: {
      type: [String],
      default: [],
    },
    seoTitle: {
      type: String,
      required: true,
      maxlength: 60,
    },
    seoDescription: {
      type: String,
      required: true,
      maxlength: 160,
    },
    seoKeywords: {
      type: [String],
      default: [],
    },
    internalLinks: [internalLinkSchema],
    isPublished: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// Index for better query performance
BlogSchema.index({ isPublished: 1, createdAt: -1 });
BlogSchema.index({ category: 1 });
BlogSchema.index({ tags: 1 });

const Blog = mongoose.model<IBlog>("Blog", BlogSchema);

export default Blog;
