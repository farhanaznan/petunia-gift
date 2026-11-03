import { notFound } from "next/navigation";
import { ProductTile } from "@/components/gallery/product-tile";
import { PageShell } from "@/components/page-shell";
import { usesSharedProductCapacity } from "@/lib/catalog/capacity";
import {
  getProductBySlug,
  listSubImages,
  listSubsForProduct,
} from "@/lib/catalog/queries";
import { senToRm } from "@/lib/money";
import { natureRegistry } from "@/lib/natures/registry";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productSlug: string }>;
}) {
  const { productSlug } = await params;
  const product = await getProductBySlug(productSlug);
  if (!product) notFound();
  const subs = await listSubsForProduct(product.id);
  const nature = natureRegistry[product.nature];

  const subImageEntries = await Promise.all(
    subs.map(async (sub) => {
      try {
        const images = await listSubImages(sub.id);
        return [sub.id, images[0]?.storageKey ?? null] as const;
      } catch {
        return [sub.id, null] as const;
      }
    }),
  );
  const subImageById = new Map(subImageEntries);

  return (
    <PageShell kicker={nature.label} title={product.name} lead={product.description}>
      {product.heroImageKey ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="product-hero-frame"
          src={`/api/media?key=${encodeURIComponent(product.heroImageKey)}`}
          alt=""
        />
      ) : (
        <div className="masonry-placeholder product-hero-frame" aria-hidden />
      )}

      {product.badgeText ? (
        <p style={{ textAlign: "center", marginTop: "-0.5rem" }}>
          <span className="badge">{product.badgeText}</span>
        </p>
      ) : null}

      {usesSharedProductCapacity(product.nature) ? (
        <p className="muted" style={{ textAlign: "center", marginBottom: "1rem" }}>
          Museum frames share one capacity pool per ship date.
        </p>
      ) : null}

      <p className="field-label" style={{ textAlign: "center" }}>
        Choose an option
      </p>

      {subs.length ? (
        <div className="product-row">
          {subs.map((sub, index) => (
            <ProductTile
              key={sub.id}
              href={`/shop/${product.slug}/${sub.slug}`}
              name={sub.name}
              priceLabel={senToRm(sub.priceSen)}
              imageKey={subImageById.get(sub.id) ?? product.heroImageKey}
              badgeText={sub.badgeText}
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No options yet</h3>
          <p>This collection is being prepared.</p>
        </div>
      )}
    </PageShell>
  );
}
