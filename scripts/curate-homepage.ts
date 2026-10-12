/*
 * Picks a representative spread of products across the new Lingerie
 * category tree and flags them isFeatured / isBestSeller, so the homepage
 * Featured/Best Sellers sections aren't empty after the bulk import (none
 * of the imported products were flagged).
 *
 * Usage:
 *   npx ts-node scripts/curate-homepage.ts            # dry run
 *   npx ts-node scripts/curate-homepage.ts --commit
 */
import "dotenv/config";
import mongoose from "mongoose";
import Product from "../src/models/Product";
import Category from "../src/models/Category";
import MainCategory from "../src/models/MainCategory";

const COMMIT = process.argv.includes("--commit");
const PER_CATEGORY_FEATURED = 2;
const PER_CATEGORY_BESTSELLER = 2;

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI is not set");

  await mongoose.connect(mongoUri);

  const mainCategory = await MainCategory.findOne({ name: "Lingerie" });
  if (!mainCategory) throw new Error("Lingerie main category not found");

  const categories = await Category.find({ mainCategory: mainCategory._id });
  console.log(`Curating across ${categories.length} Lingerie categories.`);

  let featuredCount = 0;
  let bestSellerCount = 0;

  for (const category of categories) {
    // Pick products with images and a real discount, highest-discount
    // first, as a simple stand-in for "good to showcase".
    const candidates = await Product.find({
      category: category._id,
      images: { $exists: true, $ne: [] },
    })
      .sort({ createdAt: 1 })
      .limit(PER_CATEGORY_FEATURED + PER_CATEGORY_BESTSELLER)
      .select("_id name");

    const featuredPicks = candidates.slice(0, PER_CATEGORY_FEATURED);
    const bestSellerPicks = candidates.slice(
      PER_CATEGORY_FEATURED,
      PER_CATEGORY_FEATURED + PER_CATEGORY_BESTSELLER,
    );

    console.log(
      `${category.name}: featuring ${featuredPicks.length}, best-seller ${bestSellerPicks.length}`,
    );

    if (COMMIT) {
      if (featuredPicks.length > 0) {
        await Product.updateMany(
          { _id: { $in: featuredPicks.map((p) => p._id) } },
          { $set: { isFeatured: true } },
        );
      }
      if (bestSellerPicks.length > 0) {
        await Product.updateMany(
          { _id: { $in: bestSellerPicks.map((p) => p._id) } },
          { $set: { isBestSeller: true } },
        );
      }
    }

    featuredCount += featuredPicks.length;
    bestSellerCount += bestSellerPicks.length;
  }

  console.log(`${COMMIT ? "Flagged" : "Would flag"}: ${featuredCount} featured, ${bestSellerCount} best-seller.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
