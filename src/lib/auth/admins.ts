import { count, eq } from "drizzle-orm";
import { admins, type AppDb } from "@/lib/db";
import { hashPassword } from "./password";

export async function countAdmins(db: AppDb): Promise<number> {
  const [row] = await db.select({ value: count() }).from(admins);
  return row?.value ?? 0;
}

export async function findAdminByEmail(db: AppDb, email: string) {
  const normalized = email.trim().toLowerCase();
  const [row] = await db
    .select()
    .from(admins)
    .where(eq(admins.email, normalized))
    .limit(1);
  return row ?? null;
}

export async function createAdmin(
  db: AppDb,
  input: { email: string; password: string },
) {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await hashPassword(input.password);
  const [row] = await db
    .insert(admins)
    .values({ email, passwordHash })
    .returning();
  return row;
}

/** Insert seed admin only when the table is empty. */
export async function seedAdminIfEmpty(
  db: AppDb,
  input: { email: string; password: string },
): Promise<"created" | "skipped"> {
  const existing = await countAdmins(db);
  if (existing > 0) return "skipped";
  await createAdmin(db, input);
  return "created";
}
