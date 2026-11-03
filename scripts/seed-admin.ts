/**
 * Seed the first admin from ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD.
 *
 * Usage:
 *   export DATABASE_URL='postgresql://...'
 *   export ADMIN_SEED_EMAIL='you@example.com'
 *   export ADMIN_SEED_PASSWORD='a-strong-password'
 *   npm run db:seed-admin
 */
import { getDbFromDatabaseUrl, getDbFromConnectionString } from "../src/lib/db/client";
import { seedAdminIfEmpty } from "../src/lib/auth/admins";

async function main() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!url) {
    console.error("Missing DATABASE_URL (or POSTGRES_URL).");
    process.exit(1);
  }
  if (!email || !password) {
    console.error("Missing ADMIN_SEED_EMAIL and/or ADMIN_SEED_PASSWORD.");
    process.exit(1);
  }
  if (password.length < 10) {
    console.error("ADMIN_SEED_PASSWORD must be at least 10 characters.");
    process.exit(1);
  }

  const db = url.includes("neon.tech")
    ? getDbFromDatabaseUrl(url)
    : getDbFromConnectionString(url);

  const result = await seedAdminIfEmpty(db, { email, password });
  if (result === "skipped") {
    console.log("Admins table is not empty — seed skipped.");
    return;
  }

  console.log(`Created admin ${email.trim().toLowerCase()}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
