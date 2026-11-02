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
 * Neon HTTP (pooled DATABASE_URL) — preferred for Next.js serverless / edge-style one-shot queries.
 * See Neon skill: pooled for web apps; direct for migrations.
 */
export function getDbFromDatabaseUrl(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzleNeonHttp(sql, { schema });
}

/**
 * TCP via `pg` — used with Cloudflare Hyperdrive (nodejs_compat) later.
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
 * 1) Cloudflare Hyperdrive binding (Workers)
 * 2) DATABASE_URL (Neon pooled) via serverless HTTP driver
 */
export async function getDb(): Promise<AppDb> {
  const env = await getRuntimeEnv();

  const hyperdrive = env.HYPERDRIVE as { connectionString?: string } | undefined;
  if (hyperdrive?.connectionString) {
    return getDbFromHyperdrive(hyperdrive as { connectionString: string });
  }

  const url = env.DATABASE_URL || env.POSTGRES_URL;
  if (url) {
    return getDbFromDatabaseUrl(url);
  }

  throw new DatabaseNotConfiguredError(
    "Set DATABASE_URL (Neon pooled) or bind Hyperdrive (HYPERDRIVE) on Cloudflare",
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

/** Direct (unpooled) URL for migrations / admin tooling when available. */
export function resolveMigrationDatabaseUrl(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  return (
    env.DATABASE_URL_UNPOOLED ||
    env.DATABASE_URL ||
    env.POSTGRES_URL
  );
}
