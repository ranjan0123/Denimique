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

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [adminAccessError, setAdminAccessError] = useState("");
  const [networkError, setNetworkError] = useState("");

  const redirectPath = (() => {
    const value = searchParams.get("redirect");

    if (value?.startsWith("/admin/") || value === "/admin") {
      return value;
    }

    return "/admin";
  })();

  useEffect(() => {
    clearError();
    setAdminAccessError("");
    setNetworkError("");
  }, [clearError]);

  useEffect(() => {
    if (!hasInitialized || !isAuthenticated) return;

    if (user && ["admin", "superadmin"].includes(user.role || "")) {
      router.replace(redirectPath);
    } else if (user) {
      router.replace("/");
    }
  }, [hasInitialized, isAuthenticated, user, router, redirectPath]);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    const email = formData.email.trim();

    if (!email) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      nextErrors.password = "Password is required";
    }

    setFormErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setFormErrors((prev) => ({
      ...prev,
      [field]: "",
    }));

    setAdminAccessError("");
    setNetworkError("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    clearError();
    setAdminAccessError("");
    setNetworkError("");

    if (!validateForm()) return;

    try {
      const normalizedEmail = formData.email.trim().toLowerCase();

      // Authenticate using your existing backend/auth store.
      await login(normalizedEmail, formData.password);

      // Read the latest user after login completes.
      const authState = useAuthStore.getState();
      const currentUser = authState.user;

      if (!authState.isAuthenticated || !currentUser) {
        setNetworkError(
          "Login did not complete. Please check your credentials and backend response.",
        );
        return;
      }

      // Never allow a customer account into the admin dashboard.
      if (!["admin", "superadmin"].includes(currentUser.role || "")) {
        await logout();

        setAdminAccessError(
          "Your account is not authorized for admin access. Please use an admin account.",
        );

        return;
      }

      // Successful admin login.
      router.replace(redirectPath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";

      const looksLikeNetworkError =
        /network|failed to fetch|fetch failed|connection|timeout|cors/i.test(
          message,
        );

      setNetworkError(
        looksLikeNetworkError
          ? "Cannot connect to the login server. Check your backend URL, server status, and CORS configuration."
          : message || "Login failed. Please try again.",
      );
    }
  };

  const displayedError =
    adminAccessError || networkError || error?.message || "";

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-8 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full rounded-[32px] border border-[#e7d3bf] bg-white p-6 shadow-[0_30px_80px_rgba(52,32,22,0.12)] sm:p-8"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1B2E27] text-white shadow-lg shadow-[#1B2E27]/20">
              <Lock className="h-8 w-8" />
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-black">
              Secure sign in
            </p>

            <h2 className="mt-2 text-3xl font-bold text-black">
              Admin login
            </h2>

            <p className="mt-2 text-sm text-black">
              Sign in to access your dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="admin-email"
                className="mb-2 block text-sm font-medium text-black"
              >
                Email address
              </label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />

                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(event) =>
                    handleInputChange("email", event.target.value)
                  }
                  autoComplete="username"
                  placeholder="Enter your admin email"
                  disabled={isLoading}
                  className={`w-full rounded-2xl border bg-[#fffdfb] py-3.5 pl-11 pr-4 text-sm text-black outline-none transition focus:ring-2 ${
                    formErrors.email
                      ? "border-red-300 focus:ring-red-200"
                      : "border-[#ead7c6] focus:border-[#c57b4d] focus:ring-[#f2d9ae]"
                  }`}
                />
              </div>

              {formErrors.email && (
                <p className="mt-2 text-sm text-black">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-sm font-medium text-black"
              >
                Password
              </label>

              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />

                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(event) =>
                    handleInputChange("password", event.target.value)
                  }
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className={`w-full rounded-2xl border bg-[#fffdfb] py-3.5 pl-11 pr-12 text-sm text-black outline-none transition focus:ring-2 ${
                    formErrors.password
                      ? "border-red-300 focus:ring-red-200"
                      : "border-[#ead7c6] focus:border-[#c57b4d] focus:ring-[#f2d9ae]"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black transition hover:text-black"
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
                <p className="mt-2 text-sm text-black">
                  {formErrors.password}
                </p>
              )}
            </div>

            {displayedError && (
              <div
                role="alert"
                className="break-words rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-black"
              >
                {displayedError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1B2E27] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#1B2E27]/20 transition hover:bg-[#5d260d] disabled:cursor-not-allowed disabled:opacity-60"
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

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#f0e4d8] pt-5 text-xs text-black">
            <Link
              href="/forgot-password"
              className="font-medium text-black hover:text-black"
            >
              Forgot password?
            </Link>

            <Link
              href="/login"
              className="font-medium text-black hover:text-black"
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
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1B2E27] border-t-transparent" />
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}
