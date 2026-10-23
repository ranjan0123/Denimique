"use client";

import Image from "@/components/ui/AppImage";
import { resolveApiAssetUrl } from "@/lib/api";
import Link from "next/link";
import { IBlog } from "@/types/blog";
import { Calendar, User, Eye, ArrowRight } from "lucide-react";

interface BlogCardProps {
  blog: IBlog;
  variant?: "grid" | "list";
}

export default function BlogCard({
  blog,
  variant = "grid",
}: BlogCardProps) {
  const formattedDate = new Date(blog.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (variant === "list") {
    return (
      <article className="flex gap-6 pb-8 border-b border-emerald-900/10 hover:shadow-lg transition-shadow duration-300">
        <Link href={`/blog/${blog.slug}`}>
          <div className="relative w-48 h-32 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg">
            <Image
              src={resolveApiAssetUrl(blog.featuredImage)}
              alt={blog.imageAlt}
              fill
              sizes="192px"
              className="object-cover hover:scale-105 transition-transform duration-300"
            />
            {blog.category && (
              <div className="absolute top-2 left-2 bg-[#1B2E27] text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                {blog.category}
              </div>
            )}
          </div>
        </Link>

        <div className="flex flex-col flex-1">
          <Link href={`/blog/${blog.slug}`}>
            <h3 className="text-xl font-bold hover:text-black transition-colors cursor-pointer mb-2">
              {blog.title}
            </h3>
          </Link>

          <p className="text-black text-sm mb-3">{blog.excerpt}</p>

          <div className="flex flex-wrap gap-2 mb-3">
            {blog.tags.slice(0, 3).map((tag) => (
              <Link key={tag} href={`/blog?tags=${tag}`}>
                <span className="bg-[#1B2E27]/15 text-black px-3 py-1 rounded-full text-xs hover:bg-[#1B2E27]/25 cursor-pointer transition-colors">
                  #{tag}
                </span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4 text-black text-sm">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{blog.author.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{blog.viewCount} views</span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="bg-white/90 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 h-full flex flex-col border border-emerald-900/10">
      <Link href={`/blog/${blog.slug}`}>
        <div className="relative w-full h-48 overflow-hidden bg-[#E8E3DD] cursor-pointer">
          <Image
            src={resolveApiAssetUrl(blog.featuredImage)}
            alt={blog.imageAlt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover hover:scale-105 transition-transform duration-300"
          />
          {blog.category && (
            <div className="absolute top-3 left-3 bg-[#1B2E27] text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
              {blog.category}
            </div>
          )}
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-black uppercase tracking-wide">
            {blog.category}
          </span>
          <span className="text-xs text-black">
            {new Date(blog.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        <Link href={`/blog/${blog.slug}`}>
          <h3 className="text-lg font-bold text-black hover:text-black transition-colors cursor-pointer line-clamp-2 mb-2">
            {blog.title}
          </h3>
        </Link>

        <p className="text-black text-sm mb-4 line-clamp-3 flex-1">
          {blog.excerpt}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {blog.tags.slice(0, 2).map((tag) => (
            <Link key={tag} href={`/blog?tags=${tag}`}>
              <span className="bg-[#1B2E27]/15 text-black px-2 py-1 rounded text-xs hover:bg-[#1B2E27]/25 cursor-pointer transition-colors">
                #{tag}
              </span>
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-between text-black text-xs border-t pt-3">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{blog.author.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{blog.viewCount}</span>
          </div>
        </div>

        <Link
          href={`/blog/${blog.slug}`}
          className="mt-4 inline-flex items-center gap-2 text-black hover:text-black font-semibold text-sm transition-colors"
        >
          Read More
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

