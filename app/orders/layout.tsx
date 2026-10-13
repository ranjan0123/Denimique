import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders | Denimique",
  description: "View and track your Denimique orders.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
