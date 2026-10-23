"use client";

import AdminBlogList from "@/components/admin/AdminBlogList";
import Link from "next/link";
import { Plus, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { blogAPI } from "@/lib/blog";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function AdminBlogsPage() {
  const { checkAuth } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalBlogs: 0,
    publishedBlogs: 0,
    draftBlogs: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const isAuth = await checkAuth();
      if (!isAuth) {
        router.push("/login");
        return;
      }

      setTimeout(async () => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser || !["admin", "superadmin"].includes(currentUser.role || "")) {
          router.push("/");
          return;
        }

        try {
          const res = await blogAPI.getBlogAnalytics();
          setStats(res.data.stats);
        } catch (error) {
          console.error("Error fetching analytics:", error);
        } finally {
          setLoading(false);
        }
      }, 100);
    };

    verifyAuth();
  }, [checkAuth, router]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-black">Blog Management</h1>
        <Link
          href="/admin/blogs/create"
          className="flex items-center gap-2 bg-[#1B2E27] hover:bg-[#5A260F] text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Blog
        </Link>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-black text-sm">Total Blogs</p>
                <p className="text-3xl font-bold text-black">
                  {stats.totalBlogs}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-black opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-black text-sm">Published</p>
                <p className="text-3xl font-bold text-black">
                  {stats.publishedBlogs}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-black opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-black text-sm">Drafts</p>
                <p className="text-3xl font-bold text-black">
                  {stats.draftBlogs}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-black opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-black text-sm">Total Views</p>
                <p className="text-3xl font-bold text-black">
                  {stats.totalViews.toLocaleString()}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-black opacity-20" />
            </div>
          </div>
        </div>
      )}

      {/* Blog List */}
      <AdminBlogList />
    </div>
  );
}
