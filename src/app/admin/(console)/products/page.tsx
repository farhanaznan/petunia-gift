import Link from "next/link";
import { asc } from "drizzle-orm";
import { AdminActionForm } from "@/components/admin/admin-form";
import { PageShell } from "@/components/page-shell";
import { upsertProductAction } from "@/lib/admin/catalog-actions";
import { tryGetDb } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { PRODUCT_NATURES } from "@/lib/natures/types";

export const metadata = { title: "Products" };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const db = await tryGetDb();
  const rows = db
    ? await db.select().from(products).orderBy(asc(products.sortOrder))
    : [];

  return (
    <PageShell title="Products" lead="Main products CRUD.">
      <ul className="route-list">
        {rows.map((p) => (
          <li key={p.id}>
            <Link href={`/admin/products/${p.id}`}>
              {p.name} ({p.slug}) · {p.nature}
              {!p.isActive ? " · inactive" : ""}
            </Link>
          </li>
        ))}
      </ul>

      <h2 style={{ marginTop: "2rem" }}>New product</h2>
      <AdminActionForm action={upsertProductAction} submitLabel="Create product">
        <label className="stack">
          <span>Slug</span>
          <input name="slug" required placeholder="museum-of-us" />
        </label>
        <label className="stack">
          <span>Name</span>
          <input name="name" required />
        </label>
        <label className="stack">
          <span>Description</span>
          <textarea name="description" rows={3} />
        </label>
        <label className="stack">
          <span>Nature</span>
          <select name="nature" required defaultValue="museum_of_us">
            {PRODUCT_NATURES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="stack">
          <span>Badge</span>
          <input name="badgeText" />
        </label>
        <label className="stack">
          <span>Sort order</span>
          <input name="sortOrder" type="number" defaultValue={0} />
        </label>
        <label style={{ display: "flex", gap: "0.5rem" }}>
          <input name="isActive" type="checkbox" defaultChecked /> Active
        </label>
      </AdminActionForm>
    </PageShell>
  );
}
