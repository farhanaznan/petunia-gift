import { inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/session";
import { DelyvaError, fetchDelyvaLabelPdf } from "@/lib/delyva/client";
import { DELYVA_API_BASE } from "@/lib/delyva/constants";
import { getRuntimeEnv } from "@/lib/runtime-env";
import { getDb } from "@/lib/db";
import { orders } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/**
 * Bulk (or single) shipping labels for orders that already have Delyva shipments.
 * Query: ?ids=<petunia-uuid>,<petunia-uuid>
 * Uses Delyva multi-id label endpoint when multiple shipments are selected.
 */
export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const ids = (url.searchParams.get("ids") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!ids.length) {
    return NextResponse.json({ error: "No order ids" }, { status: 400 });
  }

  const db = await getDb();
  const rows = await db
    .select({
      id: orders.id,
      publicRef: orders.publicRef,
      delyvaOrderId: orders.delyvaOrderId,
    })
    .from(orders)
    .where(inArray(orders.id, ids));

  const withShipment = rows.filter((r) => r.delyvaOrderId);
  if (!withShipment.length) {
    return NextResponse.json(
      { error: "None of the selected orders have a Delyva shipment yet." },
      { status: 400 },
    );
  }

  const delyvaIds = withShipment.map((r) => r.delyvaOrderId!).join(",");

  try {
    if (withShipment.length === 1) {
      const pdf = await fetchDelyvaLabelPdf(withShipment[0].delyvaOrderId!);
      return new NextResponse(pdf, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="petunia-${withShipment[0].publicRef}-label.pdf"`,
          "Cache-Control": "private, no-store",
        },
      });
    }

    const env = await getRuntimeEnv();
    const key = env.DELYVA_API_KEY?.trim();
    if (!key) {
      return NextResponse.json(
        { error: "DELYVA_API_KEY not configured" },
        { status: 503 },
      );
    }
    const res = await fetch(`${DELYVA_API_BASE}/order/${delyvaIds}/label`, {
      headers: {
        "X-Delyvax-Access-Token": key,
        Accept: "application/pdf,application/json",
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new DelyvaError(
        `Bulk label failed (${res.status}): ${text.slice(0, 200)}`,
      );
    }
    const pdf = await res.arrayBuffer();
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="petunia-labels-${withShipment.length}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    const message =
      err instanceof DelyvaError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Label failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
