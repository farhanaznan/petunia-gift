/**
 * Cloudflare Worker bindings for Petunia Gift.
 * Regenerate with: npm run cf-typegen
 */
interface CloudflareEnv {
  HYPERDRIVE: Hyperdrive;
  MEDIA_BUCKET: R2Bucket;
  ASSETS: Fetcher;

  /** Session password for iron-session (min 32 chars). Prefer secrets store in prod. */
  SESSION_SECRET: string;
  /** Optional: S3-compatible API credentials for R2 presigned URLs. */
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
  /** Public app URL, e.g. https://petunia-gift.example.workers.dev */
  APP_URL?: string;
}

export {};
