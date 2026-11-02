import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { PageShell } from "@/components/page-shell";
import { tryGetDb } from "@/lib/db";
import { orders, products } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const db = await tryGetDb();
  const pending = db
    ? await db
        .select()
        .from(orders)
        .where(eq(orders.status, "pending_payment_review"))
        .orderBy(desc(orders.createdAt))
        .limit(10)
    : [];
  const productCount = db ? (await db.select().from(products)).length : 0;
  const recent = db
    ? await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(5)
    : [];

  return (
    <PageShell
      kicker="Operations"
      title="Ops home"
      lead="Review receipts, manage capacity, and keep the catalog ready for soft launch."
    >
      <div className="ops-stats">
        <div className="ops-stat">
          <strong>{pending.length}</strong>
          <span>Pending receipt reviews</span>
        </div>
        <div className="ops-stat">
          <strong>{productCount}</strong>
          <span>Products in catalog</span>
        </div>
        <div className="ops-stat">
          <strong>{recent.length}</strong>
          <span>Latest orders shown</span>
        </div>
      </div>

      <div className="sub-picker" style={{ marginTop: 0 }}>
        <Link className="sub-picker-item" href="/admin/orders?status=pending_payment_review">
          <div>
            <strong>Orders</strong>
            <p className="product-link-meta" style={{ marginTop: "0.35rem" }}>
              Filter and confirm payment reviews
            </p>
          </div>
          <div className="product-link-price">Open</div>
        </Link>
        <Link className="sub-picker-item" href="/admin/capacity">
          <div>
            <strong>Capacity</strong>
            <p className="product-link-meta" style={{ marginTop: "0.35rem" }}>
              Max orders per ship date × sub-product
            </p>
          </div>
          <div className="product-link-price">Open</div>
        </Link>
        <Link className="sub-picker-item" href="/admin/products">
          <div>
            <strong>Products</strong>
            <p className="product-link-meta" style={{ marginTop: "0.35rem" }}>
              Catalog, badges, nature config, images
            </p>
          </div>
          <div className="product-link-price">Open</div>
        </Link>
        <Link className="sub-picker-item" href="/admin/payments/qr">
          <div>
            <strong>Touch ’n Go QR</strong>
            <p className="product-link-meta" style={{ marginTop: "0.35rem" }}>
              Upload or replace the shared QR
            </p>
          </div>
          <div className="product-link-price">Open</div>
        </Link>
      </div>

      {pending.length ? (
        <div className="panel stack" style={{ marginTop: "1.5rem" }}>
          <strong>Needs review</strong>
          {pending.map((o) => (
            <Link key={o.id} href={`/admin/orders/${o.id}`}>
              {o.publicRef} · {o.email} · ship {o.shipDate}
            </Link>
          ))}
        </div>
      ) : null}
    </PageShell>
  );
}
