import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/session";
import { uploadToMediaBucket, type UploadKind } from "@/lib/r2/media";

export const runtime = "nodejs";

const KINDS = new Set<UploadKind>([
  "customer_image",
  "receipt",
  "tng_qr",
  "product_hero",
  "sub_product_image",
]);

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const kind = String(form.get("kind") || "") as UploadKind;
    const file = form.get("file");

    if (!KINDS.has(kind) || !(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "invalid_upload" }, { status: 400 });
    }

    if (kind === "tng_qr" || kind === "product_hero" || kind === "sub_product_image") {
      const session = await requireAdminSession();
      if (!session) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
    }

    const result = await uploadToMediaBucket({
      kind,
      file,
      orderId: String(form.get("orderId") || "") || undefined,
      productId: String(form.get("productId") || "") || undefined,
      subProductId: String(form.get("subProductId") || "") || undefined,
    });

    return NextResponse.json({
      key: result.key,
      mime: result.mime,
      byteSize: result.byteSize,
      url: `/api/media?key=${encodeURIComponent(result.key)}`,
    });
  } catch (error) {
    console.error("upload failed", error);
    const message = error instanceof Error ? error.message : "upload_failed";
    const status = message.includes("MEDIA_BUCKET") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
