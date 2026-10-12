// Must be the very first import: it loads .env before any other module
// (e.g. sendEmail.ts, which builds its SMTP transporter at import time)
// gets a chance to read process.env.
import "./config/env";

import express from "express";
import cors, { type CorsOptions } from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import categoryRoutes from "./routes/category.routes";
import subcategoryRoutes from "./routes/subcategory.routes";
import mainCategoryRoutes from "./routes/mainCategory.routes";
import promoCodeRoutes from "./routes/promocode.routes";
import checkoutRoutes from "./routes/checkout.routes";
import orderRoutes from "./routes/order.routes";
import shippingRoutes from "./routes/shipping.routes";
import settingsRoutes from "./routes/settings.routes";
import notificationRoutes from "./routes/notification.routes";
import heroRoutes from "./routes/hero.routes";
import hotProductRoutes from "./routes/hotproduct.routes";
import weekendComboRoutes from "./routes/weekendcombo.routes";
import userRoutes from "./routes/user.routes";
import cartRoutes from "./routes/cart.routes";
import wishlistRoutes from "./routes/wishlist.routes";
import adminRoutes from "./routes/admin.routes";
import blogRoutes from "./routes/blog.routes";
import adminBlogRoutes from "./routes/admin-blog.routes";
import formResponseRoutes from "./routes/formresponse.routes";
import cityPageRoutes from "./routes/citypage.routes";
import whatsappRoutes from "./routes/whatsapp.routes";
import pushRoutes from "./routes/push.routes";

const app = express();

// If running behind a reverse proxy/CDN (common in production), this helps Express
// correctly interpret protocol/secure cookies and client IPs.
app.set("trust proxy", 1);

connectDB();

const corsOriginsFromEnv = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const defaultOrigins = [
  "https://www.suitablevastra.com",
  "https://suitablevastra.com",
  "https://suitablevastra.vercel.app",
  "https://suitablevastra-beta.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
];

const allowedOrigins =
  corsOriginsFromEnv.length > 0
    ? Array.from(new Set([...corsOriginsFromEnv, ...defaultOrigins]))
    : defaultOrigins;

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients (no Origin header), e.g. curl/Postman/server-to-server.
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Reject without throwing so Express doesn't fall back to a 500 error page.
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

app.use(cors(corsOptions));
// Explicitly respond to preflight requests for all routes.
app.options(/.*/, cors(corsOptions));

app.use(express.json());
app.use(cookieParser());
// Default helmet() sets Cross-Origin-Resource-Policy: same-origin, which
// blocks the frontend (a different origin) from loading images served from
// /uploads below in <img> tags.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/main-categories", mainCategoryRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/subcategories", subcategoryRoutes);
app.use("/api/promocodes", promoCodeRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/hero", heroRoutes);
app.use("/api/hot-product", hotProductRoutes);
app.use("/api/weekend-combo", weekendComboRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/admin/blogs", adminBlogRoutes);
app.use("/api/forms", formResponseRoutes);
app.use("/api/city-pages", cityPageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/push", pushRoutes);

// Global error handler. Without this, errors thrown by middleware (e.g.
// multer rejecting an oversized/invalid file) fall through to Express's
// default handler, which returns a bare 500 with no JSON body instead of
// a message the frontend can show.
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: express.NextFunction,
  ) => {
    console.error("Unhandled error:", err);

    if (err?.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "Image is too large. Maximum size is 10MB." });
    }

    if (err?.name === "MulterError") {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: err?.message || "Server error" });
  },
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
