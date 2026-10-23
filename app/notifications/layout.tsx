import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications | Denimique",
  description: "Order and payment updates from Denimique.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
