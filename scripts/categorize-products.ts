/*
 * Assigns every legacy-imported product (bulk-imported from the Snazzyway
 * dropship catalog, shaped differently from this app's own Product schema
 * — see categorize-products title/collection fields) a real `category`
 * ObjectId, using the Shopify `collection` string each product already
 * carries. Until this runs, every product's `category` field is empty, so
 * nothing resolves on the shop page, category nav, or admin dashboard
 * stats (see scripts/seed-categories.ts, which must run first).
 *
 * These are raw collection updates (not Product.save()) because the
 * documents don't match the IProduct schema (title vs name, etc.) and
 * Mongoose would try to validate/strip fields it doesn't recognize.
 *
 * Usage:
 *   npx ts-node scripts/categorize-products.ts            # dry run
 *   npx ts-node scripts/categorize-products.ts --commit
 */
import "dotenv/config";
import mongoose from "mongoose";
import Category from "../src/models/Category";

const COMMIT = process.argv.includes("--commit");

// Maps each known Shopify `collection` value (exact strings pulled from the
// data) to one of the category slugs seeded by seed-categories.ts.
const COLLECTION_TO_CATEGORY_SLUG: Record<string, string> = {
  "Signature Lace Bridal Panties": "bridal-collection",
  "Value Pack Panties": "value-wholesale",
  "Summer Bras": "bras",
  "Naughty Quotes Printed Panties": "panties",
  "Luxury Thong Underwear": "panties",
  "Exotic Nightwear": "nightwear-roleplay",
  "Luxury Garter Belt Collection": "nightwear-roleplay",
  "Starpless Bra": "bras",
  "Jewelry by Opulent Ornaments,  Dehradun": "accessories-jewelry",
  "Silk Dresses": "apparel",
  "Designer-Inspired Handbags": "accessories-jewelry",
  "The Breezy Cotton Edit 2025": "bras",
  "Choker necklace": "accessories-jewelry",
  "Premium Stocking": "nightwear-roleplay",
  "Push up Bras": "bras",
  "Seductive Roleplay Lingerie": "nightwear-roleplay",
  "Premium Lingerie Sets": "lingerie-sets",
  "Lingerie Gifts Boxes": "gift-occasion-sets",
  "Jeans by TrendLine Denim , Mumbai": "apparel",
  "Signature Rings": "accessories-jewelry",
  "Luxury Lingerie": "lingerie-sets",
  "Padded Bra": "bras",
  "Statement Tops for Her": "apparel",
  "Everyday Bra Sets": "lingerie-sets",
  "See Through": "nightwear-roleplay",
  "Silk Satin Petticoat": "shapewear-petticoats",
  "G -V-T strings": "panties",
  "Wholesale Panties": "value-wholesale",
  "Bikini Bottoms": "panties",
  "Crotchless Lingerie": "nightwear-roleplay",
  "Cherished Necklaces": "accessories-jewelry",
  "Breeze Bloom Cotton Bra Set Collection": "lingerie-sets",
  "Nightgown": "sleepwear-loungewear",
  "Seamless Panties": "panties",
  "Bridal Bra set": "bridal-collection",
  "Valentines Day Boxes": "gift-occasion-sets",
  "The Panty edit": "panties",
  "Silk Bra Sets": "lingerie-sets",
  "French Knickers": "panties",
  "Bikini Bra": "bras",
  "Sensuelle Earrings": "accessories-jewelry",
  "Winter Sleep Essentials": "sleepwear-loungewear",
  "To say I love you": "gift-occasion-sets",
  "Intimate jewellery by Sensuelle": "accessories-jewelry",
  "Saree Shapers": "saree",
  "Cosmatics Gift Boxes": "gift-occasion-sets",
  "High street ultra luxury panties": "panties",
  "French-Inspired Luxury Bralette Gift Set": "gift-occasion-sets",
  "Best Seller Bras": "bras",
  "Sports Bra": "bras",
  "Personalized / Customized Panties": "panties",
  "Personalized Panties": "panties",
  "Bralette": "bras",
  "Black Lingerie": "lingerie-sets",
  "Honeymoon Gift Boxes": "gift-occasion-sets",
  "Subscription Boxes": "gift-occasion-sets",
  "Plus Size": "plus-size",
  "Roleplay Costumes": "nightwear-roleplay",
  "Factory price deals": "value-wholesale",
  "Non Returnable Products": "value-wholesale",
  "Luxury Silk and Linen Collection": "apparel",
  "Leggings": "apparel",
  "Bras": "bras",
};

// "Trending Products with Video Catalogue" mixes several product types with
// no shared theme, so it's classified per-product by title keyword instead
// of as a single bucket.
const TITLE_KEYWORD_FALLBACK: { pattern: RegExp; slug: string }[] = [
  { pattern: /\bbra\b/i, slug: "bras" },
  { pattern: /panty|panties|thong|brief/i, slug: "panties" },
  { pattern: /garter|babydoll|night ?dress|sheer|see-through/i, slug: "nightwear-roleplay" },
  { pattern: /camisole|dress|mini dress|top\b/i, slug: "apparel" },
];

const classifyByTitle = (title: string): string => {
  for (const { pattern, slug } of TITLE_KEYWORD_FALLBACK) {
    if (pattern.test(title)) return slug;
  }
  return "lingerie-sets";
};

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI is not set");

  await mongoose.connect(mongoUri);

  const categories = await Category.find({});
  const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c._id]));

  if (categoryIdBySlug.size === 0) {
    throw new Error(
      "No categories found — run `npx ts-node scripts/seed-categories.ts` first.",
    );
  }

  const Products = mongoose.connection.collection("products");
  const cursor = Products.find(
    { category: { $exists: false } },
    { projection: { title: 1, collection: 1 } },
  );

  const countsBySlug = new Map<string, number>();
  let updated = 0;
  let unmatched = 0;

  for await (const doc of cursor) {
    const collectionName: string | undefined = doc.collection;
    const title: string = doc.title || "";

    let slug = collectionName ? COLLECTION_TO_CATEGORY_SLUG[collectionName] : undefined;
    if (!slug && collectionName === "Trending Products with Video Catalogue") {
      slug = classifyByTitle(title);
    }
    if (!slug) {
      slug = classifyByTitle(title);
      unmatched += 1;
    }

    const categoryId = categoryIdBySlug.get(slug);
    if (!categoryId) {
      console.warn(`No category found for slug "${slug}" (product: ${title})`);
      continue;
    }

    countsBySlug.set(slug, (countsBySlug.get(slug) || 0) + 1);

    if (COMMIT) {
      await Products.updateOne(
        { _id: doc._id },
        { $set: { category: categoryId } },
      );
    }
    updated += 1;
  }

  console.log(`\n${COMMIT ? "Updated" : "Would update"}: ${updated} product(s).`);
  console.log(`Unmatched collection names (fell back to title keywords): ${unmatched}`);
  console.log("\nBreakdown by category:");
  for (const [slug, count] of [...countsBySlug.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${slug}: ${count}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
