import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Denimique | Get in Touch | Noida, UP",
  description:
    "Contact Denimique for orders, support, wholesale queries, and partnerships. Reach our team in Noida, UP.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Denimique | Get in Touch | Noida, UP",
    description:
      "Get in touch with Denimique for support, product questions, and business enquiries.",
    url: "/contact",
    type: "website",
    images: ["/logo-removebg-preview.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Denimique | Get in Touch | Noida, UP",
    description: "Reach Denimique support and team in Noida, UP.",
    images: ["/logo-removebg-preview.png"],
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
