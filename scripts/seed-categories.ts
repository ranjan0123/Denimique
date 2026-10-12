/*
 * Creates the Main Category -> Category structure the storefront already
 * expects (frontend/components/layout/Header.tsx SHOP_MENU_GROUPS), which
 * until now had zero matching documents in the database — every product's
 * `category` field pointed at nothing, so the shop page, admin dashboard
 * stats, and category navigation were all empty.
 *
 * Idempotent: upserts by slug, safe to re-run.
 *
 * Usage:
 *   npx ts-node scripts/seed-categories.ts
 */
import "dotenv/config";
import mongoose from "mongoose";
import MainCategory from "../src/models/MainCategory";
import Category from "../src/models/Category";

interface CategorySpec {
  name: string;
  slug: string;
}

interface MainCategorySpec {
  name: string;
  slug: string;
  categories: CategorySpec[];
}

export const CATEGORY_STRUCTURE: MainCategorySpec[] = [
  {
    name: "Lingerie & Intimates",
    slug: "lingerie-intimates",
    categories: [
      { name: "Bras", slug: "bras" },
      { name: "Panties", slug: "panties" },
      { name: "Lingerie Sets", slug: "lingerie-sets" },
      { name: "Nightwear & Roleplay", slug: "nightwear-roleplay" },
      { name: "Shapewear Petticoats", slug: "shapewear-petticoats" },
    ],
  },
  {
    name: "Occasion & Gifting",
    slug: "occasion-gifting",
    categories: [
      { name: "Bridal Collection", slug: "bridal-collection" },
      { name: "Gift & Occasion Sets", slug: "gift-occasion-sets" },
      { name: "Plus Size", slug: "plus-size" },
    ],
  },
  {
    name: "Sleep & Everyday",
    slug: "sleep-everyday",
    categories: [
      { name: "Sleepwear & Loungewear", slug: "sleepwear-loungewear" },
      { name: "Apparel", slug: "apparel" },
      { name: "Value Wholesale", slug: "value-wholesale" },
    ],
  },
  {
    name: "Accessories & More",
    slug: "accessories-more",
    categories: [
      { name: "Accessories & Jewelry", slug: "accessories-jewelry" },
      { name: "Saree", slug: "saree" },
    ],
  },
];

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI is not set");

  await mongoose.connect(mongoUri);

  let mainCreated = 0;
  let categoryCreated = 0;

  for (const [index, mainSpec] of CATEGORY_STRUCTURE.entries()) {
    const mainCategory = await MainCategory.findOneAndUpdate(
      { slug: mainSpec.slug },
      { $set: { name: mainSpec.name, displayOrder: index } },
      { upsert: true, new: true },
    );
    mainCreated += 1;
    console.log(`MainCategory ready: ${mainCategory.name}`);

    for (const [catIndex, catSpec] of mainSpec.categories.entries()) {
      await Category.findOneAndUpdate(
        { slug: catSpec.slug },
        {
          $set: {
            name: catSpec.name,
            mainCategory: mainCategory._id,
            displayOrder: catIndex,
          },
        },
        { upsert: true, new: true },
      );
      categoryCreated += 1;
      console.log(`  Category ready: ${catSpec.name} (${catSpec.slug})`);
    }
  }

  console.log(
    `\nDone. ${mainCreated} main categories, ${categoryCreated} categories ready.`,
  );
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
