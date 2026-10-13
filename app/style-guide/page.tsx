import type { Metadata } from "next";
import StyleGuideComponent, {
  type StyleGuideEdit,
  type StyleGuideEditProduct,
} from "@/components/StyleGuideComponent";
import { getProducts, getProductPrimaryImage } from "@/lib/storefront";
import type { Product } from "@/types/product";

export const metadata: Metadata = {
  title: "Style Guide | Denimique",
  description:
    "Fit, styling, and care guidance for Denimique denim, apparel, and everyday fashion — shop with confidence and wear it your way.",
  alternates: {
    canonical: "/style-guide",
  },
  openGraph: {
    title: "Style Guide | Denimique",
    description:
      "Fit and care guidance for Denimique denim, apparel, and lifestyle collections.",
    url: "/style-guide",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Style Guide | Denimique",
    description:
      "Fit and care guidance for Denimique denim, apparel, and lifestyle collections.",
  },
};

// Each edit is matched directly against the real catalog's category names
// (from /api/products) rather than fuzzy keyword matching, so "Shop the
// Edit" always reflects what's actually in stock for that category.
const STYLE_EDITS: {
  title: string;
  tag: string;
  categoryNames: string[];
  tips: string[];
  href: string;
}[] = [
  {
    title: "Bras & Bralettes",
    tag: "Everyday Comfort",
    categoryNames: ["Bras"],
    tips: [
      "Measure your band and cup size every year — weight changes and wear both shift the fit over time.",
      "The band should sit level and snug on the loosest hook so you can move to tighter hooks as it stretches with wash.",
      "Rotate at least 3 bras through the week — letting elastic rest between wears keeps the shape and support longer.",
    ],
    href: "/shop?category=bras",
  },
  {
    title: "Panties & Lingerie Sets",
    tag: "Matched & Everyday",
    categoryNames: ["Panties", "Lingerie Sets"],
    tips: [
      "Cotton-lined styles are best for daily wear; lace and mesh sets are made for occasions, not all-day comfort.",
      "Size up in briefs and hipsters if you prefer no marks at the waistband — a snug fit isn't a smaller size.",
      "Buying sets (not separates) keeps proportions matched, especially in sheer and strappy styles.",
    ],
    href: "/shop?category=panties",
  },
  {
    title: "Bridal & Honeymoon Edit",
    tag: "Occasion & Trousseau",
    categoryNames: ["Bridal Collection", "Gift & Occasion Sets"],
    tips: [
      "Order your trousseau pieces 2-3 weeks ahead of the wedding date to allow time for a size exchange.",
      "Pick one statement set for the night and simpler, comfortable pieces for the rest of the trip.",
      "Gift boxes make thoughtful bridesmaid or bachelorette presents — most are ready to ship in branded packaging.",
    ],
    href: "/shop?category=bridal-collection",
  },
  {
    title: "Shapewear & Petticoats",
    tag: "Smoothing & Silhouette",
    categoryNames: ["Shapewear & Petticoats"],
    tips: [
      "Choose shapewear one size down from your regular size for control, or true-to-size for all-day comfort.",
      "Cotton petticoats layer best under sarees and lehengas without adding bulk at the waist.",
      "Put shapewear on before your outfit, never over it, and avoid rolling the waistband to prevent it digging in.",
    ],
    href: "/shop?category=shapewear-petticoats",
  },
  {
    title: "Sleepwear & Loungewear",
    tag: "Rest & Everyday",
    categoryNames: ["Sleepwear & Loungewear", "Nightwear & Roleplay"],
    tips: [
      "Pick breathable cotton or modal for regular sleep; satin and silk styles suit cooler nights and gifting.",
      "Size up in pajama sets for a relaxed fit — loungewear is meant to sit loose, not fitted.",
      "Keep one set aside strictly for lounging at home to make it last through frequent washing.",
    ],
    href: "/shop?category=sleepwear-loungewear",
  },
  {
    title: "Accessories & Jewelry",
    tag: "Finishing Touches",
    categoryNames: ["Accessories & Jewelry"],
    tips: [
      "A sling bag in a contrasting or metallic tone lifts even the simplest outfit.",
      "Keep embellished pieces to one focal accessory at a time so they don't compete with each other.",
      "Store jewelry and embellished bags separately in pouches to prevent tarnishing and snagging.",
    ],
    href: "/shop?category=accessories-jewelry",
  },
];

const toEditProduct = (product: Product): StyleGuideEditProduct => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  image: getProductPrimaryImage(product),
  price: product.discountPrice || product.basePrice,
  basePrice: product.basePrice,
  rating: product.rating,
});

const scoreProduct = (product: Product): number => {
  let score = 0;
  if (product.isBestSeller) score += 3;
  if (product.isFeatured) score += 2;
  if (product.rating) score += product.rating;
  return score;
};

const pickProductsForEdit = (
  products: Product[],
  categoryNames: string[],
  limit = 4,
): StyleGuideEditProduct[] => {
  const lowerNames = categoryNames.map((name) => name.toLowerCase());

  return products
    .filter((product) => {
      const categoryName = (product.category?.name || "").toLowerCase();
      return lowerNames.includes(categoryName);
    })
    .sort((a, b) => scoreProduct(b) - scoreProduct(a))
    .slice(0, limit)
    .map(toEditProduct);
};

const getStyleGuideData = async () => {
  try {
    const products = await getProducts({ limit: 1000 });

    const edits: StyleGuideEdit[] = STYLE_EDITS.map((edit) => {
      const editProducts = pickProductsForEdit(products, edit.categoryNames);
      return {
        title: edit.title,
        tag: edit.tag,
        tips: edit.tips,
        href: edit.href,
        image: editProducts[0]?.image,
        products: editProducts,
      };
    }).filter((edit) => edit.products.length > 0);

    return { edits };
  } catch (error) {
    console.error("Failed to load style guide products:", error);
    return { edits: [] };
  }
};

export default async function StyleGuidePage() {
  const { edits } = await getStyleGuideData();

  return <StyleGuideComponent edits={edits} />;
}
