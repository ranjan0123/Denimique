// Read-only check: confirms the seeded superadmin exists (and that the
// known password actually matches its stored hash) in whatever database
// MONGO_URI currently points to. Run with:
//   npx ts-node scripts/verify-admin.ts [email] [password]
import "../src/config/env";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db";
import { comparePassword } from "../src/utils/password";
import User from "../src/models/user.model";

const run = async () => {
  const email = (process.argv[2] || "admin@suitablevastra.com").trim().toLowerCase();
  const password = process.argv[3] || "SuitableVastra@2026";

  await connectDB();

  const user = await User.findOne({ email });

  console.log("Connected DB name:", mongoose.connection.db?.databaseName);
  console.log("Looked up:", email);

  if (!user) {
    console.log("Result: NO user found with this email in this database.");
  } else {
    const matches = user.password
      ? await comparePassword(password, user.password)
      : false;

    console.log("User found. role:", user.role, "| isVerified:", user.isVerified);
    console.log("Password match for the given password:", matches);
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error("Verify failed:", error);
  process.exit(1);
});
