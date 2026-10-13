import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile | Denimique",
  description: "Manage your Denimique profile and saved addresses.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
