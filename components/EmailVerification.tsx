"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, CheckCircle, ArrowRight } from "lucide-react";

interface EmailVerificationProps {
  email: string;
  onResendEmail?: () => void;
}

export default function EmailVerification({
  email,
  onResendEmail,
}: EmailVerificationProps) {
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const handleResendEmail = async () => {
    if (!onResendEmail) {
      // If no resend function provided, show a message
      setResendMessage(
        "Resend functionality will be available soon. Please check your email.",
      );
      return;
    }

    setResendLoading(true);
    setResendMessage("");

    try {
      await onResendEmail();
      setResendMessage("Verification email sent successfully!");
    } catch (error) {
      setResendMessage("Failed to resend email. Please try again.");
    } finally {
      setResendLoading(false);
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
            Check Your Email
          </h1>
          <p className="text-gray-600">
            We&apos;ve sent a verification link to
          </p>
          <p className="text-[#4A230F] font-semibold mt-1">{email}</p>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center"
        >
          <div className="mb-6">
            <CheckCircle className="w-12 h-12 text-[#4A230F] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[#4A230F] mb-2">
              Verification Email Sent!
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Click the link in the email to verify your account and complete
              your registration. The link will expire in 24 hours.
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-[#FFF8EE] rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-[#4A230F] mb-2">
              What to do next:
            </h3>
            <ul className="text-sm text-gray-600 space-y-1 text-left">
              <li>• Check your inbox (and spam folder)</li>
              <li>• Click the verification link in the email</li>
              <li>• Return here and sign in to your account</li>
            </ul>
          </div>

          {/* Resend Email */}
          {onResendEmail && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">
                Didn&apos;t receive the email?
              </p>
              <button
                onClick={handleResendEmail}
                disabled={resendLoading}
                className="text-[#4A230F] hover:text-[#7A3511] font-semibold text-sm underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading ? "Sending..." : "Resend verification email"}
              </button>
              {resendMessage && (
                <p
                  className={`text-sm mt-2 ${resendMessage.includes("successfully") ? "text-[#4A230F]" : "text-red-600"}`}
                >
                  {resendMessage}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/login"
              className="w-full bg-[#4A230F] hover:bg-[#5A260F] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              Continue to Sign In
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/"
              className="block text-sm text-[#4A230F] hover:text-[#7A3511] transition-colors duration-200"
            >
              Back to Home
            </Link>
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


