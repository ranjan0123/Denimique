"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Menu } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { refreshAccessToken } from "@/lib/api";
import AdminSidebar from "@/components/admin/AdminSidebar";

// Access tokens are short-lived (1h); refresh them in the background well
// before they expire so a long product-form session never gets interrupted
// mid-task waiting on a reactive 401 retry.
const PROACTIVE_REFRESH_INTERVAL_MS = 45 * 60 * 1000;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, hasInitialized, isLoading, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isLoginRoute = pathname === "/admin/login";

  const isAdmin = useMemo(
    () => !!user && ["admin", "superadmin"].includes(user.role || ""),
    [user],
  );

  useEffect(() => {
    if (isLoginRoute || !hasInitialized || isLoading) return;

    if (!isAuthenticated || !isAdmin) {
      const redirectTo = pathname ? `?redirect=${encodeURIComponent(pathname)}` : "";
      router.replace(`/admin/login${redirectTo}`);
    }
  }, [isLoginRoute, hasInitialized, isLoading, isAuthenticated, isAdmin, router, pathname]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;

    const interval = setInterval(() => {
      refreshAccessToken().catch(() => {
        // A hard failure here (e.g. refresh cookie truly expired after a
        // week) is already handled by refreshAccessToken clearing auth
        // state; the next navigation/guard effect will redirect to login.
      });
    }, PROACTIVE_REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isAuthenticated, isAdmin]);

  // The login screen is public and renders its own full-page layout.
  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (!hasInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-[#7A3511] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      router.replace("/admin/login");
    }
  };

  return (
    <div className="admin-panel-theme flex min-h-screen bg-slate-50">
      <AdminSidebar
        isSuperAdmin={user?.role === "superadmin"}
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <Link href="/admin" className="text-sm font-semibold text-slate-900 lg:hidden">
              Denimique Admin
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">
                {user?.name || user?.email}
              </p>
              <p className="text-xs capitalize text-slate-500">{user?.role}</p>
            </div>
            <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#7A3511]/10 text-sm font-semibold text-[#7A3511] sm:flex">
              {(user?.name || user?.email || "?").charAt(0).toUpperCase()}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              <LogOut size={14} />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
