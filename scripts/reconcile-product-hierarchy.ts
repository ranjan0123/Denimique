import "dotenv/config";
import mongoose from "mongoose";
import Product from "../src/models/Product";
import Category from "../src/models/Category";
import Subcategory from "../src/models/Subcategory";

const COMMIT = process.argv.includes("--commit");
const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is not set");
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  const products = await Product.find().lean();
  const categories = await Category.find().lean();
  const categoryIds = new Set(categories.map((category) => category._id.toString()));
  const productsByCategory = new Map<string, typeof products>();

  for (const product of products) {
    const categoryId = product.category?.toString();
    if (!categoryId || !categoryIds.has(categoryId)) {
      console.warn(`Skipping product with invalid category: ${product.slug}`);
      continue;
    }
    const group = productsByCategory.get(categoryId) || [];
    group.push(product);
    productsByCategory.set(categoryId, group);
  }

  let createdSubcategories = 0;
  let assignedProducts = 0;
  let skippedProducts = 0;

  for (const category of categories) {
    const categoryProducts = productsByCategory.get(category._id.toString()) || [];
    if (categoryProducts.length === 0) continue;

    const existing = await Subcategory.findOne({
      category: category._id,
      slug: "all-products",
    });

    let subcategory = existing;
    if (!subcategory && COMMIT) {
      subcategory = await Subcategory.create({
        name: "All Products",
        slug: "all-products",
        description: "All products in this category.",
        category: category._id,
        isActive: true,
        displayOrder: 0,
      });
      createdSubcategories += 1;
    }

    if (!subcategory) {
      console.warn(`Cannot create subcategory for ${category.name}`);
      skippedProducts += categoryProducts.length;
      continue;
    }

    for (const product of categoryProducts) {
      if (product.subcategory) continue;
      if (COMMIT) {
        await Product.updateOne(
          { _id: product._id },
          { $set: { subcategory: subcategory._id } },
        );
        assignedProducts += 1;
      } else {
        assignedProducts += 1;
      }
    }
  }

  console.log(
    `Products: ${products.length}; Categories: ${categories.length}; ` +
      `Affected categories: ${productsByCategory.size}`,
  );
  console.log(
    `Would create ${createdSubcategories} subcategories and assign ${assignedProducts} products.`,
  );
  console.log(
    `Skipped products with missing/invalid subcategory: ${skippedProducts}`,
  );

  if (!COMMIT) {
    console.log("Dry run complete. Re-run with --commit to apply changes.");
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
