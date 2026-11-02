import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/session";
import { tryGetDb } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { isPrivateMediaKey } from "@/lib/r2/keys";
import { readMediaObject } from "@/lib/r2/media";

export const runtime = "nodejs";

/**
 * Serve R2 objects via Workers binding.
 * Receipts require admin session (or matching order status token).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const token = searchParams.get("token");
  const ref = searchParams.get("ref");

  if (!key) {
    return NextResponse.json({ error: "missing_key" }, { status: 400 });
  }

  if (key.startsWith("receipts/")) {
    const admin = await requireAdminSession();
    if (!admin) {
      if (!token || !ref) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
      const db = await tryGetDb();
      if (!db) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
      const [order] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.publicRef, ref), eq(orders.statusToken, token)))
        .limit(1);
      if (!order || order.receiptKey !== key) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
    }
  } else if (isPrivateMediaKey(key)) {
    // customer images: allow with order token OR admin
    const admin = await requireAdminSession();
    if (!admin && !(token && ref)) {
      // draft uploads during customize (keys under customer/draft/) are readable briefly
      if (!key.startsWith("customer/draft/")) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
    }
  }

  const obj = await readMediaObject(key);
  if (!obj) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const headers = new Headers();
  headers.set(
    "content-type",
    obj.httpMetadata?.contentType || "application/octet-stream",
  );
  headers.set("cache-control", "private, max-age=60");
  return new NextResponse(obj.body, { headers });
}
