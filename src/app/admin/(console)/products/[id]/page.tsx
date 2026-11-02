import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminActionForm } from "@/components/admin/admin-form";
import { MediaKeyField } from "@/components/admin/media-key-field";
import { PageShell } from "@/components/page-shell";
import { upsertProductAction } from "@/lib/admin/catalog-actions";
import { getDb } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { PRODUCT_NATURES } from "@/lib/natures/types";

export const dynamic = "force-dynamic";

export default async function AdminProductEditPage({
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

  return (
    <PageShell title={product.name} lead={`Edit ${product.slug}`}>
      <p>
        <Link href={`/admin/products/${product.id}/subs`}>Manage sub-products →</Link>
      </p>
      {product.heroImageKey ? (
        <div className="panel" style={{ marginBottom: "1rem" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/media?key=${encodeURIComponent(product.heroImageKey)}`}
            alt={`${product.name} hero`}
            style={{ maxWidth: "min(320px, 100%)" }}
          />
        </div>
      ) : null}
      <AdminActionForm action={upsertProductAction}>
        <input type="hidden" name="id" value={product.id} />
        <label className="stack">
          <span>Slug</span>
          <input name="slug" required defaultValue={product.slug} />
        </label>
        <label className="stack">
          <span>Name</span>
          <input name="name" required defaultValue={product.name} />
        </label>
        <label className="stack">
          <span>Description</span>
          <textarea name="description" rows={3} defaultValue={product.description} />
        </label>
        <label className="stack">
          <span>Nature</span>
          <select name="nature" required defaultValue={product.nature}>
            {PRODUCT_NATURES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="stack">
          <span>Badge (e.g. HOT!)</span>
          <input name="badgeText" defaultValue={product.badgeText ?? ""} />
        </label>
        <MediaKeyField
          name="heroImageKey"
          kind="product_hero"
          label="Hero image"
          defaultKey={product.heroImageKey ?? ""}
          productId={product.id}
        />
        <label className="stack">
          <span>Sort order</span>
          <input name="sortOrder" type="number" defaultValue={product.sortOrder} />
        </label>
        <label style={{ display: "flex", gap: "0.5rem" }}>
          <input name="isActive" type="checkbox" defaultChecked={product.isActive} />{" "}
          Active
        </label>
      </AdminActionForm>
    </PageShell>
  );
}
