import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | Denimique",
  description: "Create a Denimique account to place and track orders.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
