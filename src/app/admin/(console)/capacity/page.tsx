import { asc, eq } from "drizzle-orm";
import { AdminActionForm } from "@/components/admin/admin-form";
import { PageShell } from "@/components/page-shell";
import { upsertCapacityAction } from "@/lib/admin/catalog-actions";
import { tryGetDb } from "@/lib/db";
import { capacitySlots, products, subProducts } from "@/lib/db/schema";

export const metadata = { title: "Capacity" };
export const dynamic = "force-dynamic";

export default async function AdminCapacityPage() {
  const db = await tryGetDb();
  const slots = db
    ? await db
        .select({
          id: capacitySlots.id,
          shipDate: capacitySlots.shipDate,
          maxOrders: capacitySlots.maxOrders,
          isOpen: capacitySlots.isOpen,
          subName: subProducts.name,
          productName: products.name,
        })
        .from(capacitySlots)
        .innerJoin(subProducts, eq(capacitySlots.subProductId, subProducts.id))
        .innerJoin(products, eq(subProducts.productId, products.id))
        .orderBy(asc(capacitySlots.shipDate))
        .limit(100)
    : [];

  const subs = db
    ? await db
        .select({
          id: subProducts.id,
          label: products.name,
          sub: subProducts.name,
        })
        .from(subProducts)
        .innerJoin(products, eq(subProducts.productId, products.id))
        .orderBy(asc(products.sortOrder), asc(subProducts.sortOrder))
    : [];

  return (
    <PageShell
      kicker="Capacity"
      title="Ship-date calendar"
      lead="Max orders per ship date. Museum of Us shares one pool across all frames; F1 and Graduation stay per sub-product."
    >
      <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Ship date</th>
              <th>Product</th>
              <th>Sub-product</th>
              <th>Max</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((s) => (
              <tr key={s.id}>
                <td>{s.shipDate}</td>
                <td>{s.productName}</td>
                <td>{s.subName}</td>
                <td>{s.maxOrders}</td>
                <td>
                  <span
                    className="status-pill"
                    data-tone={s.isOpen ? "ok" : "danger"}
                  >
                    {s.isOpen ? "open" : "closed"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!slots.length ? <p className="muted">No capacity slots yet.</p> : null}

      <h2
        style={{
          fontFamily: "var(--font-display), sans-serif",
          letterSpacing: "-0.03em",
          fontSize: "1.4rem",
        }}
      >
        Add / update slot
      </h2>
      <AdminActionForm action={upsertCapacityAction}>
        <label className="stack">
          <span className="field-label">Sub-product</span>
          <select name="subProductId" required defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {subs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} / {s.sub}
              </option>
            ))}
          </select>
        </label>
        <div className="form-grid">
          <label className="stack">
            <span className="field-label">Ship date</span>
            <input name="shipDate" type="date" required />
          </label>
          <label className="stack">
            <span className="field-label">Max orders</span>
            <input name="maxOrders" type="number" min={1} defaultValue={10} required />
          </label>
        </div>
        <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input name="isOpen" type="checkbox" defaultChecked /> Open for checkout
        </label>
      </AdminActionForm>
    </PageShell>
  );
}
