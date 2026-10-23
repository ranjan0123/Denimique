import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Details | Denimique",
  description: "Track the status of your Denimique order.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrderDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
