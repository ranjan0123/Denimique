/*
 * Adds the 8 new Denimique-native jeans products (from the product photo
 * sets the user supplied) to the catalog. Images were extracted from the
 * supplied PDFs into backend/uploads/products/<slug>/ and are served via
 * the existing express.static("uploads") route (see server.ts) — no
 * Cloudinary needed since these are local files already.
 *
 * Idempotent: upserts by slug, safe to re-run.
 *
 * Usage:
 *   npx ts-node scripts/add-denim-products.ts
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Product from "../src/models/Product";
import Category from "../src/models/Category";

const PRICE = 999;
const SIZES = ["28", "30", "32", "34", "36"];
const STOCK_PER_SIZE = 15;

interface ProductSpec {
  slug: string;
  name: string;
  color: string;
  fit: "Straight" | "Cargo";
  shortDescription: string;
  description: string;
}

const FIT_COPY = {
  Straight: {
    blurb:
      "A clean, straight-leg silhouette that runs true from hip to hem — pairs equally well with sneakers or boots.",
    highlights: [
      "Straight-leg fit, true from hip to hem",
      "High-rise waist",
      "Classic five-pocket styling",
      "Button and zip-fly closure",
    ],
  },
  Cargo: {
    blurb:
      "A utility-inspired straight fit with flap cargo pockets at the thigh for a more relaxed, street-ready look.",
    highlights: [
      "Straight fit with utility cargo pockets",
      "High-rise waist",
      "Flap pockets with snap closure",
      "Button and zip-fly closure",
    ],
  },
};

const PRODUCTS: ProductSpec[] = [
  {
    slug: "black-cargo-jeans",
    name: "Black High-Waist Cargo Jeans",
    color: "Black",
    fit: "Cargo",
    shortDescription:
      "High-waist black denim cargo jeans with flap utility pockets and a relaxed straight leg.",
    description:
      "These black high-waist cargo jeans bring a utility edge to everyday denim. Cut in a relaxed straight leg with flap cargo pockets at the thigh, they're built for a street-ready look that still pairs easily with a simple tee or crop top.",
  },
  {
    slug: "grey-cargo-jeans",
    name: "Grey High-Waist Cargo Jeans",
    color: "Grey",
    fit: "Cargo",
    shortDescription:
      "High-waist grey denim cargo jeans with flap utility pockets and a relaxed straight leg.",
    description:
      "A lighter take on utility denim — these grey high-waist cargo jeans keep the flap cargo pockets and relaxed straight leg, in a washed grey tone that's easy to style with both neutrals and brighter tops.",
  },
  {
    slug: "black-straight-jeans",
    name: "Black High-Waist Straight Jeans",
    color: "Black",
    fit: "Straight",
    shortDescription:
      "High-waist black denim with a clean straight-leg fit and classic five-pocket styling.",
    description:
      "A wardrobe staple: black high-waist jeans cut in a clean straight leg that runs true from hip to hem. Classic five-pocket styling and a button-and-zip closure make these as easy to dress up as they are to wear every day.",
  },
  {
    slug: "blue-cargo-jeans",
    name: "Blue High-Waist Cargo Jeans",
    color: "Blue",
    fit: "Cargo",
    shortDescription:
      "High-waist indigo blue denim cargo jeans with flap utility pockets and a relaxed straight leg.",
    description:
      "Rich indigo blue denim with a utility twist — these high-waist cargo jeans add flap thigh pockets to a relaxed straight leg, for a fit that moves easily from daytime errands to a casual night out.",
  },
  {
    slug: "blue-straight-jeans",
    name: "Blue High-Waist Straight Jeans",
    color: "Blue",
    fit: "Straight",
    shortDescription:
      "High-waist indigo blue denim with a clean straight-leg fit and classic five-pocket styling.",
    description:
      "A rich indigo-blue straight jean with a high-rise waist and a fit that runs true from hip to hem. Classic five-pocket styling keeps it versatile for everyday wear.",
  },
  {
    slug: "sky-blue-cargo-jeans",
    name: "Sky Blue High-Waist Cargo Jeans",
    color: "Sky Blue",
    fit: "Cargo",
    shortDescription:
      "High-waist sky blue denim cargo jeans with flap utility pockets and a relaxed straight leg.",
    description:
      "A lighter wash on the utility cargo fit — sky blue denim with flap thigh pockets and a relaxed straight leg, for an easy, everyday look that pairs well with white sneakers.",
  },
  {
    slug: "grey-straight-jeans",
    name: "Grey High-Waist Straight Jeans",
    color: "Grey",
    fit: "Straight",
    shortDescription:
      "High-waist grey denim with a clean straight-leg fit and classic five-pocket styling.",
    description:
      "A washed grey straight jean with a high-rise waist and a clean leg line from hip to hem. An easy neutral that works as well with a striped tee as it does with a crisp white shirt.",
  },
  {
    slug: "sky-blue-straight-jeans",
    name: "Sky Blue High-Waist Straight Jeans",
    color: "Sky Blue",
    fit: "Straight",
    shortDescription:
      "High-waist sky blue denim with a clean straight-leg fit and classic five-pocket styling.",
    description:
      "A lighter sky blue wash in our classic straight-leg fit — high-rise waist, true-to-hem leg line, and classic five-pocket styling for easy everyday wear.",
  },
];

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "products");

const getImagesForSlug = (slug: string): string[] => {
  const dir = path.join(UPLOADS_DIR, slug);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .sort()
    .map((f) => `/uploads/products/${slug}/${f}`);
};

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI is not set");

  await mongoose.connect(mongoUri);

  const apparelCategory = await Category.findOne({ slug: "apparel" });
  if (!apparelCategory) {
    throw new Error(
      "Apparel category not found — run scripts/seed-categories.ts first.",
    );
  }

  let created = 0;
  let skipped = 0;

  for (const spec of PRODUCTS) {
    const existing = await Product.findOne({ slug: spec.slug });
    if (existing) {
      console.log(`SKIP (already exists): ${spec.slug}`);
      skipped += 1;
      continue;
    }

    const images = getImagesForSlug(spec.slug);
    if (images.length === 0) {
      console.log(`SKIP (no images found): ${spec.slug}`);
      skipped += 1;
      continue;
    }

    const fitCopy = FIT_COPY[spec.fit];
    const variants = SIZES.map((size, index) => ({
      id: String(index + 1),
      label: size,
      price: PRICE,
      stock: STOCK_PER_SIZE,
    }));

    await Product.create({
      id: spec.slug,
      slug: spec.slug,
      name: spec.name,
      shortDescription: spec.shortDescription,
      description: `${spec.description} ${fitCopy.blurb}`,
      category: apparelCategory._id,
      brand: "Denimique",
      gender: "Women",
      fabric: "Denim",
      fit: spec.fit,
      material: "Cotton Denim",
      pattern: "Solid",
      color: spec.color,
      sizes: SIZES,
      highlights: fitCopy.highlights,
      careInstructions: [
        "Machine wash cold with like colors",
        "Do not bleach",
        "Line dry in shade",
        "Iron on reverse if needed",
      ],
      seoTitle: `${spec.name} | Denimique`,
      seoDescription: spec.shortDescription,
      metaKeywords: ["denim", "jeans", spec.fit.toLowerCase(), spec.color.toLowerCase()],
      images,
      basePrice: PRICE,
      discountPrice: PRICE,
      rating: 0,
      reviewCount: 0,
      variants,
      isBestSeller: false,
      isFeatured: false,
      ingredients: [],
      tags: ["denim", "jeans", spec.fit.toLowerCase(), spec.color.toLowerCase(), "women"],
    });

    console.log(`Created: ${spec.name} (${images.length} images)`);
    created += 1;
  }

  console.log(`\nDone. Created: ${created}. Skipped: ${skipped}.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
