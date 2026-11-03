import { createR2S3Client, getR2S3Endpoint, type R2Credentials } from "./client";

const DEFAULT_PUT_TTL_SECONDS = 10 * 60; // 10 minutes for browser upload
const DEFAULT_GET_TTL_SECONDS = 5 * 60; // 5 minutes for private view (receipts / photos)

export type PresignOptions = {
  key: string;
  method: "PUT" | "GET";
  contentType?: string;
  expiresInSeconds?: number;
};

/**
 * Presigned S3-compatible URL against Cloudflare R2.
 * Browser uploads go directly to R2; server only stores the object key.
 */
export async function createPresignedUrl(
  creds: R2Credentials,
  options: PresignOptions,
): Promise<{ url: string; expiresInSeconds: number }> {
  const expiresInSeconds =
    options.expiresInSeconds ??
    (options.method === "PUT" ? DEFAULT_PUT_TTL_SECONDS : DEFAULT_GET_TTL_SECONDS);

  const client = createR2S3Client(creds);
  const endpoint = getR2S3Endpoint(creds.accountId);
  const objectUrl = `${endpoint}/${creds.bucketName}/${options.key}`;

  const headers: HeadersInit = {};
  if (options.method === "PUT" && options.contentType) {
    headers["content-type"] = options.contentType;
  }

  const signed = await client.sign(
    new Request(objectUrl, { method: options.method, headers }),
    {
      aws: {
        signQuery: true,
        datetime: undefined,
      },
    },
  );

  // aws4fetch signQuery does not take expires directly on all versions —
  // append X-Amz-Expires when missing for R2 compatibility.
  const url = new URL(signed.url);
  if (!url.searchParams.has("X-Amz-Expires")) {
    url.searchParams.set("X-Amz-Expires", String(expiresInSeconds));
  }

  return { url: url.toString(), expiresInSeconds };
}

export const ALLOWED_UPLOAD_MIME = {
  image: ["image/jpeg", "image/png", "image/webp"] as const,
  receipt: ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const,
};

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

export function assertAllowedMime(
  mime: string,
  kind: keyof typeof ALLOWED_UPLOAD_MIME,
): void {
  const allowed = ALLOWED_UPLOAD_MIME[kind] as readonly string[];
  if (!allowed.includes(mime)) {
    throw new Error(`Unsupported MIME type for ${kind}: ${mime}`);
  }
}
