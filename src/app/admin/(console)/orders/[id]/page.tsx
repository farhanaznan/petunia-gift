import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminActionForm } from "@/components/admin/admin-form";
import { PageShell } from "@/components/page-shell";
import { updateOrderStatusAction } from "@/lib/admin/catalog-actions";
import {
  cancelDelyvaOrderAction,
  confirmOrderWithDelyvaAction,
  processDelyvaOrderAction,
  refreshDelyvaDetailsAction,
} from "@/lib/admin/delyva-actions";
import { spxExpressTrackUrl } from "@/lib/delyva/constants";
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
  const trackUrl = order.trackingNumber
    ? spxExpressTrackUrl(order.trackingNumber)
    : null;

  return (
    <PageShell
      kicker="Order detail"
      title={order.publicRef}
      lead={`${row.productName} · ${row.subName} · ${order.status.replaceAll("_", " ")}`}
    >
      <div className="checkout-layout">
        <div className="stack">
          <div className="panel stack">
            <p className="nature-tag">Customer &amp; delivery</p>
            <p style={{ margin: 0 }}>
              <strong>{order.buyerName}</strong> · {order.email}
            </p>
            <p className="muted" style={{ margin: 0 }}>
              Customer {order.customerPhone} · Recipient {order.recipientPhone}
            </p>
            <p style={{ margin: 0 }}>
              {order.addressLine1}
              {order.addressLine2 ? `, ${order.addressLine2}` : ""},{" "}
              {order.postcode} {order.city}, {order.state}, {order.country}
            </p>
            <p className="muted" style={{ margin: 0 }}>
              Ship date {order.shipDate}
            </p>
          </div>

          <div className="panel stack">
            <p className="nature-tag">Delyva · Shopee Express</p>
            {order.delyvaOrderId ? (
              <>
                <p style={{ margin: 0 }}>
                  Delyva order <code>{order.delyvaOrderId}</code>
                  {order.delyvaServiceCode ? (
                    <>
                      {" "}
                      · <code>{order.delyvaServiceCode}</code>
                    </>
                  ) : null}
                </p>
                <p className="muted" style={{ margin: 0 }}>
                  Status code {order.delyvaStatusCode ?? "—"}
                  {order.delyvaTrackingNo
                    ? ` · Delyva TN ${order.delyvaTrackingNo}`
                    : ""}
                </p>
                {order.trackingNumber ? (
                  <p style={{ margin: 0 }}>
                    Consignment / tracking{" "}
                    <strong>{order.trackingNumber}</strong>
                  </p>
                ) : (
                  <p className="muted" style={{ margin: 0 }}>
                    Consignment not issued yet — process or refresh details.
                  </p>
                )}
                <div className="cta-row" style={{ justifyContent: "flex-start" }}>
                  {trackUrl ? (
                    <a
                      className="button secondary"
                      href={trackUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      SPX tracker
                    </a>
                  ) : null}
                  <a
                    className="button secondary"
                    href={`/api/admin/orders/${order.id}/label`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Print label
                  </a>
                </div>
              </>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                No Delyva shipment yet. Confirm payment to create a Shopee
                Express order (1 kg) and save tracking.
              </p>
            )}
          </div>

          <div className="panel stack">
            <p className="nature-tag">Customization</p>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontSize: "0.85rem",
                margin: 0,
                fontFamily: "var(--font-body), sans-serif",
              }}
            >
              {JSON.stringify(order.customization, null, 2)}
            </pre>
            {"imageKeys" in (order.customization as object) ? (
              <ul className="upload-list">
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

          <div className="panel stack">
            <p className="nature-tag">Receipt</p>
            {order.receiptKey ? (
              <>
                <p className="muted" style={{ margin: 0 }}>
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
                    style={{
                      maxWidth: "min(420px, 100%)",
                      background: "#fff",
                      borderRadius: "0.55rem",
                    }}
                  />
                )}
              </>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                No receipt uploaded yet.
              </p>
            )}
          </div>
        </div>

        <aside className="checkout-summary stack">
          <div className="price-board">
            <div className="row">
              <span>Item</span>
              <span>{senToRm(order.unitPriceSen)}</span>
            </div>
            <div className="row">
              <span>Surcharge</span>
              <span>{senToRm(order.surchargeSen)}</span>
            </div>
            <div className="row">
              <span>Shipping</span>
              <span>{senToRm(order.shippingFeeSen)}</span>
            </div>
            <div className="row total">
              <span>Total</span>
              <span>{senToRm(order.totalSen)}</span>
            </div>
          </div>

          <AdminActionForm
            action={confirmOrderWithDelyvaAction}
            submitLabel="Confirm + create SPX"
          >
            <input type="hidden" name="id" value={order.id} />
            <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
              Creates a Delyva draft, processes it on Shopee Express (1 kg), and
              saves the tracking number.
            </p>
            <label className="stack">
              <span className="field-label">Admin notes</span>
              <textarea
                name="adminNotes"
                rows={2}
                defaultValue={order.adminNotes ?? ""}
              />
            </label>
          </AdminActionForm>

          {order.delyvaOrderId ? (
            <>
              <AdminActionForm
                action={processDelyvaOrderAction}
                submitLabel="Process / confirm Delyva"
              >
                <input type="hidden" name="id" value={order.id} />
              </AdminActionForm>
              <AdminActionForm
                action={refreshDelyvaDetailsAction}
                submitLabel="Get order details"
              >
                <input type="hidden" name="id" value={order.id} />
              </AdminActionForm>
              <AdminActionForm
                action={cancelDelyvaOrderAction}
                submitLabel="Cancel Delyva order"
              >
                <input type="hidden" name="id" value={order.id} />
              </AdminActionForm>
            </>
          ) : null}

          <AdminActionForm action={updateOrderStatusAction} submitLabel="Update status only">
            <input type="hidden" name="id" value={order.id} />
            <label className="stack">
              <span className="field-label">Status</span>
              <select name="status" defaultValue={order.status}>
                <option value="pending_payment_review">pending_payment_review</option>
                <option value="confirmed">confirmed</option>
                <option value="rejected">rejected</option>
                <option value="cancelled">cancelled</option>
                <option value="done">done</option>
              </select>
            </label>
            <label className="stack">
              <span className="field-label">Admin notes</span>
              <textarea
                name="adminNotes"
                rows={3}
                defaultValue={order.adminNotes ?? ""}
              />
            </label>
          </AdminActionForm>

          <p className="muted" style={{ margin: 0, fontSize: "0.8rem" }}>
            Customer status:{" "}
            <a href={`/order/status/${order.statusToken}`} target="_blank" rel="noreferrer">
              /order/status/…
            </a>
          </p>
        </aside>
      </div>
    </PageShell>
  );
}
