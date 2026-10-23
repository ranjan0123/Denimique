"use client";

import BlogEditor from "@/components/admin/BlogEditor";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditBlogPage({
  params,
}: {
  params: { id: string };
}) {
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
        <div className="h-24 w-24 rounded-full border-4 border-gray-200 border-t-[#1B2E27] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">Edit Blog</h1>
        <p className="text-black">
          Update your blog post content and SEO settings
        </p>
      </div>

      <BlogEditor />
    </div>
  );
}
