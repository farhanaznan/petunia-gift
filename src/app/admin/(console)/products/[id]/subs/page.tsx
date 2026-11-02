import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminActionForm } from "@/components/admin/admin-form";
import { PageShell } from "@/components/page-shell";
import { upsertSubProductAction } from "@/lib/admin/catalog-actions";
import { getDb } from "@/lib/db";
import { products, subProducts } from "@/lib/db/schema";
import { senToRm } from "@/lib/money";
import { natureRegistry } from "@/lib/natures/registry";

export const dynamic = "force-dynamic";

export default async function AdminSubProductsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await getDb();
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  if (!product) notFound();
  const subs = await db
    .select()
    .from(subProducts)
    .where(eq(subProducts.productId, id));
  const defaultConfig = JSON.stringify(
    natureRegistry[product.nature].defaultConfig(),
    null,
    2,
  );

  return (
    <PageShell title="Sub-products" lead={product.name}>
      <ul className="route-list">
        {subs.map((s) => (
          <li key={s.id}>
            {s.name} ({s.slug}) — {senToRm(s.priceSen)}
            {s.badgeText ? ` · ${s.badgeText}` : ""}
          </li>
        ))}
      </ul>

      <h2 style={{ marginTop: "2rem" }}>Add / note</h2>
      <p className="muted">
        Create new subs below. Editing existing rows: recreate with same slug is blocked by unique index — use SQL/studio for now or add edit forms later.
      </p>
      <AdminActionForm action={upsertSubProductAction} submitLabel="Create sub-product">
        <input type="hidden" name="productId" value={product.id} />
        <label className="stack">
          <span>Slug</span>
          <input name="slug" required />
        </label>
        <label className="stack">
          <span>Name</span>
          <input name="name" required />
        </label>
        <label className="stack">
          <span>Price (sen)</span>
          <input name="priceSen" type="number" required defaultValue={5000} />
        </label>
        <label className="stack">
          <span>Badge</span>
          <input name="badgeText" />
        </label>
        <label className="stack">
          <span>Sort order</span>
          <input name="sortOrder" type="number" defaultValue={0} />
        </label>
        <label className="stack">
          <span>Config JSON ({product.nature})</span>
          <textarea name="config" rows={8} defaultValue={defaultConfig} />
        </label>
        <label style={{ display: "flex", gap: "0.5rem" }}>
          <input name="isActive" type="checkbox" defaultChecked /> Active
        </label>
      </AdminActionForm>
    </PageShell>
  );
}
