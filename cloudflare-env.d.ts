/**
 * Cloudflare Worker bindings for Petunia Gift.
 * Regenerate with: npm run cf-typegen
 */
interface CloudflareEnv {
  /** Present after Hyperdrive is wired in wrangler.jsonc */
  HYPERDRIVE?: Hyperdrive;
  /** Present after R2 bucket binding is restored */
  MEDIA_BUCKET?: R2Bucket;
  ASSETS: Fetcher;

  /** iron-session password (min 32 chars). Set via `wrangler secret put SESSION_SECRET`. */
  SESSION_SECRET?: string;
  /** Optional direct Neon URL if not using Hyperdrive yet */
  DATABASE_URL?: string;
  POSTGRES_URL?: string;
  ADMIN_SEED_EMAIL?: string;
  ADMIN_SEED_PASSWORD?: string;

  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
  APP_URL?: string;
}

export {};
