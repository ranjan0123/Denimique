/*
 * Replaces the flat 64 "Lingerie" categories (created by
 * import-shopify-products.ts) with a clean set of ~12 logical Categories:
 *
 *   Lingerie (MainCategory)
 *     -> Bras, Panties, Nightwear & Roleplay, ... (Category, ~12 groups)
 *
 * Every product is repointed to its new group Category, then all 64 old
 * flat categories are deleted outright — nothing old is kept around.
 *
 * Usage:
 *   npx ts-node scripts/restructure-lingerie-categories.ts            # dry run
 *   npx ts-node scripts/restructure-lingerie-categories.ts --commit
 */
import "dotenv/config";
import mongoose from "mongoose";
import Product from "../src/models/Product";
import Category from "../src/models/Category";
import MainCategory from "../src/models/MainCategory";

const COMMIT = process.argv.includes("--commit");
const MAIN_CATEGORY_NAME = "Lingerie";

const slugify = (value: string): string =>
  (value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Old flat category name -> new group name. Anything not listed falls back
// to "Other Lingerie".
const GROUP_MAP: Record<string, string> = {
  "Value Pack Panties": "Panties",
  "Luxury Silk and Linen Collection": "Sleepwear & Loungewear",
  "Starpless Bra": "Bras",
  "Naughty Quotes Printed Panties": "Panties",
  "To say I love you": "Gift & Occasion Sets",
  "Summer Bras": "Bras",
  "Personalized / Customized Panties": "Panties",
  "Seductive Roleplay Lingerie": "Nightwear & Roleplay",
  "Push up Bras": "Bras",
  "Padded Bra": "Bras",
  "Best Seller Bras": "Bras",
  "Luxury Thong Underwear": "Panties",
  "Lingerie Gifts Boxes": "Gift & Occasion Sets",
  "Subscription Boxes": "Gift & Occasion Sets",
  "Exotic Nightwear": "Nightwear & Roleplay",
  "Premium Lingerie Sets": "Lingerie Sets",
  "Silk Satin Petticoat": "Shapewear & Petticoats",
  "Saree Shapers": "Shapewear & Petticoats",
  "Nightgown": "Nightwear & Roleplay",
  "Seamless Panties": "Panties",
  "Everyday Bra Sets": "Bras",
  "Sports Bra": "Bras",
  "Signature Lace Bridal Panties": "Bridal Collection",
  "G -V-T strings": "Panties",
  "See Through": "Nightwear & Roleplay",
  "Wholesale Panties": "Panties",
  "Crotchless Lingerie": "Nightwear & Roleplay",
  "Cosmatics Gift Boxes": "Gift & Occasion Sets",
  "Luxury Lingerie": "Lingerie Sets",
  "Silk Dresses": "Sleepwear & Loungewear",
  "French Knickers": "Panties",
  "Factory price deals": "Value & Wholesale",
  "Plus Size": "Plus Size",
  "Non Returnable Products": "Value & Wholesale",
  "Luxury Garter Belt Collection": "Bridal Collection",
  "Personalized Panties": "Panties",
  "Jeans by TrendLine Denim , Mumbai": "Apparel",
  "Leggings": "Apparel",
  "Jewelry by Opulent Ornaments,  Dehradun": "Accessories & Jewelry",
  "High street ultra luxury panties": "Panties",
  "French-Inspired Luxury Bralette Gift Set": "Gift & Occasion Sets",
  "Silk Bra Sets": "Bras",
  "Valentines Day Boxes": "Gift & Occasion Sets",
  "Roleplay Costumes": "Nightwear & Roleplay",
  "Bras": "Bras",
  "Trending Products with Video Catalogue": "Value & Wholesale",
  "Bralette": "Bras",
  "Black Lingerie": "Lingerie Sets",
  "Honeymoon Gift Boxes": "Gift & Occasion Sets",
  "Bridal Bra set": "Bridal Collection",
  "Intimate jewellery by Sensuelle": "Accessories & Jewelry",
  "The Breezy Cotton Edit 2025": "Bras",
  "Breeze Bloom Cotton Bra Set Collection": "Bras",
  "Cherished Necklaces": "Accessories & Jewelry",
  "Statement Tops for Her": "Apparel",
  "Sensuelle Earrings": "Accessories & Jewelry",
  "Choker necklace": "Accessories & Jewelry",
  "Signature Rings": "Accessories & Jewelry",
  "Bikini Bottoms": "Panties",
  "Bikini Bra": "Bras",
  "Winter Sleep Essentials": "Sleepwear & Loungewear",
  "Premium Stocking": "Apparel",
  "Designer-Inspired Handbags": "Accessories & Jewelry",
  "The Panty edit": "Panties",
};

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI is not set");

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  const mainCategory = await MainCategory.findOne({ name: MAIN_CATEGORY_NAME });
  if (!mainCategory) throw new Error(`Main category "${MAIN_CATEGORY_NAME}" not found`);

  const oldCategories = await Category.find({ mainCategory: mainCategory._id });
  console.log(`Found ${oldCategories.length} flat categories under ${MAIN_CATEGORY_NAME}.`);
  const oldIds = oldCategories.map((c) => c._id);

  const unmapped = oldCategories.filter((c) => !GROUP_MAP[c.name]);
  if (unmapped.length > 0) {
    console.log("Unmapped collection names (falling back to 'Other Lingerie'):");
    unmapped.forEach((c) => console.log(" -", c.name));
  }

  const groupNames = [...new Set(Object.values(GROUP_MAP))];
  if (unmapped.length > 0) groupNames.push("Other Lingerie");

  // 1. Create the new group Categories using temporary names (to dodge the
  // unique-name collision with the old flat categories being replaced,
  // e.g. old "Bras" vs new group "Bras"), then rename them into place only
  // after the old categories are deleted.
  const TEMP_PREFIX = "__new__";
  const groupIdByName = new Map<string, mongoose.Types.ObjectId>();
  for (const name of groupNames) {
    console.log(`Group category: "${name}"`);
    if (COMMIT) {
      const created = await Category.create({
        name: `${TEMP_PREFIX}${name}`,
        slug: `${TEMP_PREFIX}${slugify(name)}`,
        mainCategory: mainCategory._id,
      });
      groupIdByName.set(name, created._id as mongoose.Types.ObjectId);
    }
  }

  // 2. Repoint every product from its old flat category to the new group.
  let productsUpdated = 0;
  for (const oldCat of oldCategories) {
    const groupName = GROUP_MAP[oldCat.name] || "Other Lingerie";
    const groupId = groupIdByName.get(groupName);

    const count = await Product.countDocuments({ category: oldCat._id });
    console.log(`"${oldCat.name}" -> "${groupName}" (${count} products)`);

    if (COMMIT && groupId) {
      const res = await Product.updateMany(
        { category: oldCat._id },
        { $set: { category: groupId, subcategory: null } },
      );
      productsUpdated += res.modifiedCount;
    }
  }
  console.log(`${COMMIT ? "Updated" : "Would update"} ${productsUpdated} products.`);

  // 3. Delete the old flat categories now that nothing references them.
  if (COMMIT) {
    const stillReferenced = await Product.countDocuments({ category: { $in: oldIds } });
    if (stillReferenced > 0) {
      console.log(
        `WARNING: ${stillReferenced} products still reference an old category — leaving old categories in place.`,
      );
    } else {
      const res = await Category.deleteMany({ _id: { $in: oldIds } });
      console.log(`Deleted ${res.deletedCount} old flat categories.`);
    }

    // 4. Rename the new groups into their real names now that the old
    // (colliding) names are gone.
    for (const [name, id] of groupIdByName.entries()) {
      await Category.updateOne(
        { _id: id },
        { $set: { name, slug: slugify(name) } },
      );
    }
    console.log(`Renamed ${groupIdByName.size} new categories into place.`);
  } else {
    console.log(`Would create ${groupNames.length} new categories and delete ${oldCategories.length} old ones.`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
