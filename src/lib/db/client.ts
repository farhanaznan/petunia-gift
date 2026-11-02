import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getRuntimeEnv } from "@/lib/runtime-env";
import * as schema from "./schema";

export type AppDb =
  | ReturnType<typeof drizzleNeonHttp<typeof schema>>
  | ReturnType<typeof drizzleNodePostgres<typeof schema>>;

export class DatabaseNotConfiguredError extends Error {
  constructor(message = "Database is not configured") {
    super(message);
    this.name = "DatabaseNotConfiguredError";
  }
}

/**
 * Neon HTTP client for local `next dev` and tooling via DATABASE_URL.
 */
export function getDbFromDatabaseUrl(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzleNeonHttp(sql, { schema });
}

/**
 * Hyperdrive / TCP Postgres (Workers nodejs_compat) via `pg` Pool.
 */
export function getDbFromConnectionString(connectionString: string) {
  const pool = new Pool({ connectionString, max: 1 });
  return drizzleNodePostgres(pool, { schema });
}

export function getDbFromHyperdrive(hyperdrive: { connectionString: string }) {
  return getDbFromConnectionString(hyperdrive.connectionString);
}

/**
 * Resolve DB for server code:
 * 1) Cloudflare Hyperdrive binding
 * 2) DATABASE_URL / POSTGRES_URL (Neon HTTP)
 */
export async function getDb(): Promise<AppDb> {
  const env = await getRuntimeEnv();

  const hyperdrive = env.HYPERDRIVE as { connectionString?: string } | undefined;
  if (hyperdrive?.connectionString) {
    return getDbFromHyperdrive(hyperdrive as { connectionString: string });
  }

  const url = env.DATABASE_URL || env.POSTGRES_URL;
  if (url) {
    // Prefer TCP via pg when URL looks like standard postgres (works with Neon + Hyperdrive local).
    // Neon pooled HTTP is fine for serverless without Hyperdrive.
    if (url.includes("neon.tech") && !env.HYPERDRIVE) {
      return getDbFromDatabaseUrl(url);
    }
    return getDbFromConnectionString(url);
  }

  throw new DatabaseNotConfiguredError(
    "Set DATABASE_URL (local/Neon) or bind Hyperdrive (HYPERDRIVE) on Cloudflare",
  );
}

export async function tryGetDb(): Promise<AppDb | null> {
  try {
    return await getDb();
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) return null;
    throw error;
  }
}
