import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { SubProductEditor } from "@/components/admin/sub-product-editor";
import { PageShell } from "@/components/page-shell";
import { addSubProductImageAction } from "@/lib/admin/catalog-actions";
import { getDb } from "@/lib/db";
import { products, subProductImages, subProducts } from "@/lib/db/schema";
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
    .where(eq(subProducts.productId, id))
    .orderBy(asc(subProducts.sortOrder));

  const images = await db
    .select()
    .from(subProductImages)
    .innerJoin(subProducts, eq(subProductImages.subProductId, subProducts.id))
    .where(eq(subProducts.productId, id));

  const imagesBySub = new Map<string, { id: string; storageKey: string; alt: string }[]>();
  for (const row of images) {
    const list = imagesBySub.get(row.sub_product_images.subProductId) ?? [];
    list.push({
      id: row.sub_product_images.id,
      storageKey: row.sub_product_images.storageKey,
      alt: row.sub_product_images.alt,
    });
    imagesBySub.set(row.sub_product_images.subProductId, list);
  }

  const defaultConfig = JSON.stringify(
    natureRegistry[product.nature].defaultConfig(),
    null,
    2,
  );

  return (
    <PageShell title="Sub-products" lead={product.name}>
      <SubProductEditor
        productId={product.id}
        nature={product.nature}
        defaultConfig={defaultConfig}
        addImageAction={addSubProductImageAction}
        subs={subs.map((s) => ({
          id: s.id,
          slug: s.slug,
          name: s.name,
          description: s.description,
          priceSen: s.priceSen,
          badgeText: s.badgeText,
          isActive: s.isActive,
          sortOrder: s.sortOrder,
          config: s.config,
          images: imagesBySub.get(s.id) ?? [],
        }))}
      />
    </PageShell>
  );
}
