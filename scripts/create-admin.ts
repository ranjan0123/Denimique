// One-off helper to create (or promote) a working superadmin account in
// whatever database MONGO_URI points to. Run with:
//   npx ts-node scripts/create-admin.ts [email] [password] [name]
// Safe to re-run: it upserts by email instead of failing on a duplicate.
import "../src/config/env";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db";
import { hashPassword } from "../src/utils/password";
import User from "../src/models/user.model";

const DEFAULT_EMAIL = "admin@denimique.com";
const DEFAULT_PASSWORD = "Denimique@2026";
const DEFAULT_NAME = "Denimique Admin";

const run = async () => {
  const email = (process.argv[2] || DEFAULT_EMAIL).trim().toLowerCase();
  const password = process.argv[3] || DEFAULT_PASSWORD;
  const name = process.argv[4] || DEFAULT_NAME;

  await connectDB();

  const hashedPassword = await hashPassword(password);

  const user = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        name,
        email,
        password: hashedPassword,
        role: "superadmin",
        isVerified: true,
      },
      $setOnInsert: {
        addresses: [],
      },
    },
    { upsert: true, new: true },
  );

  console.log("Superadmin ready:");
  console.log("  email:   ", email);
  console.log("  password:", password);
  console.log("  role:    ", user.role);
  console.log("\nLogin at /admin/login (or /login) with these credentials.");
  console.log("Change the password afterwards if this database is shared/production.");

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error("Failed to create admin:", error);
  process.exit(1);
});
