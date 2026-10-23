"use client";

import { useState } from "react";
import { IBlog } from "@/types/blog";
import BlogCard from "@/components/blog/BlogCard";
import TrendingBlogs from "@/components/blog/TrendingBlogs";
import { Search } from "lucide-react";
import Image from "@/components/ui/AppImage";
import Link from "next/link";
import { resolveApiAssetUrl } from "@/lib/api";

interface BlogPageClientProps {
  initialBlogs: IBlog[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  initialCategory?: string | null;
  initialTags?: string[];
  initialSearch?: string;
  initialError?: string | null;
}

export default function BlogPageClient({
  initialBlogs,
  initialPagination,
  initialCategory = null,
  initialTags = [],
  initialSearch = "",
  initialError = null,
}: BlogPageClientProps) {
  const blogs = initialBlogs;
  const pagination = initialPagination;
  const category = initialCategory;
  const tags = initialTags;
  const search = initialSearch;
  const [query, setQuery] = useState(initialSearch);
  const [prevInitialSearch, setPrevInitialSearch] = useState(initialSearch);
  if (initialSearch !== prevInitialSearch) {
    setPrevInitialSearch(initialSearch);
    setQuery(initialSearch);
  }

  const featuredBlogs = blogs.slice(0, 6);
  const listBlogs = blogs.slice(3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#936965]/15 via-[#F6F1EC] to-[#1B2E27]/15 text-black">
      <div className="relative overflow-hidden bg-[#10191C] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,180,0,0.18),_transparent_40%),radial-gradient(circle_at_85%_15%,_rgba(147,105,101,0.25),_transparent_35%)]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          {/* <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-4 py-1 text-xs font-semibold tracking-[0.2em] text-black">
            BLOG
          </span> */}
          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white">
            The Denimique Journal
          </h1>
          <p className="mt-5 text-base sm:text-lg text-white/80 max-w-2xl mx-auto leading-7">
            Fit guides, styling edits, and denim care advice from the
            Denimique team. Everything you need to get more out of your
            denim, in one place.
          </p>

          <form className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="relative w-full sm:w-[460px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search fit guides, styling, denim care..."
                className="w-full rounded-full border border-white/40 bg-white/95 px-10 py-3.5 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B2E27]/50"
              />
            </div>
            <Link
              href={`?search=${encodeURIComponent(query)}`}
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black shadow-md shadow-black/10 hover:bg-[#F5F1EA] transition-colors"
            >
              Find Now
            </Link>
          </form>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-white/70">
            {[
              { label: "Style Guide", value: "style-guide" },
              { label: "Fabric Care", value: "fabric-care" },
              { label: "News", value: "news" },
              { label: "Testimonials", value: "testimonials" },
              { label: "General", value: "general" },
            ].map((chip) => (
              <Link
                key={chip.value}
                href={`?category=${chip.value}`}
                className={`rounded-full border px-3 py-1 transition-colors ${
                  category === chip.value
                    ? "border-[#D4AF37] bg-[#D4AF37]/20 text-white"
                    : "border-white/35 bg-white/10 hover:bg-white/20"
                }`}
              >
                {chip.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {initialError && (
          <div className="bg-red-50 text-black p-6 rounded-lg text-center">
            <p>{initialError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center rounded-full bg-[#1B2E27] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5A260F] transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {blogs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-black text-lg font-medium">
              No blog posts are published yet.
            </p>
            <p className="mt-2 text-black">
              Explore our products while fresh articles are being prepared.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex items-center rounded-full bg-[#1B2E27] px-6 py-3 text-sm font-semibold text-white hover:bg-[#5A260F] transition-colors"
            >
              Visit Shop
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-10">
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
                  <h2 className="text-xl font-semibold text-black">
                    Editor&apos;s Highlights
                  </h2>
                  <span className="text-xs font-semibold text-black">
                    Top Picks
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredBlogs.map((blog) => (
                    <Link
                      key={blog._id}
                      href={`/blog/${blog.slug}`}
                      className="group relative overflow-hidden rounded-3xl bg-slate-100 shadow-md shadow-slate-200/60"
                    >
                      <div className="relative h-72">
                        <Image
                          src={resolveApiAssetUrl(blog.featuredImage)}
                          alt={blog.imageAlt || blog.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-black">
                          {blog.category}
                        </span>
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                          <p className="text-xs text-white/70">
                            {blog.createdAt
                              ? new Date(blog.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : ""}
                            {blog.excerpt
                              ? ` - ${Math.max(
                                  2,
                                  Math.ceil(
                                    blog.excerpt.trim().split(/\\s+/).length / 160,
                                  ),
                                )} min read`
                              : ""}
                          </p>
                          <h3 className="text-lg font-semibold leading-tight">
                            {blog.title}
                          </h3>
                          <p className="mt-2 text-xs text-white/80 line-clamp-4">
                            {blog.excerpt}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-black border-b border-slate-200 pb-3">
                    Featured
                  </h3>
                  <div className="mt-4 space-y-4">
                    {blogs.slice(0, 3).map((blog) => (
                      <Link
                        key={blog._id}
                        href={`/blog/${blog.slug}`}
                        className="flex items-start gap-3"
                      >
                        <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-slate-100">
                          <Image
                            src={resolveApiAssetUrl(blog.featuredImage)}
                            alt={blog.imageAlt || blog.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-xs text-black">
                            {blog.createdAt
                              ? new Date(blog.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : ""}
                          </p>
                          <p className="text-sm font-semibold text-black leading-snug">
                            {blog.title}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

               
                    <TrendingBlogs />
            
              </div>
            </div>

            {listBlogs.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-black">
                  More Articles
                </h3>
                <div className="space-y-8">
                  {listBlogs.map((blog) => (
                    <BlogCard key={blog._id} blog={blog} variant="list" />
                  ))}
                </div>
              </div>
            )}

            {pagination.pages > 1 && (
              <nav className="flex items-center justify-center gap-2 mt-10">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <a
                      key={pageNum}
                      href={`?page=${pageNum}${category ? "&category=" + category : ""}${tags.length > 0 ? "&tags=" + tags.join("&tags=") : ""}${search ? "&search=" + search : ""}`}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        pageNum === pagination.page
                          ? "bg-[#1B2E27] text-white font-semibold"
                          : "bg-white text-black border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </a>
                  ),
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}

