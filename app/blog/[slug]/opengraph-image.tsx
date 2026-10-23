/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { API_BASE_URL } from "@/lib/apiConfig";

type BlogApiResponse = {
  blog?: {
    title?: string;
    seoTitle?: string;
    featuredImage?: string;
  };
};

export const alt = "Denimique blog";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://suitablevastra.com";
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

const getBlogBySlug = async (slug: string) => {
  const response = await fetch(`${API_BASE_URL}/blogs/${slug}`, {
    next: { revalidate: 300 },
  });
  if (!response.ok) return null;
  const data = (await response.json()) as BlogApiResponse | { blog: BlogApiResponse["blog"] };
  return ("blog" in data ? data.blog : null) ?? null;
};

const toAbsoluteUrl = (value?: string) => {
  if (!value) return `${SITE_URL}/logo-removebg-preview.png`;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${API_ORIGIN}${value}`;
  return `${API_ORIGIN}/${value}`;
};

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let title = "Denimique Blog";
  let image = `${SITE_URL}/logo-removebg-preview.png`;

  try {
    const blog = await getBlogBySlug(slug);
    if (blog) {
      title = blog.seoTitle || blog.title || title;
      image = toAbsoluteUrl(blog.featuredImage);
    }
  } catch {
    // Keep fallback card if blog lookup fails.
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#FFFFFF",
          color: "#000000",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <img
          src={image}
          alt={title}
          width={1200}
          height={630}
          style={{
            position: "absolute",
            inset: 0,
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(120deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.2) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "48px 56px",
            color: "#FFFFFF",
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 1 }}>
            DENIMIQUE BLOG
          </div>
          <div
            style={{
              fontSize: 58,
              lineHeight: 1.08,
              fontWeight: 700,
              maxWidth: 1020,
            }}
          >
            {title}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
