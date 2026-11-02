import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assertAllowedMime,
  createPresignedUrl,
  customerImageKey,
  receiptKey,
  requireR2CredentialsFromEnv,
  tngQrKey,
} from "@/lib/r2";
import { getRuntimeEnv } from "@/lib/runtime-env";

const bodySchema = z.object({
  kind: z.enum(["customer_image", "receipt", "tng_qr"]),
  orderId: z.string().optional(),
  contentType: z.string(),
  ext: z.string().default("jpg"),
});

/**
 * Presign stub for browser → R2 uploads.
 * Requires R2_* env / secrets. Returns 503 when not configured.
 */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    const kind =
      parsed.data.kind === "receipt"
        ? "receipt"
        : parsed.data.kind === "tng_qr"
          ? "image"
          : "image";
    assertAllowedMime(parsed.data.contentType, kind === "receipt" ? "receipt" : "image");

    const env = await getRuntimeEnv();
    const creds = requireR2CredentialsFromEnv(env);
    const objectId = crypto.randomUUID();
    const version = new Date().toISOString().replace(/[:.]/g, "-");
    const key =
      parsed.data.kind === "receipt"
        ? receiptKey(parsed.data.orderId || "unknown", objectId, parsed.data.ext)
        : parsed.data.kind === "tng_qr"
          ? tngQrKey(version, parsed.data.ext)
          : customerImageKey(
              parsed.data.orderId || "draft",
              objectId,
              parsed.data.ext,
            );

    const signed = await createPresignedUrl(creds, {
      key,
      method: "PUT",
      contentType: parsed.data.contentType,
    });

    return NextResponse.json({ key, ...signed });
  } catch (error) {
    console.error("presign failed", error);
    return NextResponse.json(
      {
        error: "r2_not_configured",
        message:
          "Set R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY (and create bucket petunia-gift-media).",
      },
      { status: 503 },
    );
  }
}
