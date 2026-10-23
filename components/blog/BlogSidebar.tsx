"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { blogAPI } from "@/lib/blog";
import { ICategoryWithCount, ITagWithCount } from "@/types/blog";
import { ChevronDown } from "lucide-react";

export default function BlogSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<ICategoryWithCount[]>([]);
  const [tags, setTags] = useState<ITagWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    tags: true,
  });

  const activeCategory = searchParams.get("category");
  const activeTags = searchParams.getAll("tags");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, tagsRes] = await Promise.all([
          blogAPI.getCategories(),
          blogAPI.getAllTags(),
        ]);
        setCategories(categoriesRes.data.categories);
        setTags(tagsRes.data.tags);
      } catch (error) {
        console.error("Error fetching filter data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get("category") === category) {
      params.delete("category");
    } else {
      params.set("category", category);
      params.set("page", "1");
    }
    router.push(`/blog?${params.toString()}`);
  };

  const handleTagClick = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentTags = params.getAll("tags");

    if (currentTags.includes(tag)) {
      params.delete("tags");
      currentTags.filter((t) => t !== tag).forEach((t) => {
        params.append("tags", t);
      });
    } else {
      params.append("tags", tag);
    }

    params.set("page", "1");
    router.push(`/blog?${params.toString()}`);
  };

  const handleClearFilters = () => {
    router.push("/blog");
  };

  if (loading) {
    return (
      <aside className="space-y-6">
        <div className="h-20 bg-gray-200 rounded animate-pulse" />
        <div className="h-48 bg-gray-200 rounded animate-pulse" />
      </aside>
    );
  }

  const hasActiveFilters = activeCategory || activeTags.length > 0;

  return (
    <aside className="bg-white rounded-lg shadow-md p-6 h-fit sticky top-24">
      {/* Search */}
      <div className="mb-6">
        <h3 className="font-bold text-black mb-3">Search</h3>
        <input
          type="text"
          placeholder="Search blogs..."
          defaultValue={searchParams.get("search") || ""}
          onChange={(e) => {
            const params = new URLSearchParams(searchParams.toString());
            if (e.target.value) {
              params.set("search", e.target.value);
            } else {
              params.delete("search");
            }
            params.set("page", "1");
            router.push(`/blog?${params.toString()}`);
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Categories */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <button
          onClick={() =>
            setExpandedSections((prev) => ({
              ...prev,
              categories: !prev.categories,
            }))
          }
          className="w-full flex items-center justify-between font-bold text-black mb-3 hover:text-black transition-colors"
        >
          Categories
          <ChevronDown
            className={`w-5 h-5 transition-transform ${
              expandedSections.categories ? "" : "-rotate-90"
            }`}
          />
        </button>

        {expandedSections.categories && (
          <div className="space-y-2">
            {categories.map((category) => (
              <label
                key={category.name}
                className="flex items-center cursor-pointer hover:text-black transition-colors"
              >
                <input
                  type="checkbox"
                  checked={activeCategory === category.name}
                  onChange={() => handleCategoryClick(category.name)}
                  className="rounded border-gray-300 text-black focus:ring-blue-500 mr-3"
                />
                <span className="text-black">
                  {category.name}
                  <span className="text-black text-sm ml-2">
                    ({category.count})
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="mb-6">
        <button
          onClick={() =>
            setExpandedSections((prev) => ({
              ...prev,
              tags: !prev.tags,
            }))
          }
          className="w-full flex items-center justify-between font-bold text-black mb-3 hover:text-black transition-colors"
        >
          Tags
          <ChevronDown
            className={`w-5 h-5 transition-transform ${
              expandedSections.tags ? "" : "-rotate-90"
            }`}
          />
        </button>

        {expandedSections.tags && (
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 15).map((tag) => (
              <button
                key={tag.name}
                onClick={() => handleTagClick(tag.name)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  activeTags.includes(tag.name)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-black hover:bg-gray-200"
                }`}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={handleClearFilters}
          className="w-full bg-red-100 hover:bg-red-200 text-black font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Clear Filters
        </button>
      )}
    </aside>
  );
}
