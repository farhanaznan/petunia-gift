"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { DatabaseNotConfiguredError, tryGetDb } from "@/lib/db";
import { getRuntimeEnv } from "@/lib/runtime-env";
import { findAdminByEmail, seedAdminIfEmpty } from "./admins";
import { verifyPassword } from "./password";
import { getAdminSession } from "./session";

const credentialsSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  next: z.string().optional(),
});

export type LoginState = {
  error?: string;
  info?: string;
};

function safeNextPath(next: string | undefined): string {
  if (!next || !next.startsWith("/admin") || next.startsWith("//")) {
    return "/admin";
  }
  return next;
}

export async function loginAdminAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password (min 8 characters)." };
  }

  const db = await tryGetDb();
  if (!db) {
    return {
      error:
        "Database is not configured yet. Add Neon DATABASE_URL or Hyperdrive, then redeploy.",
    };
  }

  let adminId: string;
  let adminEmail: string;

  try {
    const admin = await findAdminByEmail(db, parsed.data.email);
    if (!admin) {
      return { error: "Invalid email or password." };
    }

    const ok = await verifyPassword(parsed.data.password, admin.passwordHash);
    if (!ok) {
      return { error: "Invalid email or password." };
    }

    adminId = admin.id;
    adminEmail = admin.email;
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) {
      return { error: error.message };
    }
    console.error("loginAdminAction failed", error);
    return { error: "Login failed. Check database connectivity and try again." };
  }

  const session = await getAdminSession();
  session.adminId = adminId;
  session.email = adminEmail;
  session.isLoggedIn = true;
  await session.save();

  redirect(safeNextPath(parsed.data.next));
}

export async function logoutAdminAction(): Promise<void> {
  const session = await getAdminSession();
  session.destroy();
  redirect("/admin/login");
}

/**
 * Creates the first admin from ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD
 * only when the admins table is empty.
 */
export async function seedFirstAdminAction(): Promise<LoginState> {
  const env = await getRuntimeEnv();
  const email = env.ADMIN_SEED_EMAIL;
  const password = env.ADMIN_SEED_PASSWORD;

  if (!email || !password) {
    return {
      error:
        "Set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD, then retry — or run npm run db:seed-admin locally.",
    };
  }

  if (password.length < 10) {
    return { error: "ADMIN_SEED_PASSWORD must be at least 10 characters." };
  }

  const db = await tryGetDb();
  if (!db) {
    return {
      error:
        "Database is not configured yet. Add Neon + Hyperdrive (or DATABASE_URL) first.",
    };
  }

  try {
    const result = await seedAdminIfEmpty(db, { email, password });
    if (result === "skipped") {
      return { info: "An admin already exists. Sign in with that account." };
    }
    return {
      info: `Seeded admin ${email.trim().toLowerCase()}. You can sign in now.`,
    };
  } catch (error) {
    console.error("seedFirstAdminAction failed", error);
    return {
      error:
        "Seed failed. Ensure migrations are applied (npm run db:push) and credentials are valid.",
    };
  }
}
