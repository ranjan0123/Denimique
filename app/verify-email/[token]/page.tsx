"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Mail, ArrowRight, Loader2 } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface VerifyEmailPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default function VerifyEmailPage({ params }: VerifyEmailPageProps) {
  const router = useRouter();
  const { token } = use(params);

  const [verificationStatus, setVerificationStatus] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await api.get(`/auth/verify-email/${token}`);
        setVerificationStatus("success");
        setMessage(response.data.message || "Email verified successfully!");
        toast.success("Email verified successfully! You can now sign in.");

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        setVerificationStatus("error");
        setMessage(
          err.response?.data?.message ||
            "Failed to verify email. The link may be expired or invalid.",
        );
      }
    };

    verifyEmail();
  }, [token, router]);

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case "loading":
        return <Loader2 className="w-12 h-12 text-[#7A3511] animate-spin" />;
      case "success":
        return <CheckCircle className="w-12 h-12 text-[#4A230F]" />;
      case "error":
        return <XCircle className="w-12 h-12 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case "loading":
        return "text-[#7A3511]";
      case "success":
        return "text-[#4A230F]";
      case "error":
        return "text-red-600";
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#FDFBF7] via-white to-white flex items-center justify-center px-4 py-12">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#7A3511] opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#4A230F] opacity-5 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-[#4A230F] rounded-full mb-4"
          >
            <Mail className="w-8 h-8 text-[#7A3511]" />
          </motion.div>
          <h1 className="text-3xl font-bold text-[#4A230F] mb-2">
            Email Verification
          </h1>
          <p className="text-gray-600">Verifying your email address...</p>
        </div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center"
        >
          {/* Status Icon */}
          <div className="flex justify-center mb-6">{getStatusIcon()}</div>

          {/* Status Message */}
          <div className="mb-6">
            <h2 className={`text-xl font-semibold mb-2 ${getStatusColor()}`}>
              {verificationStatus === "loading" && "Verifying..."}
              {verificationStatus === "success" && "Email Verified!"}
              {verificationStatus === "error" && "Verification Failed"}
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {verificationStatus === "success" && (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Redirecting to sign in page in a few seconds...
                </p>
                <Link
                  href="/login"
                  className="w-full bg-[#4A230F] hover:bg-[#5A260F] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Continue to Sign In
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </>
            )}

            {verificationStatus === "error" && (
              <>
                <Link
                  href="/signup"
                  className="w-full bg-[#4A230F] hover:bg-[#5A260F] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Try Signing Up Again
                </Link>
                <Link
                  href="/login"
                  className="block text-sm text-[#4A230F] hover:text-[#7A3511] transition-colors duration-200"
                >
                  Back to Sign In
                </Link>
              </>
            )}

            {verificationStatus === "loading" && (
              <div className="flex justify-center">
                <div className="text-sm text-gray-500">
                  Please wait while we verify your email...
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Footer Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center text-xs text-gray-500 mt-6"
        >
          Need help?{" "}
          <Link href="/contact" className="text-[#4A230F] hover:underline">
            Contact Support
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
