import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Denimique",
  description: "Sign in to your Denimique account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
