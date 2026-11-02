import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminActionForm } from "@/components/admin/admin-form";
import { PageShell } from "@/components/page-shell";
import { updateOrderStatusAction } from "@/lib/admin/catalog-actions";
import { getDb } from "@/lib/db";
import { orders, products, subProducts } from "@/lib/db/schema";
import { senToRm } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await getDb();
  const [row] = await db
    .select({
      order: orders,
      productName: products.name,
      subName: subProducts.name,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .innerJoin(subProducts, eq(orders.subProductId, subProducts.id))
    .where(eq(orders.id, id))
    .limit(1);
  if (!row) notFound();
  const order = row.order;

  return (
    <PageShell
      title={order.publicRef}
      lead={`${row.productName} · ${row.subName} · ${order.status}`}
    >
      <div className="panel stack">
        <p>
          Item {senToRm(order.unitPriceSen)} · surcharge {senToRm(order.surchargeSen)} ·
          shipping {senToRm(order.shippingFeeSen)} ·{" "}
          <strong>total {senToRm(order.totalSen)}</strong>
        </p>
        <p>Ship date: {order.shipDate}</p>
        <p>
          {order.buyerName} · {order.email}
        </p>
        <p>
          Customer phone {order.customerPhone} · Recipient phone {order.recipientPhone}
        </p>
        <p>
          {order.addressLine1}
          {order.addressLine2 ? `, ${order.addressLine2}` : ""}, {order.postcode}{" "}
          {order.city}, {order.state}, {order.country}
        </p>
      </div>

      <div className="panel stack" style={{ marginTop: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Customization</h2>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem", margin: 0 }}>
          {JSON.stringify(order.customization, null, 2)}
        </pre>
        {"imageKeys" in (order.customization as object) ? (
          <ul className="route-list">
            {((order.customization as { imageKeys?: string[] }).imageKeys ?? []).map(
              (key) => (
                <li key={key}>
                  <a
                    href={`/api/media?key=${encodeURIComponent(key)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Customer image
                  </a>
                </li>
              ),
            )}
          </ul>
        ) : null}
      </div>

      <div className="panel stack" style={{ marginTop: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Receipt</h2>
        {order.receiptKey ? (
          <>
            <p className="muted">
              <code>{order.receiptKey}</code>
            </p>
            {order.receiptKey.endsWith(".pdf") ? (
              <a
                className="button secondary"
                href={`/api/media?key=${encodeURIComponent(order.receiptKey)}`}
                target="_blank"
                rel="noreferrer"
              >
                Open PDF receipt
              </a>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/media?key=${encodeURIComponent(order.receiptKey)}`}
                alt="Payment receipt"
                style={{ maxWidth: "min(420px, 100%)", background: "#fff" }}
              />
            )}
          </>
        ) : (
          <p className="muted">No receipt uploaded yet.</p>
        )}
      </div>

      <h2 style={{ marginTop: "1.5rem" }}>Update status</h2>
      <AdminActionForm action={updateOrderStatusAction} submitLabel="Update order">
        <input type="hidden" name="id" value={order.id} />
        <label className="stack">
          <span>Status</span>
          <select name="status" defaultValue={order.status}>
            <option value="pending_payment_review">pending_payment_review</option>
            <option value="confirmed">confirmed</option>
            <option value="rejected">rejected</option>
            <option value="cancelled">cancelled</option>
            <option value="done">done</option>
          </select>
        </label>
        <label className="stack">
          <span>Admin notes</span>
          <textarea name="adminNotes" rows={3} defaultValue={order.adminNotes ?? ""} />
        </label>
      </AdminActionForm>
    </PageShell>
  );
}
