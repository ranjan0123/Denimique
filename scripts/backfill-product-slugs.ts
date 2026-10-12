/*
 * Backfills a real `slug` field (the one Product.findOne({ slug }) actually
 * queries) onto every legacy Snazzyway-imported product, which only ever
 * had a Shopify `handle` field. Until this runs, every legacy product's
 * detail page 404s: the frontend links using handle-as-slug (see
 * normalizeProduct in lib/storefront.ts), but the backend has nothing in
 * its `slug` field to match against.
 *
 * One exact duplicate handle exists ("4-different-style-underwear-pack",
 * imported twice) — the second occurrence gets a "-2" suffix so the
 * schema's unique index on `slug` doesn't reject it.
 *
 * Idempotent: only touches products missing `slug`.
 *
 * Usage:
 *   npx ts-node scripts/backfill-product-slugs.ts            # dry run
 *   npx ts-node scripts/backfill-product-slugs.ts --commit
 */
import "dotenv/config";
import mongoose from "mongoose";

const COMMIT = process.argv.includes("--commit");

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI is not set");

  await mongoose.connect(mongoUri);
  const Products = mongoose.connection.collection("products");

  const cursor = Products.find(
    { slug: { $exists: false }, handle: { $exists: true } },
    { projection: { handle: 1 } },
  );

  const seenSlugs = new Set<string>();
  // Pre-load slugs already in use (from real/native products like the 8
  // Denimique jeans) so a backfilled slug can't collide with them either.
  for (const doc of await Products.find({ slug: { $exists: true } }, { projection: { slug: 1 } }).toArray()) {
    if (doc.slug) seenSlugs.add(doc.slug as string);
  }

  let updated = 0;
  let deduped = 0;

  for await (const doc of cursor) {
    let slug = String(doc.handle);
    if (seenSlugs.has(slug)) {
      let suffix = 2;
      while (seenSlugs.has(`${slug}-${suffix}`)) suffix += 1;
      slug = `${slug}-${suffix}`;
      deduped += 1;
    }
    seenSlugs.add(slug);

    if (COMMIT) {
      await Products.updateOne({ _id: doc._id }, { $set: { slug } });
    }
    updated += 1;
  }

  console.log(`${COMMIT ? "Updated" : "Would update"}: ${updated} product(s).`);
  console.log(`Deduped (suffix added for a collision): ${deduped}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
