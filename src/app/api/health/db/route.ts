import { count } from "drizzle-orm";
import { NextResponse } from "next/server";
import { admins, tryGetDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Lightweight DB health check — proves Neon connectivity without leaking secrets. */
export async function GET() {
  const db = await tryGetDb();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "database_not_configured" },
      { status: 503 },
    );
  }

  try {
    const [row] = await db.select({ value: count() }).from(admins);
    return NextResponse.json({
      ok: true,
      driver: "neon-http",
      admins: row?.value ?? 0,
    });
  } catch (error) {
    console.error("db health failed", error);
    return NextResponse.json(
      { ok: false, error: "query_failed" },
      { status: 500 },
    );
  }
}
