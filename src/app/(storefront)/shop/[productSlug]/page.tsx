import { notFound } from "next/navigation";
import { ShipDatePicker } from "@/components/checkout/ship-date-picker";
import { ProductTile } from "@/components/gallery/product-tile";
import { PageShell } from "@/components/page-shell";
import {
  listOpenShipDatesForProduct,
  listSubsWithCapacityOnDate,
  usesSharedProductCapacity,
} from "@/lib/catalog/capacity";
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
  searchParams,
}: {
  params: Promise<{ productSlug: string }>;
  searchParams: Promise<{ shipDate?: string }>;
}) {
  const { productSlug } = await params;
  const { shipDate } = await searchParams;
  const product = await getProductBySlug(productSlug);
  if (!product) notFound();
  const subs = await listSubsForProduct(product.id);
  const nature = natureRegistry[product.nature];
  const dates = await listOpenShipDatesForProduct(product.id, product.nature);
  const selectedDate =
    shipDate && /^\d{4}-\d{2}-\d{2}$/.test(shipDate) ? shipDate : undefined;

  const availableSubIds = selectedDate
    ? new Set(
        (
          await listSubsWithCapacityOnDate(
            product.id,
            product.nature,
            selectedDate,
          )
        ).map((s) => s.subProductId),
      )
    : null;

  const visibleSubs = selectedDate
    ? subs.filter((s) => availableSubIds?.has(s.id))
    : [];

  const subImageEntries = await Promise.all(
    visibleSubs.map(async (sub) => {
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

      <ShipDatePicker
        productSlug={product.slug}
        dates={dates.map((d) => ({
          shipDate: d.shipDate,
          remaining: d.remaining,
        }))}
        selected={selectedDate}
      />

      {selectedDate ? (
        <>
          <p className="field-label" style={{ textAlign: "center" }}>
            Then choose an option · shipping {selectedDate}
          </p>
          {visibleSubs.length ? (
            <div className="product-row">
              {visibleSubs.map((sub, index) => (
                <ProductTile
                  key={sub.id}
                  href={`/shop/${product.slug}/${sub.slug}?shipDate=${encodeURIComponent(selectedDate)}`}
                  name={sub.name}
                  priceLabel={senToRm(sub.priceSen)}
                  imageKey={subImageById.get(sub.id) ?? product.heroImageKey}
                  badgeText={sub.badgeText}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <p className="form-error" style={{ textAlign: "center" }}>
              No options left for this ship date. Pick another date.
            </p>
          )}
        </>
      ) : dates.length ? (
        <div className="empty-state">
          <h3>Pick a date to continue</h3>
          <p>Available options appear after you choose a ship date with remaining capacity.</p>
        </div>
      ) : null}
    </PageShell>
  );
}
