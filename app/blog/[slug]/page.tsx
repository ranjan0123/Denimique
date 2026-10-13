import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogDetailClient from "@/components/blog/BlogDetailClient";
import { API_BASE_URL } from "@/lib/apiConfig";

type BlogApiResponse = {
  blog?: {
    title: string;
    excerpt?: string;
    seoTitle?: string;
    seoDescription?: string;
    featuredImage?: string;
    imageAlt?: string;
  };
  relatedBlogs?: unknown[];
};

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

const resolveImageUrl = (value?: string) => {
  if (!value) return "/logo-removebg-preview.png";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${API_ORIGIN}${value}`;
  return `${API_ORIGIN}/${value}`;
};

const getBlogBySlug = async (slug: string) => {
  const response = await fetch(`${API_BASE_URL}/blogs/${slug}`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as BlogApiResponse | { blog: BlogApiResponse["blog"] };
  return ("blog" in data ? data.blog : null) ?? null;
};

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    return {
      title: "Blog Not Found | Denimique",
    };
  }

  const title = blog.seoTitle || blog.title || "Denimique Blog";
  const description =
    blog.seoDescription || blog.excerpt || "Read the latest Denimique blog.";
  const socialImageUrl = resolveImageUrl(blog.featuredImage);

  return {
    title,
    description,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/blog/${slug}`,
      type: "article",
      images: [
        {
          url: socialImageUrl,
          width: 1200,
          height: 630,
          alt: blog.imageAlt || blog.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImageUrl],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function BlogPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  return <BlogDetailClient />;
}
