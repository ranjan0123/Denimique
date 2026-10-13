"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    login,
    logout,
    isLoading,
    error,
    clearError,
    isAuthenticated,
    hasInitialized,
    user,
  } = useAuthStore();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [adminAccessError, setAdminAccessError] = useState("");

  const redirectPath = (() => {
    const value = searchParams.get("redirect");
    if (value && value.startsWith("/admin")) return value;
    return "/admin";
  })();

  useEffect(() => {
    clearError();

    setAdminAccessError("");
  }, [clearError]);

  useEffect(() => {
    if (!hasInitialized || !isAuthenticated) return;

    if (user && ["admin", "superadmin"].includes(user.role || "")) {
      router.replace(redirectPath);
      return;
    }

    if (user) {
      router.replace("/");
    }
  }, [hasInitialized, isAuthenticated, user, router, redirectPath]);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      nextErrors.password = "Password is required";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (adminAccessError) {
      setAdminAccessError("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAdminAccessError("");

    if (!validateForm()) {
      return;
    }

    try {
      const normalizedEmail = formData.email.trim().toLowerCase();
      await login(normalizedEmail, formData.password);

      const currentUser = useAuthStore.getState().user;
      if (
        !currentUser ||
        !["admin", "superadmin"].includes(currentUser.role || "")
      ) {
        await logout();
        setAdminAccessError("This account does not have admin access.");
        return;
      }

      router.replace(redirectPath);
    } catch {
      // Error is already surfaced by the auth store and displayed below.
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f1ea] text-[#1d140f]">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-8 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full rounded-[32px] border border-[#e7d3bf] bg-white p-6 shadow-[0_30px_80px_rgba(52,32,22,0.12)] sm:p-8"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7A3511] text-[#f4d88a] shadow-lg shadow-[#7A3511]/20">
              <Lock className="h-8 w-8" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#a1633d]">
              Secure sign in
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[#241813]">
              Admin login
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="admin-email"
                className="mb-2 block text-sm font-medium text-[#3f2d27]"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a1816c]" />
                <input
                  id="admin-email"
                  type="email"
                  value={formData.email}
                  onChange={(event) =>
                    handleInputChange("email", event.target.value)
                  }
                  autoComplete="email"
                  placeholder="admin@example.com"
                  disabled={isLoading}
                  className={`w-full rounded-2xl border bg-[#fffdfb] py-3.5 pl-11 pr-4 text-sm text-[#140d0b] outline-none transition focus:ring-2 ${
                    formErrors.email
                      ? "border-red-300 focus:ring-red-200"
                      : "border-[#ead7c6] focus:border-[#c57b4d] focus:ring-[#f2d9ae]"
                  }`}
                />
              </div>
              {formErrors.email && (
                <p className="mt-2 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-sm font-medium text-[#3f2d27]"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a1816c]" />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(event) =>
                    handleInputChange("password", event.target.value)
                  }
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className={`w-full rounded-2xl border bg-[#fffdfb] py-3.5 pl-11 pr-12 text-sm text-[#140d0b] outline-none transition focus:ring-2 ${
                    formErrors.password
                      ? "border-red-300 focus:ring-red-200"
                      : "border-[#ead7c6] focus:border-[#c57b4d] focus:ring-[#f2d9ae]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7a5648] transition hover:text-[#3b261c]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="mt-2 text-sm text-red-600">
                  {formErrors.password}
                </p>
              )}
            </div>

            {(error || adminAccessError) && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {adminAccessError || error?.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7A3511] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#7A3511]/20 transition hover:bg-[#5d260d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in to dashboard
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#f0e4d8] pt-5 text-xs text-[#6c5448]">
            <Link
              href="/forgot-password"
              className="font-medium text-[#7A3511] hover:text-[#52230d]"
            >
              Forgot password?
            </Link>
            <Link
              href="/login"
              className="font-medium text-[#7A3511] hover:text-[#52230d]"
            >
              Customer login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f7f1ea]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#7A3511] border-t-transparent" />
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}
