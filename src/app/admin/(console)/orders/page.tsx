import Link from "next/link";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { OrdersBulkTable } from "@/components/admin/orders-bulk-table";
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
    conditions.push(
      gte(orders.createdAt, new Date(`${sp.orderDateFrom}T00:00:00.000Z`)),
    );
  }
  if (sp.orderDateTo && /^\d{4}-\d{2}-\d{2}$/.test(sp.orderDateTo)) {
    conditions.push(
      lte(orders.createdAt, new Date(`${sp.orderDateTo}T23:59:59.999Z`)),
    );
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
          delyvaOrderId: orders.delyvaOrderId,
          trackingNumber: orders.trackingNumber,
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
      kicker="Orders"
      title="Order desk"
      lead="Filter, bulk-confirm payment (one Delyva create per order), reject, or print SPX labels."
    >
      <form method="get" className="filter-bar">
        <div className="filter-bar-grid">
          <label className="stack">
            <span className="field-label">Order from</span>
            <input
              type="date"
              name="orderDateFrom"
              defaultValue={sp.orderDateFrom ?? ""}
            />
          </label>
          <label className="stack">
            <span className="field-label">Order to</span>
            <input
              type="date"
              name="orderDateTo"
              defaultValue={sp.orderDateTo ?? ""}
            />
          </label>
          <label className="stack">
            <span className="field-label">Ship date</span>
            <input type="date" name="shipDate" defaultValue={sp.shipDate ?? ""} />
          </label>
          <label className="stack">
            <span className="field-label">Sub-product</span>
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
            <span className="field-label">Status</span>
            <select name="status" defaultValue={sp.status ?? ""}>
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === "pending_payment_review" ? "Pending review" : s}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button className="button" type="submit">
            Apply filters
          </button>
          <Link className="button secondary" href="/admin/orders">
            Clear
          </Link>
        </div>
      </form>

      <OrdersBulkTable
        rows={rows.map((o) => ({
          id: o.id,
          publicRef: o.publicRef,
          status: o.status,
          shipDate: o.shipDate,
          totalLabel: senToRm(o.totalSen),
          email: o.email,
          productName: o.productName,
          subName: o.subName,
          hasDelyva: Boolean(o.delyvaOrderId),
          trackingNumber: o.trackingNumber,
        }))}
      />

      {!rows.length ? (
        <p className="muted" style={{ marginTop: "1rem" }}>
          No orders match these filters.
        </p>
      ) : null}
    </PageShell>
  );
}
