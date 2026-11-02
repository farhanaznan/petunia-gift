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
    <PageShell
      kicker="Catalog"
      title="Products"
      lead="Main products drive natures. Sub-products hold prices and config."
    >
      <ul className="product-rail">
        {rows.map((p) => (
          <li key={p.id}>
            <Link className="product-link" href={`/admin/products/${p.id}`}>
              <div>
                <p className="nature-tag">{p.nature.replaceAll("_", " ")}</p>
                <h2 className="product-link-title">
                  {p.name}
                  {p.badgeText ? <span className="badge">{p.badgeText}</span> : null}
                </h2>
                <p className="product-link-meta">
                  {p.slug}
                  {!p.isActive ? " · inactive" : ""}
                </p>
              </div>
              <div className="product-link-price">Edit</div>
            </Link>
          </li>
        ))}
      </ul>

      <h2
        style={{
          marginTop: "2rem",
          fontFamily: "var(--font-display), sans-serif",
          letterSpacing: "-0.03em",
          fontSize: "1.4rem",
        }}
      >
        New product
      </h2>
      <AdminActionForm action={upsertProductAction} submitLabel="Create product">
        <div className="form-grid">
          <label className="stack">
            <span className="field-label">Slug</span>
            <input name="slug" required placeholder="museum-of-us" />
          </label>
          <label className="stack">
            <span className="field-label">Name</span>
            <input name="name" required />
          </label>
          <label className="stack span-2">
            <span className="field-label">Description</span>
            <textarea name="description" rows={3} />
          </label>
          <label className="stack">
            <span className="field-label">Nature</span>
            <select name="nature" required defaultValue="museum_of_us">
              {PRODUCT_NATURES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="stack">
            <span className="field-label">Badge</span>
            <input name="badgeText" placeholder="HOT!" />
          </label>
          <label className="stack">
            <span className="field-label">Sort order</span>
            <input name="sortOrder" type="number" defaultValue={0} />
          </label>
          <label
            className="stack"
            style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.5rem" }}
          >
            <input name="isActive" type="checkbox" defaultChecked /> Active
          </label>
        </div>
      </AdminActionForm>
    </PageShell>
  );
}
