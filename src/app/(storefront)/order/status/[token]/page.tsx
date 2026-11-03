import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { spxExpressTrackUrl } from "@/lib/delyva/constants";
import { tryGetDb } from "@/lib/db";
import { orders, products, subProducts } from "@/lib/db/schema";
import { senToRm } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const db = await tryGetDb();
  if (!db) {
    return (
      <PageShell title="Order status" lead="Status is temporarily unavailable.">
        <p className="muted">Please try again shortly.</p>
      </PageShell>
    );
  }

  const [row] = await db
    .select({
      order: orders,
      productName: products.name,
      subName: subProducts.name,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .innerJoin(subProducts, eq(orders.subProductId, subProducts.id))
    .where(eq(orders.statusToken, token))
    .limit(1);

  if (!row) notFound();
  const order = row.order;
  const trackUrl = order.trackingNumber
    ? spxExpressTrackUrl(order.trackingNumber)
    : null;

  return (
    <PageShell
      title={order.publicRef}
      lead={`${row.productName} · ${row.subName}`}
    >
      <div className="stack" style={{ maxWidth: "28rem", margin: "0 auto" }}>
        <div className="panel stack">
          <p className="nature-tag">Status</p>
          <p style={{ margin: 0, textTransform: "capitalize" }}>
            {order.status.replaceAll("_", " ")}
          </p>
          <p className="muted" style={{ margin: 0 }}>
            Ship date {order.shipDate} · {senToRm(order.totalSen)}
          </p>
        </div>

        <div className="panel stack">
          <p className="nature-tag">Courier</p>
          <p style={{ margin: 0 }}>
            <strong>Shopee Express (SPX)</strong>
          </p>
          {order.trackingNumber ? (
            <>
              <p style={{ margin: 0 }}>
                Tracking{" "}
                <code style={{ letterSpacing: "0.04em" }}>
                  {order.trackingNumber}
                </code>
              </p>
              {trackUrl ? (
                <a
                  className="button"
                  href={trackUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Track on Shopee Express
                </a>
              ) : null}
            </>
          ) : (
            <p className="muted" style={{ margin: 0 }}>
              Tracking appears here once your gift is confirmed and handed to
              Shopee Express.
            </p>
          )}
        </div>

        <div className="panel stack">
          <p className="nature-tag">Deliver to</p>
          <p style={{ margin: 0 }}>
            <strong>{order.buyerName}</strong>
          </p>
          <p className="muted" style={{ margin: 0 }}>
            {order.addressLine1}
            {order.addressLine2 ? `, ${order.addressLine2}` : ""},{" "}
            {order.postcode} {order.city}, {order.state}
          </p>
        </div>
      </div>
    </PageShell>
  );
}
