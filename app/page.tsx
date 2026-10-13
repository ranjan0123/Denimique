import CategoryShowcase from "@/components/home/CategoryShowcase";
import CustomerReviews, {
  type GoogleReviewItem,
} from "@/components/home/CustomerReviews";
import {
  BrandStory,
  EditorialCollections,
  SignatureCampaign,
} from "@/components/home/EditorialHomeSections";
import Hero from "@/components/home/Hero";
import LuxuryProductRail from "@/components/home/LuxuryProductRail";
import Newsletter from "@/components/home/Newsletter";
import TrustBadgesBar from "@/components/home/TrustBadgesBar";
import { getProducts } from "@/lib/storefront";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Denimique | The Modern Denim House",
  description:
    "Discover Denimique's considered edit of modern denim and everyday essentials, designed for a life in motion.",
  applicationName: "Denimique",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Denimique | The Modern Denim House",
    siteName: "Denimique",
    description: "Modern denim and everyday essentials, designed for a life in motion.",
    url: "/",
    type: "website",
    images: ["/logo-removebg-preview.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Denimique | The Modern Denim House",
    description: "Modern denim and everyday essentials, designed for a life in motion.",
    images: ["/logo-removebg-preview.png"],
  },
};

const FEATURABLE_WIDGET_ID = process.env.NEXT_PUBLIC_FEATURABLE_WIDGET_ID;

const GOOGLE_REVIEWS_DISPLAY_LIMIT = 6;

const fetchGoogleReviews = async (): Promise<{
  reviews: GoogleReviewItem[];
  profileUrl: string | null;
}> => {
  const empty = { reviews: [], profileUrl: null };
  if (!FEATURABLE_WIDGET_ID) return empty;
  try {
    const response = await fetch(
      `https://api.featurable.com/v2/widgets/${FEATURABLE_WIDGET_ID}`,
      { next: { revalidate: 3600 } },
    );
    if (!response.ok) return empty;
    const data = await response.json();
    const rawReviews = data?.widget?.reviews;
    if (!data?.success || !Array.isArray(rawReviews)) return empty;

    interface RawGoogleReview {
      id: string;
      author?: { name?: string; avatarUrl?: string };
      rating?: { value?: number };
      text?: string;
      publishedAt?: string;
    }

    const reviews = (rawReviews as RawGoogleReview[])
      .map((review) => ({
        id: review.id,
        name: review.author?.name ?? "Google User",
        avatarUrl: review.author?.avatarUrl ?? null,
        rating: review.rating?.value ?? 5,
        text: review.text ?? "",
        publishedAt: review.publishedAt ?? null,
      }))
      .filter((review: GoogleReviewItem) => Boolean(review.text))
      .sort((a: GoogleReviewItem, b: GoogleReviewItem) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return (
          new Date(b.publishedAt ?? 0).getTime() -
          new Date(a.publishedAt ?? 0).getTime()
        );
      })
      .slice(0, GOOGLE_REVIEWS_DISPLAY_LIMIT);

    const profileUrl =
      data?.widget?.gbpLocationSummary?.writeAReviewUri ?? null;

    return { reviews, profileUrl };
  } catch {
    return empty;
  }
};

const getHomeServerData = async () => {
  const [featured, bestSellers, googleReviewsData] =
    await Promise.all([
      getProducts({ limit: 100, isFeatured: true }).catch(() => []),
      getProducts({ limit: 100, isBestSeller: true }).catch(() => []),
      fetchGoogleReviews(),
    ]);

  return {
    featured,
    bestSellers,
    googleReviews: googleReviewsData.reviews,
    googleReviewsUrl: googleReviewsData.profileUrl,
  };
};

export default async function Home() {
  const {
    featured,
    bestSellers,
    googleReviews,
    googleReviewsUrl,
  } = await getHomeServerData();

  return (
    <main className="denimique-home-theme bg-[var(--denimique-paper)] text-[var(--denimique-ink)]">
      <Hero initialHero={null} initialSliderFallbackImages={[]} />
      <CategoryShowcase />
      <LuxuryProductRail
        products={bestSellers.slice(0, 4)}
        eyebrow="Customer favorites"
        title="Our Best Sellers!"
        description="The Denimique pieces our customers come back for."
        alwaysShow
        gridOnly
      />
      <TrustBadgesBar />
      <EditorialCollections />
      <BrandStory />
      <SignatureCampaign />
      <LuxuryProductRail
        products={featured}
        eyebrow="The considered edit"
        title="Featured Products"
        description="A focused selection of our most expressive, everyday pieces."
      />
      <CustomerReviews
        googleReviews={googleReviews}
        googleReviewsUrl={googleReviewsUrl}
      />
      <Newsletter />
    </main>
  );
}
