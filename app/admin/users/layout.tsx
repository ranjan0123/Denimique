"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function AdminUsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, hasInitialized, isLoading } = useAuthStore();

  const isSuperAdmin = useMemo(
    () => !!user && user.role === "superadmin",
    [user],
  );

  useEffect(() => {
    if (!hasInitialized || isLoading) return;

    if (!isAuthenticated) {
      const redirectTo = pathname ? `?redirect=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${redirectTo}`);
      return;
    }

    if (!isSuperAdmin) {
      router.replace("/admin");
    }
  }, [hasInitialized, isLoading, isAuthenticated, isSuperAdmin, router, pathname]);

  if (!hasInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-[#0B0F6B] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return null;
  }

  return <>{children}</>;
}
