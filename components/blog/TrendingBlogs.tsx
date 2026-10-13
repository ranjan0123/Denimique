"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "@/components/ui/AppImage";
import { resolveApiAssetUrl } from "@/lib/api";
import { blogAPI } from "@/lib/blog";
import { IBlog } from "@/types/blog";
import { TrendingUp } from "lucide-react";

export default function TrendingBlogs() {
  const [blogs, setBlogs] = useState<IBlog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingBlogs = async () => {
      try {
        const res = await blogAPI.getTrendingBlogs(3);
        setBlogs(res.data.blogs);
      } catch (error) {
        console.error("Error fetching trending blogs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingBlogs();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/90 rounded-2xl shadow-sm border border-emerald-900/10 p-5">
        <div className="h-48 bg-[#E8E3DD] rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <section className="bg-white/90 rounded-2xl shadow-sm border border-emerald-900/10 p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-[#7A3511]" />
        <h2 className="text-lg font-semibold text-slate-900">Trending Now</h2>
      </div>

      <div className="space-y-3">
        {blogs.map((blog, index) => (
          <Link
            key={blog._id}
            href={`/blog/${blog.slug}`}
            className="flex gap-3 p-2 rounded-xl hover:bg-[#7A3511]/10 transition-colors group"
          >
            <div className="flex-shrink-0 w-16 h-16 bg-[#E8E3DD] rounded-lg overflow-hidden">
              <Image
                src={resolveApiAssetUrl(blog.featuredImage)}
                alt={blog.imageAlt}
                width={64}
                height={64}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1">
                <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#7A3511] text-white text-[10px] font-bold">
                  {index + 1}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#7A3511] transition-colors line-clamp-2">
                {blog.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span>{blog.viewCount} views</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

