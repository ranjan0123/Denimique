/*
 * Adds a Subcategory layer under the 13 categories from seed-categories.ts,
 * using the same Shopify `collection` field that categorize-products.ts
 * used for the top-level category. Without this, all 1401 products sit in
 * flat, broad buckets (e.g. 90 totally different items all just "Apparel").
 *
 * Subcategory names are cleaned up from the raw collection strings (vendor/
 * location plugs like "by TrendLine Denim, Mumbai" stripped, typos fixed,
 * near-duplicates merged) rather than used verbatim.
 *
 * The 8 native Denimique jeans products (added separately, no `collection`
 * field) are matched into the same "Jeans" subcategory as the legacy
 * Snazzyway jeans collection, by product.fabric === "Denim".
 *
 * Idempotent: upserts subcategories by (category, slug); product subcategory
 * assignment only touches products missing a subcategory.
 *
 * Usage:
 *   npx ts-node scripts/categorize-subcategories.ts            # dry run
 *   npx ts-node scripts/categorize-subcategories.ts --commit
 */
import "dotenv/config";
import mongoose from "mongoose";
import Category from "../src/models/Category";
import Subcategory from "../src/models/Subcategory";

const COMMIT = process.argv.includes("--commit");

// collection -> { category slug, subcategory name }
const COLLECTION_TO_SUBCATEGORY: Record<string, { category: string; sub: string }> = {
  "Summer Bras": { category: "bras", sub: "Summer Bras" },
  "Starpless Bra": { category: "bras", sub: "Strapless Bras" },
  "The Breezy Cotton Edit 2025": { category: "bras", sub: "Cotton Bras" },
  "Push up Bras": { category: "bras", sub: "Push-Up Bras" },
  "Padded Bra": { category: "bras", sub: "Padded Bras" },
  "Best Seller Bras": { category: "bras", sub: "Best Seller Bras" },
  "Sports Bra": { category: "bras", sub: "Sports Bras" },
  "Bralette": { category: "bras", sub: "Bralettes" },
  "Bikini Bra": { category: "bras", sub: "Bikini Bras" },
  "Bras": { category: "bras", sub: "Everyday Bras" },

  "Naughty Quotes Printed Panties": { category: "panties", sub: "Printed Panties" },
  "Luxury Thong Underwear": { category: "panties", sub: "Thongs" },
  "G -V-T strings": { category: "panties", sub: "G-Strings" },
  "Bikini Bottoms": { category: "panties", sub: "Bikini Bottoms" },
  "Seamless Panties": { category: "panties", sub: "Seamless Panties" },
  "The Panty edit": { category: "panties", sub: "Everyday Panties" },
  "French Knickers": { category: "panties", sub: "French Knickers" },
  "High street ultra luxury panties": { category: "panties", sub: "Luxury Panties" },
  "Personalized / Customized Panties": { category: "panties", sub: "Personalized Panties" },
  "Personalized Panties": { category: "panties", sub: "Personalized Panties" },

  "Exotic Nightwear": { category: "nightwear-roleplay", sub: "Nightwear" },
  "Luxury Garter Belt Collection": { category: "nightwear-roleplay", sub: "Garter Belts" },
  "Premium Stocking": { category: "nightwear-roleplay", sub: "Stockings" },
  "Seductive Roleplay Lingerie": { category: "nightwear-roleplay", sub: "Roleplay Lingerie" },
  "See Through": { category: "nightwear-roleplay", sub: "Sheer & See-Through" },
  "Crotchless Lingerie": { category: "nightwear-roleplay", sub: "Crotchless Lingerie" },
  "Roleplay Costumes": { category: "nightwear-roleplay", sub: "Roleplay Costumes" },

  "Jewelry by Opulent Ornaments,  Dehradun": { category: "accessories-jewelry", sub: "Jewelry" },
  "Designer-Inspired Handbags": { category: "accessories-jewelry", sub: "Handbags" },
  "Choker necklace": { category: "accessories-jewelry", sub: "Necklaces" },
  "Signature Rings": { category: "accessories-jewelry", sub: "Rings" },
  "Cherished Necklaces": { category: "accessories-jewelry", sub: "Necklaces" },
  "Sensuelle Earrings": { category: "accessories-jewelry", sub: "Earrings" },
  "Intimate jewellery by Sensuelle": { category: "accessories-jewelry", sub: "Intimate Jewelry" },

  "Premium Lingerie Sets": { category: "lingerie-sets", sub: "Premium Sets" },
  "Luxury Lingerie": { category: "lingerie-sets", sub: "Luxury Lingerie" },
  "Everyday Bra Sets": { category: "lingerie-sets", sub: "Everyday Sets" },
  "Breeze Bloom Cotton Bra Set Collection": { category: "lingerie-sets", sub: "Cotton Sets" },
  "Silk Bra Sets": { category: "lingerie-sets", sub: "Silk Sets" },
  "Black Lingerie": { category: "lingerie-sets", sub: "Black Lingerie" },

  "Lingerie Gifts Boxes": { category: "gift-occasion-sets", sub: "Gift Boxes" },
  "Valentines Day Boxes": { category: "gift-occasion-sets", sub: "Valentine's Gift Boxes" },
  "To say I love you": { category: "gift-occasion-sets", sub: "Romantic Gifts" },
  "Cosmatics Gift Boxes": { category: "gift-occasion-sets", sub: "Beauty Gift Boxes" },
  "French-Inspired Luxury Bralette Gift Set": { category: "gift-occasion-sets", sub: "Bralette Gift Sets" },
  "Honeymoon Gift Boxes": { category: "gift-occasion-sets", sub: "Honeymoon Gift Boxes" },
  "Subscription Boxes": { category: "gift-occasion-sets", sub: "Subscription Boxes" },

  "Value Pack Panties": { category: "value-wholesale", sub: "Value Packs" },
  "Wholesale Panties": { category: "value-wholesale", sub: "Wholesale Panties" },
  "Factory price deals": { category: "value-wholesale", sub: "Factory Price Deals" },
  "Non Returnable Products": { category: "value-wholesale", sub: "Clearance" },

  "Signature Lace Bridal Panties": { category: "bridal-collection", sub: "Bridal Panties" },
  "Bridal Bra set": { category: "bridal-collection", sub: "Bridal Bra Sets" },

  "Silk Satin Petticoat": { category: "shapewear-petticoats", sub: "Satin Petticoats" },

  "Nightgown": { category: "sleepwear-loungewear", sub: "Nightgowns" },
  "Winter Sleep Essentials": { category: "sleepwear-loungewear", sub: "Winter Essentials" },

  "Silk Dresses": { category: "apparel", sub: "Dresses" },
  "Luxury Silk and Linen Collection": { category: "apparel", sub: "Dresses" },
  "Jeans by TrendLine Denim , Mumbai": { category: "apparel", sub: "Jeans" },
  "Statement Tops for Her": { category: "apparel", sub: "Tops" },
  "Leggings": { category: "apparel", sub: "Leggings" },

  "Saree Shapers": { category: "saree", sub: "Saree Shapers" },
};

const kebabCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI is not set");

  await mongoose.connect(mongoUri);

  const categories = await Category.find({});
  const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c._id]));

  // 1. Seed subcategories (unique per category+name).
  const uniqueSubs = new Map<string, { category: string; sub: string }>();
  for (const entry of Object.values(COLLECTION_TO_SUBCATEGORY)) {
    uniqueSubs.set(`${entry.category}::${entry.sub}`, entry);
  }

  const subcategoryIdByKey = new Map<string, mongoose.Types.ObjectId>();

  for (const { category, sub } of uniqueSubs.values()) {
    const categoryId = categoryIdBySlug.get(category);
    if (!categoryId) {
      console.warn(`No category found for slug "${category}" (subcategory "${sub}")`);
      continue;
    }
    const slug = kebabCase(sub);
    const key = `${category}::${slug}`;

    if (COMMIT) {
      const doc = await Subcategory.findOneAndUpdate(
        { category: categoryId, slug },
        { $set: { name: sub, category: categoryId } },
        { upsert: true, new: true },
      );
      subcategoryIdByKey.set(key, doc._id);
    } else {
      console.log(`Would create subcategory: ${sub} (under ${category})`);
    }
  }

  if (!COMMIT) {
    console.log(`\n${uniqueSubs.size} unique subcategories would be created.`);
    console.log("Re-run with --commit to apply, then assign products.");
    await mongoose.disconnect();
    return;
  }

  console.log(`\nSeeded ${subcategoryIdByKey.size} subcategories.`);

  // 2. Assign products.subcategory based on their `collection` field.
  const Products = mongoose.connection.collection("products");
  let updated = 0;
  let skippedNoMapping = 0;

  const cursor = Products.find(
    { $or: [{ subcategory: { $exists: false } }, { subcategory: null }] },
    { projection: { collection: 1, fabric: 1 } },
  );

  for await (const doc of cursor) {
    let mapping = doc.collection
      ? COLLECTION_TO_SUBCATEGORY[doc.collection as string]
      : undefined;

    // Native Denimique jeans (no `collection` field) go in the same Jeans
    // subcategory as the legacy denim collection.
    if (!mapping && doc.fabric === "Denim") {
      mapping = { category: "apparel", sub: "Jeans" };
    }

    if (!mapping) {
      skippedNoMapping += 1;
      continue;
    }

    const slug = kebabCase(mapping.sub);
    const key = `${mapping.category}::${slug}`;
    const subcategoryId = subcategoryIdByKey.get(key);
    if (!subcategoryId) continue;

    await Products.updateOne(
      { _id: doc._id },
      { $set: { subcategory: subcategoryId } },
    );
    updated += 1;
  }

  console.log(`Assigned subcategory to ${updated} product(s).`);
  console.log(`Left without a subcategory (no mapping, e.g. mixed "Trending" bucket): ${skippedNoMapping}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
