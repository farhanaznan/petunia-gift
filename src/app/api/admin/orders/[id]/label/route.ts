import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/session";
import { DelyvaError, fetchDelyvaLabelPdf } from "@/lib/delyva/client";
import { getDb } from "@/lib/db";
import { orders } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const db = await getDb();
  const [order] = await db
    .select({
      publicRef: orders.publicRef,
      delyvaOrderId: orders.delyvaOrderId,
    })
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (!order.delyvaOrderId) {
    return NextResponse.json(
      { error: "No Delyva shipment on this order" },
      { status: 400 },
    );
  }

  try {
    const pdf = await fetchDelyvaLabelPdf(order.delyvaOrderId);
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="petunia-${order.publicRef}-label.pdf"`,
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
