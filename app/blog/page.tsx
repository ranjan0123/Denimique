import BlogPageClient from "@/components/blog/BlogPageClient";
import type { Metadata } from "next";
import { API_BASE_URL } from "@/lib/apiConfig";
import type { IBlog, IBlogListResponse } from "@/types/blog";

export const metadata: Metadata = {
  title: "Fashion Blog - Style Tips & Trend Guides | Denimique",
  description:
    "Read Denimique's fashion blog for style tips, fabric guides, styling insights, and practical wardrobe ideas.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Fashion Blog - Style Tips & Trend Guides | Denimique",
    description:
      "Explore expert tips and ideas on fabric care, styling, and wardrobe essentials.",
    url: "/blog",
    type: "website",
    images: ["/logo-removebg-preview.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fashion Blog - Style Tips & Trend Guides | Denimique",
    description:
      "Style tips, fabric guides, and wardrobe ideas from Denimique.",
    images: ["/logo-removebg-preview.png"],
  },
};

type BlogPageSearchParams = Record<string, string | string[] | undefined>;

const BLOG_FALLBACK_ERROR = "Unable to load blogs right now. Please try again.";

const toSearchValue = (value?: string | string[]): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

const toTagValues = (value?: string | string[]): string[] => {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
};

const getBlogInitialData = async (searchParams: BlogPageSearchParams) => {
  const pageRaw = toSearchValue(searchParams.page);
  const page = Number.parseInt(pageRaw || "1", 10);
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;

  const category = toSearchValue(searchParams.category);
  const tags = toTagValues(searchParams.tags);
  const search = toSearchValue(searchParams.search);

  const params = new URLSearchParams();
  params.set("page", String(safePage));
  params.set("limit", "10");
  if (category) params.set("category", category);
  if (tags.length > 0) {
    tags.forEach((tag) => params.append("tags", tag));
  }
  if (search) params.set("search", search);

  try {
    const response = await fetch(`${API_BASE_URL}/blogs?${params.toString()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Blog fetch failed with status ${response.status}`);
    }

    const data = (await response.json()) as IBlogListResponse;

    return {
      blogs: data.blogs || [],
      pagination: data.pagination || {
        page: safePage,
        limit: 10,
        total: 0,
        pages: 0,
      },
      category: category || null,
      tags,
      search: search || "",
      error: null,
    };
  } catch (error) {
    console.error("Failed to fetch blogs on server:", error);
    return {
      blogs: [] as IBlog[],
      pagination: { page: safePage, limit: 10, total: 0, pages: 0 },
      category: category || null,
      tags,
      search: search || "",
      error: BLOG_FALLBACK_ERROR,
    };
  }
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<BlogPageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const { blogs, pagination, category, tags, search, error } =
    await getBlogInitialData(resolvedSearchParams);

  return (
    <main>
      <h1 className="sr-only">Fashion Blog - Style Tips &amp; Trend Guides</h1>
      <BlogPageClient
        initialBlogs={blogs}
        initialPagination={pagination}
        initialCategory={category}
        initialTags={tags}
        initialSearch={search}
        initialError={error}
      />
    </main>
  );
}
