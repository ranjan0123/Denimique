import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wishlist | Denimique",
  description: "Saved products in your Denimique wishlist.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function WishlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
