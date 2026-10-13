"use client";

import BlogEditor from "@/components/admin/BlogEditor";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CreateBlogPage() {
  const { checkAuth } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const isAuth = await checkAuth();
      if (!isAuth) {
        router.push("/login");
        return;
      }

      setTimeout(() => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser || !["admin", "superadmin"].includes(currentUser.role || "")) {
          router.push("/");
          return;
        }
        setIsLoading(false);
      }, 100);
    };

    verifyAuth();
  }, [checkAuth, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-24 w-24 rounded-full border-4 border-gray-200 border-t-[#7A3511] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Blog</h1>
        <p className="text-gray-600">
          Create a new blog post with comprehensive content and SEO optimization
        </p>
      </div>

      <BlogEditor />
    </div>
  );
}
