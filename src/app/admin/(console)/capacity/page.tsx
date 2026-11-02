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
      title="Capacity calendar"
      lead="Max orders per ship date × sub-product."
    >
      <ul className="route-list">
        {slots.map((s) => (
          <li key={s.id}>
            {s.shipDate} · {s.productName} / {s.subName} · max {s.maxOrders}
            {s.isOpen ? "" : " · closed"}
          </li>
        ))}
      </ul>

      <h2 style={{ marginTop: "2rem" }}>Add / update slot</h2>
      <AdminActionForm action={upsertCapacityAction}>
        <label className="stack">
          <span>Sub-product</span>
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
        <label className="stack">
          <span>Ship date</span>
          <input name="shipDate" type="date" required />
        </label>
        <label className="stack">
          <span>Max orders</span>
          <input name="maxOrders" type="number" min={1} defaultValue={10} required />
        </label>
        <label style={{ display: "flex", gap: "0.5rem" }}>
          <input name="isOpen" type="checkbox" defaultChecked /> Open
        </label>
      </AdminActionForm>
    </PageShell>
  );
}
