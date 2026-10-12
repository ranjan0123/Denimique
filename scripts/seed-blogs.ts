/*
 * Seeds the initial set of Denimique blog posts (the /blog page currently
 * shows "No blog posts are published yet" — 0 posts exist). Each post's
 * featured image is a real photo from an actual denim product already in
 * the catalog (Cloudinary isn't configured in this environment, so direct
 * file upload isn't available) — swap for different product photography via
 * the admin blog editor any time.
 *
 * Usage:
 *   npx ts-node scripts/seed-blogs.ts            # dry run
 *   npx ts-node scripts/seed-blogs.ts --commit
 */
import "dotenv/config";
import mongoose from "mongoose";
import Blog from "../src/models/Blog";
import User from "../src/models/user.model";

const COMMIT = process.argv.includes("--commit");

interface PostSpec {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  featuredImage: string;
  imageAlt: string;
  content: {
    type: "heading" | "text" | "list";
    heading?: { level: "h2"; text: string };
    value?: string;
    isList?: boolean;
    listItems?: string[];
  }[];
}

const SNAZZYWAY_UPLOAD_BASE =
  "https://flyadmin.snazzywaydropshipping.com/storage/uploads/2025/7/product";

const POSTS: PostSpec[] = [
  {
    title: "Welcome to the Denimique Journal",
    slug: "welcome-to-the-denimique-journal",
    excerpt:
      "A new space for style guides, fit tips, and denim care advice from the Denimique team — start here.",
    category: "news",
    tags: ["denimique", "journal", "news"],
    seoTitle: "Welcome to the Denimique Journal",
    seoDescription:
      "Introducing the Denimique Journal — style guides, fit tips, and denim care advice, all in one place.",
    seoKeywords: ["denimique journal", "denimique blog", "denim style guide"],
    featuredImage: `${SNAZZYWAY_UPLOAD_BASE}/DkWHNopszn7WJDS9dhQYa7YE43uf8HyCvi7HUbtC.png`,
    imageAlt: "Classic 90s boyfriend blue denim wide-leg jeans from the Denimique collection",
    content: [
      {
        type: "text",
        value:
          "Denim is simple on the surface and surprisingly easy to get wrong — the fit, the wash, the way you actually take care of it over time. The Denimique Journal is where we'll go deeper than a product page: fit guides, styling ideas, and care advice drawn from how we actually build our denim.",
      },
      {
        type: "heading",
        heading: { level: "h2", text: "What you'll find here" },
      },
      {
        type: "list",
        isList: true,
        listItems: [
          "Fit guides — how to choose between skinny, straight, relaxed, and wide-leg",
          "Styling edits — outfit ideas for everyday wear and dressing up",
          "Care guides — washing, drying, and storage habits that make denim last",
          "Notes from the Denimique team on what's new in the collection",
        ],
      },
      {
        type: "text",
        value:
          "New posts go up regularly. If there's a denim question you'd like us to cover, reach out through our contact page — we build this around what's actually useful to you.",
      },
    ],
  },
  {
    title: "5 Ways to Style Denim for Every Day This Season",
    slug: "5-ways-to-style-denim-this-season",
    excerpt:
      "From everyday basics to after-dark layering, here are five easy, wearable ways to style your Denimique pieces this season.",
    category: "style-guide",
    tags: ["denim", "style-guide", "outfit-ideas"],
    seoTitle: "5 Ways to Style Denim This Season | Denimique",
    seoDescription:
      "Five easy, wearable ways to style denim this season — from everyday basics to elevated layering looks.",
    seoKeywords: ["denim styling tips", "how to style jeans", "denim outfit ideas"],
    featuredImage: `${SNAZZYWAY_UPLOAD_BASE}/5O9oiQKB4T8tzAMLY91SbC3lFqvu8rzDDkXDgK6E.png`,
    imageAlt: "Smokey blue denim loose-fit straight jeans styled for everyday wear",
    content: [
      {
        type: "text",
        value:
          "Good denim earns its place in a wardrobe by working harder than almost anything else you own. Here are five ways to get more mileage out of your favorite pair.",
      },
      {
        type: "heading",
        heading: { level: "h2", text: "1. Keep it classic with a straight fit" },
      },
      {
        type: "text",
        value:
          "A straight-leg jean in a mid-wash is the one pair that goes with almost everything — a plain tee, a tucked-in shirt, a blazer for work. If you only own one pair of jeans, this is the fit to build around.",
      },
      {
        type: "heading",
        heading: { level: "h2", text: "2. Try denim-on-denim, done tonally" },
      },
      {
        type: "text",
        value:
          "The trick to double denim is contrast, not matching — pair a dark-wash jacket with lighter jeans, or vice versa. Keeping at least one shade of difference between pieces keeps the look intentional instead of head-to-toe uniform.",
      },
      {
        type: "heading",
        heading: { level: "h2", text: "3. Dress it up after dark" },
      },
      {
        type: "text",
        value:
          "A dark, non-distressed jean reads dressier than you'd expect. Pair with a tucked silk-feel top and heeled boots, and denim moves easily from daytime to dinner without changing out of it entirely.",
      },
      {
        type: "heading",
        heading: { level: "h2", text: "Quick styling rules" },
      },
      {
        type: "list",
        isList: true,
        listItems: [
          "Cuff a straight or wide-leg hem to show off boots or sneakers",
          "Balance a relaxed-fit jean with a fitted top, and vice versa",
          "One statement piece per outfit — let denim be the neutral",
          "Tuck in at least the front of your top to define the waist",
        ],
      },
      {
        type: "text",
        value:
          "The common thread: denim is a neutral, not a statement. Let the fit do the work and build the rest of the outfit around it.",
      },
    ],
  },
  {
    title: "The Denimique Guide to Finding Your Perfect Jean Fit",
    slug: "denimique-guide-to-finding-your-perfect-jean-fit",
    excerpt:
      "Skinny, straight, relaxed, or wide-leg — a practical guide to choosing the denim fit that actually suits your body and how you move.",
    category: "style-guide",
    tags: ["fit-guide", "denim", "jeans"],
    seoTitle: "How to Find Your Perfect Jean Fit | Denimique",
    seoDescription:
      "A practical guide to choosing between skinny, straight, relaxed, and wide-leg denim so your next pair actually fits right.",
    seoKeywords: ["jean fit guide", "how to choose jeans", "best denim fit"],
    featuredImage: `${SNAZZYWAY_UPLOAD_BASE}/wKiwPjaFgACWrC6qlSIHFIfEkSaGdPIW74Ne3Xfs.png`,
    imageAlt: "Classic high-waist wide-leg jeans showing a relaxed denim fit",
    content: [
      {
        type: "text",
        value:
          "The right jean fit has less to do with trend and more to do with how you actually want to move through your day. Here's how the main fits differ, and who each one suits best.",
      },
      {
        type: "heading",
        heading: { level: "h2", text: "Skinny" },
      },
      {
        type: "text",
        value:
          "Fitted from hip to ankle. Works well under boots, layers cleanly beneath longer tops and coats, and is the easiest fit to dress up. Look for a touch of stretch in the fabric so it moves with you instead of restricting.",
      },
      {
        type: "heading",
        heading: { level: "h2", text: "Straight" },
      },
      {
        type: "text",
        value:
          "A consistent leg width from knee to hem, with a bit more room through the thigh than skinny. The most versatile fit in almost any wardrobe — equally at home with sneakers or boots, casual or smart-casual.",
      },
      {
        type: "heading",
        heading: { level: "h2", text: "Relaxed" },
      },
      {
        type: "text",
        value:
          "Extra room throughout, built for comfort first. A relaxed fit works best balanced against a slightly fitted top, so the silhouette doesn't read as shapeless overall.",
      },
      {
        type: "heading",
        heading: { level: "h2", text: "Wide-leg" },
      },
      {
        type: "text",
        value:
          "A fitted waist and hip that flares out from the thigh down. Pairs naturally with heeled boots or platform sneakers to keep proportions balanced, and reads more fashion-forward than straight or relaxed fits.",
      },
      {
        type: "heading",
        heading: { level: "h2", text: "Quick sizing tips" },
      },
      {
        type: "list",
        isList: true,
        listItems: [
          "Try jeans on at the time of day you'll actually wear them — fit can shift slightly morning to evening",
          "Sit down before you buy — a good pair shouldn't dig in at the waist when seated",
          "Denim with stretch relaxes slightly with wear; 100% cotton denim holds its shape longer but takes longer to break in",
          "When between two sizes, size up for relaxed and wide-leg fits, size true-to-size for skinny and straight",
        ],
      },
    ],
  },
  {
    title: "How to Care for Your Denim So It Lasts for Years",
    slug: "how-to-care-for-your-denim",
    excerpt:
      "Wash less, wash smart — the care habits that keep denim's color, shape, and fit intact for years of wear.",
    category: "fabric-care",
    tags: ["fabric-care", "denim", "how-to"],
    seoTitle: "How to Care for Denim | Denimique Care Guide",
    seoDescription:
      "Simple washing, drying, and storage habits that keep your denim's color and fit intact for years of wear.",
    seoKeywords: [
      "how to wash jeans",
      "denim care guide",
      "how to keep jeans from fading",
    ],
    featuredImage: `${SNAZZYWAY_UPLOAD_BASE}/Tgb3tQp3sY3InmLlsjaKqOTkWgiIzBzxlGs0iixX.png`,
    imageAlt: "High-waist stretch skinny denim jeans, well cared for and holding their shape",
    content: [
      {
        type: "text",
        value:
          "Most denim doesn't wear out — it gets washed out. A few small changes to how you wash and store your jeans add years to how long they look and fit the way they did on day one.",
      },
      {
        type: "heading",
        heading: { level: "h2", text: "Wash less than you think" },
      },
      {
        type: "text",
        value:
          "Denim doesn't need washing after every wear. Spot-clean marks as they happen and air out jeans between wears — most people can go 4-6 wears between washes without any issue, and the fabric holds its color far longer for it.",
      },
      {
        type: "heading",
        heading: { level: "h2", text: "When you do wash" },
      },
      {
        type: "list",
        isList: true,
        listItems: [
          "Turn jeans inside out before washing to protect the outer color and any prints",
          "Use cold water on a gentle cycle — heat is what breaks down dye and elastic fibers fastest",
          "Skip the dryer when you can; line dry or lay flat to prevent shrinking and keep stretch denim's recovery intact",
          "Wash dark denim separately for the first few washes, since early washes shed the most dye",
        ],
      },
      {
        type: "heading",
        heading: { level: "h2", text: "Storage and everyday habits" },
      },
      {
        type: "text",
        value:
          "Fold jeans rather than hanging them by the waistband for long stretches — hanging can stretch out the waist over time. Keep denim away from direct sunlight in storage, which fades color faster than regular wear does.",
      },
      {
        type: "text",
        value:
          "One habit worth adopting: rotate between at least two pairs in regular use. Giving denim a day to rest between wears lets the fibers recover their shape, which is often the real reason a pair starts to feel \"stretched out.\"",
      },
    ],
  },
];

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI is not set");

  await mongoose.connect(mongoUri);

  const author = await User.findOne({ role: { $in: ["admin", "superadmin"] } }).sort({
    createdAt: 1,
  });
  if (!author) {
    throw new Error("No admin/superadmin user found to use as blog author");
  }
  console.log(`Using author: ${author.name} <${author.email}>`);

  let created = 0;
  let skipped = 0;

  for (const post of POSTS) {
    const existing = await Blog.findOne({ slug: post.slug });
    if (existing) {
      console.log(`SKIP (already exists): ${post.slug}`);
      skipped += 1;
      continue;
    }

    console.log(`${COMMIT ? "Creating" : "Would create"}: ${post.title}`);

    if (COMMIT) {
      await Blog.create({
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        featuredImage: post.featuredImage,
        imageAlt: post.imageAlt,
        author: author._id,
        category: post.category,
        tags: post.tags,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        seoKeywords: post.seoKeywords,
        internalLinks: [{ url: "/shop", text: "Shop the collection" }],
        isPublished: true,
      });
    }

    created += 1;
  }

  console.log(
    `${COMMIT ? "Created" : "Would create"}: ${created} post(s). Skipped: ${skipped}.`,
  );
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
