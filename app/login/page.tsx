"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowRight, LogIn } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import FullWidthGoogleLogin from "@/components/ui/FullWidthGoogleLogin";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    login,
    googleLogin,
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

  const [googleLoading, setGoogleLoading] = useState(false);

  const isSubmittingRef = useRef(false);

  const redirectValue = searchParams.get("redirect");
  const requestedRedirect =
    redirectValue?.startsWith("/") && !redirectValue.startsWith("//")
      ? redirectValue
      : null;
  const getRedirectPath = (role?: string) => {
    const isAdmin = role === "admin" || role === "superadmin";
    const adminDestination =
      requestedRedirect === "/admin" || requestedRedirect?.startsWith("/admin/");
    if (adminDestination && !isAdmin) return "/";
    return requestedRedirect || (isAdmin ? "/admin" : "/");
  };
  const redirectPath = getRedirectPath(user?.role);

  useEffect(() => {
    if (!hasInitialized) return;

    if (isAuthenticated) {
      console.log(
        "[LOGIN] User already authenticated. Redirecting to:",
        redirectPath,
      );

      router.replace(redirectPath);
    }
  }, [hasInitialized, isAuthenticated, redirectPath, router]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  // ===============================
  // VALIDATE FORM
  // ===============================

  const validateForm = () => {
    const errors: Record<string, string> = {};

    const email = formData.email.trim();

    if (!email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  // ===============================
  // INPUT CHANGE
  // ===============================

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (error) {
      clearError();
    }

    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // ===============================
  // MAIN LOGIN FUNCTION
  // ===============================

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log("================================");
    console.log("[LOGIN] MAIN FUNCTION STARTED");
    console.log("================================");

    // CONDITION POINT
    if (isLoading || isSubmittingRef.current) {
      console.log("[LOGIN] Login already in progress");
      return;
    }

    clearError();

    // VALIDATION POINT
    if (!validateForm()) {
      toast.error("Please check your email and password");

      return;
    }

    const normalizedEmail = formData.email.trim().toLowerCase();

    console.log("[LOGIN] Email:", normalizedEmail);
    console.log("[LOGIN] Calling auth store login...");

    isSubmittingRef.current = true;

    try {
      // ===============================
      // CALL LOGIN FUNCTION
      // ===============================

      await login(normalizedEmail, formData.password);

      const currentUser = useAuthStore.getState().user;
      const destination = getRedirectPath(currentUser?.role);

      console.log("[LOGIN] Login function completed successfully");

      toast.success("Welcome back to Denimique!");

      console.log("[LOGIN] Redirecting to:", destination);

      router.replace(destination);
    } catch (err) {
      // Expected auth failures (wrong password, unverified email, etc.) are
      // already surfaced via toast and the error banner below; console.warn
      // keeps a debug trail without tripping the dev overlay's issue count.
      console.warn("[LOGIN] Sign-in failed:", err);

      let errorMessage = "Unable to sign in. Please try again.";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
      ) {
        errorMessage = (err as { message: string }).message;
      }

      toast.error(errorMessage);
    } finally {
      // ===============================
      // FINALLY
      // ===============================

      isSubmittingRef.current = false;

      console.log("[LOGIN] MAIN FUNCTION FINISHED");
    }
  };

  // ===============================
  // GOOGLE LOGIN FUNCTION
  // ===============================

  const handleGoogleLogin = async (credential: string) => {
    console.log("[GOOGLE LOGIN] MAIN FUNCTION STARTED");

    if (googleLoading || isLoading || isSubmittingRef.current) {
      console.log("[GOOGLE LOGIN] Login already in progress");

      return;
    }

    if (!credential) {
      toast.error("Google login credential is missing");

      return;
    }

    setGoogleLoading(true);
    isSubmittingRef.current = true;

    clearError();

    try {
      console.log("[GOOGLE LOGIN] Calling googleLogin function...");

      await googleLogin(credential);

      const currentUser = useAuthStore.getState().user;
      const destination = getRedirectPath(currentUser?.role);

      console.log("[GOOGLE LOGIN] Success");

      toast.success("Welcome back to Denimique!");

      router.replace(destination);
    } catch (err) {
      console.warn("[GOOGLE LOGIN] Sign-in failed:", err);

      let errorMessage = "Google login failed. Please try again.";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
      ) {
        errorMessage = (err as { message: string }).message;
      }

      toast.error(errorMessage);
    } finally {
      setGoogleLoading(false);

      isSubmittingRef.current = false;

      console.log("[GOOGLE LOGIN] MAIN FUNCTION FINISHED");
    }
  };

  // ===============================
  // PAGE UI
  // ===============================

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-12 text-black">
      {/* Decorative Background */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-[#1B2E27] opacity-[0.06] blur-3xl" />

        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#F4B223] opacity-[0.05] blur-3xl" />
      </div>

      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.6,
        }}
        className="relative z-10 w-full max-w-md"
      >
        {/* HEADER */}

        <div className="mb-8 text-center">
          <motion.div
            initial={{
              scale: 0.8,
            }}
            animate={{
              scale: 1,
            }}
            transition={{
              delay: 0.2,
              duration: 0.5,
            }}
            className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#1B2E27] to-[#5A260F] shadow-[0_10px_30px_rgba(122,53,17,0.2)]"
          >
            <LogIn className="h-7 w-7 text-black" />
          </motion.div>

          <h1 className="mb-2 text-3xl font-bold tracking-tight text-black">
            Welcome Back
          </h1>

          <p className="text-sm text-black">
            Sign in to continue your style journey
          </p>
        </div>

        {/* LOGIN CARD */}

        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.3,
            duration: 0.6,
          }}
          className="rounded-2xl border border-[#eadfd8] bg-white p-6 shadow-xl shadow-[#1B2E27]/5 sm:p-8"
        >
          {/* GOOGLE LOGIN */}

          <div className="mb-6">
            <div
              className={
                isLoading || googleLoading
                  ? "pointer-events-none opacity-50"
                  : ""
              }
            >
              <FullWidthGoogleLogin
                onSuccess={(credentialResponse) => {
                  const credential = credentialResponse.credential;

                  if (!credential) {
                    toast.error("Google login failed. No credential received.");

                    return;
                  }

                  handleGoogleLogin(credential);
                }}
                onError={() => {
                  console.warn("[GOOGLE LOGIN] Google component error");

                  setGoogleLoading(false);

                  isSubmittingRef.current = false;

                  toast.error("Google login failed. Please try again.");
                }}
                text="signin_with"
                shape="rectangular"
                theme="outline"
                size="large"
              />
            </div>
          </div>

          {/* DIVIDER */}

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>

            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 font-medium text-black">
                Or continue with email
              </span>
            </div>
          </div>

          {/* LOGIN FORM */}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* EMAIL */}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-black"
              >
                Email Address
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  autoComplete="email"
                  placeholder="Enter your email"
                  disabled={isLoading || googleLoading}
                  className={`
                    w-full
                    rounded-xl
                    border
                    py-3
                    pl-10
                    pr-4
                    text-sm
                    outline-none
                    transition-all
                    duration-200
                    focus:ring-2
                    focus:ring-[#1B2E27]/20
                    ${
                      formErrors.email
                        ? "border-red-400 bg-red-50"
                        : "border-gray-300 focus:border-[#1B2E27]"
                    }
                  `}
                />
              </div>

              {formErrors.email && (
                <p className="mt-2 text-sm text-black">{formErrors.email}</p>
              )}
            </div>

            {/* PASSWORD */}

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-black"
              >
                Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  disabled={isLoading || googleLoading}
                  className={`
                    w-full
                    rounded-xl
                    border
                    py-3
                    pl-10
                    pr-12
                    text-sm
                    outline-none
                    transition-all
                    duration-200
                    focus:ring-2
                    focus:ring-[#1B2E27]/20
                    ${
                      formErrors.password
                        ? "border-red-400 bg-red-50"
                        : "border-gray-300 focus:border-[#1B2E27]"
                    }
                  `}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading || googleLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-black transition-colors hover:text-black"
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

            {/* FORGOT PASSWORD */}

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-black transition-colors hover:text-black"
              >
                Forgot your password?
              </Link>
            </div>

            {/* STORE / API ERROR */}

            {error && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="rounded-xl border border-red-200 bg-red-50 p-3"
              >
                <p className="text-sm text-black">
                  {error.message || "Login failed. Please try again."}
                </p>
              </motion.div>
            )}

            {/* LOGIN BUTTON */}

            <motion.button
              whileHover={{
                scale: 1.01,
              }}
              whileTap={{
                scale: 0.99,
              }}
              type="submit"
              disabled={isLoading || googleLoading}
              className=" 
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-gradient-to-r
                from-[#1B2E27]
                to-[#5A260F]
                px-4
                py-3.5
                text-sm
                font-semibold
                text-white
                shadow-[0_8px_20px_rgba(122,53,17,0.22)]
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:shadow-[0_12px_28px_rgba(122,53,17,0.3)]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* SIGNUP */}

          <p className="mt-6 text-center text-sm text-black">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-black transition-colors hover:text-black"
            >
              Create one here
            </Link>
          </p>
        </motion.div>

        {/* FOOTER */}

        <motion.p
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            delay: 0.5,
            duration: 0.6,
          }}
          className="mt-6 text-center text-xs text-black"
        >
          By signing in, you agree to our{" "}
          <Link
            href="/terms-of-service"
            className="text-black hover:underline"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy-policy"
            className="text-black hover:underline"
          >
            Privacy Policy
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white px-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1B2E27] border-t-transparent" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
