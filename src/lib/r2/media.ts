import { getRuntimeEnv } from "@/lib/runtime-env";
import {
  customerImageKey,
  productHeroKey,
  receiptKey,
  subProductImageKey,
  tngQrKey,
} from "./keys";
import { ALLOWED_UPLOAD_MIME, MAX_UPLOAD_BYTES, assertAllowedMime } from "./signed-url";

export async function getMediaBucket(): Promise<R2Bucket | null> {
  const env = await getRuntimeEnv();
  return (env.MEDIA_BUCKET as R2Bucket | undefined) ?? null;
}

export type UploadKind =
  | "customer_image"
  | "receipt"
  | "tng_qr"
  | "product_hero"
  | "sub_product_image";

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "application/pdf") return "pdf";
  return "jpg";
}

export async function uploadToMediaBucket(input: {
  kind: UploadKind;
  file: File;
  orderId?: string;
  productId?: string;
  subProductId?: string;
}): Promise<{ key: string; mime: string; byteSize: number }> {
  const bucket = await getMediaBucket();
  if (!bucket) {
    throw new Error("MEDIA_BUCKET binding is not configured");
  }

  const mime = input.file.type || "application/octet-stream";
  if (input.kind === "receipt") {
    assertAllowedMime(mime, "receipt");
  } else {
    assertAllowedMime(mime, "image");
  }
  if (input.file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File exceeds 10MB limit");
  }

  const ext = extFromMime(mime);
  const id = crypto.randomUUID();
  const version = new Date().toISOString().replace(/[:.]/g, "-");

  let key: string;
  switch (input.kind) {
    case "customer_image":
      key = customerImageKey(input.orderId || "draft", id, ext);
      break;
    case "receipt":
      key = receiptKey(input.orderId || "unknown", id, ext);
      break;
    case "tng_qr":
      key = tngQrKey(version, ext);
      break;
    case "product_hero":
      key = productHeroKey(input.productId || "unknown", `${id}.${ext}`);
      break;
    case "sub_product_image":
      key = subProductImageKey(
        input.productId || "unknown",
        input.subProductId || "unknown",
        `${id}.${ext}`,
      );
      break;
    default:
      throw new Error("Unsupported upload kind");
  }

  const bytes = await input.file.arrayBuffer();
  await bucket.put(key, bytes, {
    httpMetadata: { contentType: mime },
  });

  return { key, mime, byteSize: input.file.size };
}

export async function readMediaObject(key: string): Promise<R2ObjectBody | null> {
  const bucket = await getMediaBucket();
  if (!bucket) return null;
  return bucket.get(key);
}

export { ALLOWED_UPLOAD_MIME, MAX_UPLOAD_BYTES };
