/*
 * One-off repair for cart items saved before the addToCart .lean() fix
 * (cart.controller.ts) — those snapshots got stuck with name "Product" and
 * no image because the legacy product's title/handle/images fields were
 * silently stripped by non-lean Mongoose hydration at the time they were
 * added. Re-derives each broken item's name/image/slug from the product
 * it references.
 *
 * Idempotent: only touches items with name "Product" or a blank image.
 *
 * Usage:
 *   npx ts-node scripts/repair-cart-snapshots.ts            # dry run
 *   npx ts-node scripts/repair-cart-snapshots.ts --commit
 */
import "dotenv/config";
import mongoose from "mongoose";

const COMMIT = process.argv.includes("--commit");

const getProductImage = (product: any): string => {
  const image = product.images?.[0] || product.image || product.productImage;
  if (!image) return "";
  if (typeof image === "string") return image;
  return image?.src || image?.url || "";
};

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI is not set");

  await mongoose.connect(mongoUri);
  const Carts = mongoose.connection.collection("carts");
  const Products = mongoose.connection.collection("products");

  const carts = await Carts.find({
    $or: [{ "items.name": "Product" }, { "items.image": "" }],
  }).toArray();

  let repairedItems = 0;
  let cartsTouched = 0;

  for (const cart of carts) {
    let changed = false;

    for (const item of cart.items as any[]) {
      if (item.name !== "Product" && item.image) continue;

      const product = await Products.findOne({ _id: item.product });
      if (!product) continue;

      const newName = product.name || product.title || product.handle || "Product";
      const newImage = getProductImage(product);
      const newSlug = product.slug || product.handle || product.id || "";

      if (newName !== item.name || newImage !== item.image || newSlug !== item.slug) {
        console.log(
          `${COMMIT ? "Repairing" : "Would repair"}: "${item.name}" -> "${newName}" (cart ${cart._id})`,
        );
        item.name = newName;
        item.image = newImage;
        item.slug = newSlug;
        changed = true;
        repairedItems += 1;
      }
    }

    if (changed) {
      cartsTouched += 1;
      if (COMMIT) {
        await Carts.updateOne({ _id: cart._id }, { $set: { items: cart.items } });
      }
    }
  }

  console.log(
    `\n${COMMIT ? "Repaired" : "Would repair"}: ${repairedItems} item(s) across ${cartsTouched} cart(s).`,
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
