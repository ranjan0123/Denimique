import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductClient from "@/components/singleProductPage/ProductClient";
import { getProductBySlug } from "@/lib/storefront";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://suitablevastra.com";

const toAbsoluteUrl = (value: string) => {
  if (!value) return value;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${SITE_URL}${value}`;
  return `${SITE_URL}/${value}`;
};

/* ================= SEO ================= */

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {

  const { slug } = await params;   

  try {
    const product = await getProductBySlug(slug);
    const title = `${product.name} | Denimique`;
    const description =
      product.description ||
      product.shortDescription ||
      "Shop denim and lifestyle fashion from Denimique.";
    const socialImageUrl =
      Array.isArray(product.images) && product.images.length > 0
        ? product.images[0]
        : "/logo-removebg-preview.png";

    return {
      title,
      description,
      alternates: {
        canonical: `/products/${slug}`,
      },
      openGraph: {
        title,
        description,
        url: `/products/${slug}`,
        type: "website",
        images: [
          {
            url: socialImageUrl,
            width: 1200,
            height: 630,
            alt: product.name,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [socialImageUrl],
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch {
    return {
      title: "Product Not Found | Denimique",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

/* ================= PAGE ================= */
export default async function ProductPage(
  { params }: { params: Promise<{ slug: string }> }
) {

  const { slug } = await params;   

  let product;
  try {
    product = await getProductBySlug(slug);
  } catch {
    notFound();
  }

  const description =
    product.description ||
    product.shortDescription ||
    "Shop denim and lifestyle fashion from Denimique.";

  const imageUrls = Array.isArray(product.images)
    ? product.images.filter(Boolean).map(toAbsoluteUrl)
    : [];

  const prices: number[] = [];
  if (typeof product.basePrice === "number") prices.push(product.basePrice);
  if (typeof product.discountPrice === "number") prices.push(product.discountPrice);
  if (Array.isArray(product.variants)) {
    for (const variant of product.variants) {
      const variantPrice =
        typeof variant.discountPrice === "number" ? variant.discountPrice : variant.price;
      if (typeof variantPrice === "number") prices.push(variantPrice);
    }
  }

  const lowPrice = prices.length ? Math.min(...prices) : undefined;
  const highPrice = prices.length ? Math.max(...prices) : undefined;

  const anyInStock = Array.isArray(product.variants)
    ? product.variants.some((v) => (v.stock ?? 0) > 0)
    : true;

  const nutrition =
    product.nutritionalInfo &&
    (product.nutritionalInfo.calories ||
      product.nutritionalInfo.carbs ||
      product.nutritionalInfo.protein ||
      product.nutritionalInfo.fat)
      ? {
          "@type": "NutritionInformation",
          calories: product.nutritionalInfo.calories || undefined,
          carbohydrateContent: product.nutritionalInfo.carbs || undefined,
          proteinContent: product.nutritionalInfo.protein || undefined,
          fatContent: product.nutritionalInfo.fat || undefined,
        }
      : undefined;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    image: imageUrls.length ? imageUrls : [toAbsoluteUrl("/logo-removebg-preview.png")],
    sku: product._id || product.id,
    brand: { "@type": "Brand", name: "Denimique" },
    ...(nutrition ? { nutrition } : {}),
    ...(typeof product.rating === "number" && (product.reviewCount ?? 0) > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
    offers:
      lowPrice !== undefined && highPrice !== undefined && lowPrice !== highPrice
        ? {
            "@type": "AggregateOffer",
            url: `${SITE_URL}/products/${slug}`,
            priceCurrency: "INR",
            lowPrice,
            highPrice,
            offerCount: Array.isArray(product.variants) ? product.variants.length : 1,
            availability: anyInStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          }
        : {
            "@type": "Offer",
            url: `${SITE_URL}/products/${slug}`,
            priceCurrency: "INR",
            price: (lowPrice ?? product.discountPrice ?? product.basePrice) || undefined,
            availability: anyInStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductClient product={product} />
    </>
  );
}
