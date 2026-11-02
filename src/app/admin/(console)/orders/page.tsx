import Link from "next/link";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { PageShell } from "@/components/page-shell";
import { tryGetDb } from "@/lib/db";
import { orders, products, subProducts } from "@/lib/db/schema";
import { senToRm } from "@/lib/money";

export const metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

const STATUSES = [
  "draft_hold",
  "pending_payment_review",
  "confirmed",
  "rejected",
  "cancelled",
  "expired_hold",
  "done",
] as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    orderDateFrom?: string;
    orderDateTo?: string;
    shipDate?: string;
    subProductId?: string;
    status?: string;
  }>;
}) {
  const sp = await searchParams;
  const db = await tryGetDb();

  const subs = db
    ? await db
        .select({
          id: subProducts.id,
          name: subProducts.name,
          productName: products.name,
        })
        .from(subProducts)
        .innerJoin(products, eq(subProducts.productId, products.id))
        .orderBy(asc(products.name), asc(subProducts.name))
    : [];

  const conditions = [];
  if (sp.status && STATUSES.includes(sp.status as (typeof STATUSES)[number])) {
    conditions.push(eq(orders.status, sp.status as (typeof STATUSES)[number]));
  }
  if (sp.shipDate && /^\d{4}-\d{2}-\d{2}$/.test(sp.shipDate)) {
    conditions.push(eq(orders.shipDate, sp.shipDate));
  }
  if (sp.subProductId) {
    conditions.push(eq(orders.subProductId, sp.subProductId));
  }
  if (sp.orderDateFrom && /^\d{4}-\d{2}-\d{2}$/.test(sp.orderDateFrom)) {
    conditions.push(gte(orders.createdAt, new Date(`${sp.orderDateFrom}T00:00:00.000Z`)));
  }
  if (sp.orderDateTo && /^\d{4}-\d{2}-\d{2}$/.test(sp.orderDateTo)) {
    conditions.push(lte(orders.createdAt, new Date(`${sp.orderDateTo}T23:59:59.999Z`)));
  }

  const rows = db
    ? await db
        .select({
          id: orders.id,
          publicRef: orders.publicRef,
          status: orders.status,
          shipDate: orders.shipDate,
          totalSen: orders.totalSen,
          email: orders.email,
          createdAt: orders.createdAt,
          subName: subProducts.name,
          productName: products.name,
        })
        .from(orders)
        .innerJoin(subProducts, eq(orders.subProductId, subProducts.id))
        .innerJoin(products, eq(orders.productId, products.id))
        .where(conditions.length ? and(...conditions) : sql`true`)
        .orderBy(desc(orders.createdAt))
        .limit(100)
    : [];

  return (
    <PageShell
      title="Orders"
      lead="Filter by order date, ship date, sub-product, or status."
    >
      <form method="get" className="panel stack" style={{ marginBottom: "1.25rem" }}>
        <div
          style={{
            display: "grid",
            gap: "0.75rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          }}
        >
          <label className="stack">
            <span>Order date from</span>
            <input
              type="date"
              name="orderDateFrom"
              defaultValue={sp.orderDateFrom ?? ""}
            />
          </label>
          <label className="stack">
            <span>Order date to</span>
            <input
              type="date"
              name="orderDateTo"
              defaultValue={sp.orderDateTo ?? ""}
            />
          </label>
          <label className="stack">
            <span>Ship date</span>
            <input type="date" name="shipDate" defaultValue={sp.shipDate ?? ""} />
          </label>
          <label className="stack">
            <span>Sub-product</span>
            <select name="subProductId" defaultValue={sp.subProductId ?? ""}>
              <option value="">All</option>
              {subs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.productName} · {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="stack">
            <span>Status</span>
            <select name="status" defaultValue={sp.status ?? ""}>
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="button" type="submit">
            Apply filters
          </button>
          <Link className="button secondary" href="/admin/orders">
            Clear
          </Link>
        </div>
      </form>

      <ul className="route-list">
        {rows.map((o) => (
          <li key={o.id}>
            <Link href={`/admin/orders/${o.id}`}>
              {o.publicRef} · {o.status} · ship {o.shipDate} · {senToRm(o.totalSen)} ·{" "}
              {o.productName}/{o.subName} · {o.email}
            </Link>
          </li>
        ))}
      </ul>
      {!rows.length ? <p className="muted">No orders match these filters.</p> : null}
    </PageShell>
  );
}
