import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Email | Denimique",
  description: "Verify your Denimique account email address.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
