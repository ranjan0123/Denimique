import type { MetadataRoute } from "next";
import { API_BASE_URL } from "@/lib/apiConfig";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://suitablevastra.com";

interface BlogListItem {
  slug: string;
  updatedAt?: string;
  createdAt?: string;
}

interface ProductListItem {
  slug: string;
  updatedAt?: string;
  createdAt?: string;
}

const fetchJson = async <T,>(url: string): Promise<T | null> => {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
};

const fetchAllBlogs = async (): Promise<BlogListItem[]> => {
  const first = await fetchJson<{
    blogs?: BlogListItem[];
    pagination?: { pages?: number };
  }>(`${API_BASE_URL}/blogs?page=1&limit=50`);

  if (!first?.blogs) return [];

  const pages = first.pagination?.pages || 1;
  const results = [...first.blogs];

  for (let page = 2; page <= pages; page += 1) {
    const nextPage = await fetchJson<{ blogs?: BlogListItem[] }>(
      `${API_BASE_URL}/blogs?page=${page}&limit=50`,
    );
    if (nextPage?.blogs?.length) {
      results.push(...nextPage.blogs);
    }
  }

  return results;
};

const fetchProducts = async (): Promise<ProductListItem[]> => {
  const first = await fetchJson<{
    products?: ProductListItem[];
    pagination?: { pages?: number };
  }>(`${API_BASE_URL}/products?page=1&limit=100`);

  if (!first?.products) return [];

  const pages = first.pagination?.pages || 1;
  const results = [...first.products];

  for (let page = 2; page <= pages; page += 1) {
    const nextPage = await fetchJson<{ products?: ProductListItem[] }>(
      `${API_BASE_URL}/products?page=${page}&limit=100`,
    );
    if (nextPage?.products?.length) {
      results.push(...nextPage.products);
    }
  }

  return results;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "/",
    "/about",
    "/contact",
    "/shop",
    "/blog",
    "/shipping-policy",
    "/refund-and-cancellation-policy",
    "/privacy-policy",
    "/terms-of-service",
  ];

  const [blogs, products] = await Promise.all([
    fetchAllBlogs(),
    fetchProducts(),
  ]);

  const now = new Date();

  const staticEntries = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: route === "/" ? 1 : 0.7,
  }));

  const blogEntries = blogs
    .filter((blog) => blog.slug)
    .map((blog) => ({
      url: `${SITE_URL}/blog/${blog.slug}`,
      lastModified: blog.updatedAt
        ? new Date(blog.updatedAt)
        : blog.createdAt
          ? new Date(blog.createdAt)
          : now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  const productEntries = products
    .filter((product) => product.slug)
    .map((product) => ({
      url: `${SITE_URL}/products/${product.slug}`,
      lastModified: product.updatedAt
        ? new Date(product.updatedAt)
        : product.createdAt
          ? new Date(product.createdAt)
          : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [...staticEntries, ...blogEntries, ...productEntries];
}




