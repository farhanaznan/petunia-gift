import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Neon HTTP client for local `next dev` and Node tooling.
 * On Cloudflare Workers, prefer Hyperdrive via `getDbFromHyperdrive`.
 */
export function getDbFromDatabaseUrl(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

/**
 * Hyperdrive-backed client (Workers runtime).
 * Uses Neon HTTP over the Hyperdrive connection string for serverless Postgres.
 */
export function getDbFromHyperdrive(hyperdrive: { connectionString: string }) {
  return getDbFromDatabaseUrl(hyperdrive.connectionString);
}

export type AppDb =
  | ReturnType<typeof getDbFromDatabaseUrl>
  | ReturnType<typeof getDbFromHyperdrive>;
