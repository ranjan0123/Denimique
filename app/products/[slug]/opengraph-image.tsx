/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";

export const alt = "Denimique product";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://suitablevastra.com";
import { API_BASE_URL } from "@/lib/apiConfig";
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

type ProductResponse = {
  product?: {
    name?: string;
    images?: string[];
  };
  name?: string;
  images?: string[];
};

const toAbsoluteUrl = (value?: string) => {
  if (!value) return `${SITE_URL}/logo-removebg-preview.png`;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${API_ORIGIN}${value}`;
  return `${API_ORIGIN}/${value}`;
};

const getProductBySlug = async (slug: string) => {
  const response = await fetch(`${API_BASE_URL}/products/slug/${slug}`, {
    next: { revalidate: 300 },
  });
  if (!response.ok) return null;
  const data = (await response.json()) as ProductResponse;
  return (data.product || data) ?? null;
};

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let name = "Denimique Product";
  let image = `${SITE_URL}/logo-removebg-preview.png`;

  try {
    const product = await getProductBySlug(slug);
    if (product) {
      name = product.name || name;
      image = toAbsoluteUrl(product.images?.[0]);
    }
  } catch {

    // Keep fallback card if product lookup fails.
    
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#FFF8EE",
          color: "#4A230F",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: "50%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 36,
          }}
        >
          <img
            src={image}
            alt={name}
            width={520}
            height={520}
            style={{ objectFit: "contain" }}
          />
        </div>
        <div
          style={{
            width: "50%",
            height: "100%",
            padding: "56px 44px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background:
              "linear-gradient(135deg, rgba(244,178,35,0.18), rgba(74,35,15,0.08))",
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            DENIMIQUE
          </div>
          <div
            style={{
              fontSize: 52,
              lineHeight: 1.1,
              fontWeight: 700,
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
            }}
          >
            Premium Fashion & Apparel
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
