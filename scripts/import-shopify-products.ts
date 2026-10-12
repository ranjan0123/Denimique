/*
 * One-off importer: converts the Shopify-style export at
 * backend/products_mongodb 1.json into real, schema-valid Product documents
 * (plus the MainCategory/Category docs they need) so they show up correctly
 * in the admin dashboard.
 *
 * Usage:
 *   npx ts-node scripts/import-shopify-products.ts            # dry run (no writes)
 *   npx ts-node scripts/import-shopify-products.ts --commit    # actually writes
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Product from "../src/models/Product";
import Category from "../src/models/Category";
import MainCategory from "../src/models/MainCategory";

const SRC = path.resolve(__dirname, "../products_mongodb 1.json");
const MAIN_CATEGORY_NAME = "Lingerie";
const COMMIT = process.argv.includes("--commit");

const stripHtml = (html?: string | null): string => {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
};

const slugify = (value: string): string =>
  (value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

interface ShopifyVariant {
  options?: Record<string, string>;
  price?: number;
  compareAtPrice?: number;
  inventoryQty?: number;
}

interface ShopifyImage {
  src: string;
  position?: number;
}

interface ShopifyProduct {
  handle: string;
  title: string;
  bodyHtml?: string;
  vendor?: string;
  tags?: string[];
  collection?: string;
  seo?: { title?: string; description?: string | null };
  googleShopping?: { gender?: string | null };
  variants?: ShopifyVariant[];
  images?: (ShopifyImage | string)[];
}

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is not set (check backend/.env)");
  }

  const raw: ShopifyProduct[] = JSON.parse(fs.readFileSync(SRC, "utf8"));
  console.log(`Loaded ${raw.length} products from source file.`);

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  // 1. Ensure the Lingerie main category exists.
  let mainCategory = await MainCategory.findOne({ name: MAIN_CATEGORY_NAME });
  if (!mainCategory) {
    console.log(`Main category "${MAIN_CATEGORY_NAME}" not found.`);
    if (COMMIT) {
      mainCategory = await MainCategory.create({
        name: MAIN_CATEGORY_NAME,
        slug: slugify(MAIN_CATEGORY_NAME),
      });
      console.log(`Created main category "${MAIN_CATEGORY_NAME}".`);
    }
  }

  // 2. Ensure every distinct `collection` exists as a Category under it.
  const collectionNames = [
    ...new Set(raw.map((p) => p.collection || "Uncategorized")),
  ];
  const categoryIdByName = new Map<string, mongoose.Types.ObjectId>();

  for (const name of collectionNames) {
    const existing = await Category.findOne({ name });
    if (existing) {
      categoryIdByName.set(name, existing._id as mongoose.Types.ObjectId);
      continue;
    }
    console.log(`Category "${name}" not found.`);
    if (COMMIT && mainCategory) {
      const created = await Category.create({
        name,
        slug: slugify(name),
        mainCategory: mainCategory._id,
      });
      categoryIdByName.set(name, created._id as mongoose.Types.ObjectId);
      console.log(`Created category "${name}".`);
    }
  }

  // 3. Build + insert products.
  let created = 0;
  let skippedExisting = 0;
  let skippedNoCategory = 0;

  for (const p of raw) {
    const handle = p.handle || slugify(p.title);
    if (!handle) continue;

    const categoryId = categoryIdByName.get(p.collection || "Uncategorized");
    if (!categoryId) {
      skippedNoCategory += 1;
      continue;
    }

    const alreadyExists = await Product.exists({ slug: handle });
    if (alreadyExists) {
      skippedExisting += 1;
      continue;
    }

    const description = stripHtml(p.bodyHtml);
    const rawVariants = Array.isArray(p.variants) ? p.variants : [];

    const variants = rawVariants.map((v, i) => {
      const label =
        v.options && typeof v.options === "object"
          ? Object.values(v.options).filter(Boolean).join(" / ")
          : "Default";
      return {
        id: String(i + 1),
        label: label || "Default",
        price: Number(v.price) || 0,
        stock: Number(v.inventoryQty) || 0,
      };
    });

    const basePrice =
      rawVariants.length > 0
        ? Math.max(...rawVariants.map((v) => Number(v.compareAtPrice) || Number(v.price) || 0))
        : 0;
    const discountPrice =
      rawVariants.length > 0
        ? Math.min(...rawVariants.map((v) => Number(v.price) || 0))
        : 0;

    const sizes = [
      ...new Set(
        rawVariants
          .map((v) => v.options && v.options.Size)
          .filter((s): s is string => Boolean(s)),
      ),
    ];

    const images = Array.isArray(p.images)
      ? p.images
          .map((img) => (typeof img === "string" ? img : img.src))
          .filter(Boolean)
      : [];

    const productDoc = {
      id: handle,
      slug: handle,
      name: p.title || handle,
      shortDescription: description.slice(0, 160) || p.title || handle,
      description: description || p.title || handle,
      category: categoryId,
      subcategory: null,
      brand: p.vendor || "",
      gender: (p.googleShopping && p.googleShopping.gender) || "",
      sizes,
      seoTitle: (p.seo && p.seo.title) || p.title || "",
      seoDescription: (p.seo && p.seo.description) || description.slice(0, 160),
      images,
      basePrice,
      discountPrice,
      rating: 0,
      reviewCount: 0,
      variants,
      isBestSeller: false,
      isFeatured: false,
      tags: Array.isArray(p.tags) ? p.tags : [],
    };

    if (COMMIT) {
      await Product.create(productDoc);
    }
    created += 1;
  }

  console.log("---");
  console.log(`${COMMIT ? "Created" : "Would create"}: ${created}`);
  console.log(`Skipped (slug already exists): ${skippedExisting}`);
  console.log(`Skipped (category missing, run with --commit first): ${skippedNoCategory}`);
  if (!COMMIT) {
    console.log("\nThis was a DRY RUN. Re-run with --commit to actually write to the database.");
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
