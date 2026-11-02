import Link from "next/link";
import { notFound } from "next/navigation";
import { ShipDatePicker } from "@/components/checkout/ship-date-picker";
import { PageShell } from "@/components/page-shell";
import {
  listOpenShipDatesForProduct,
  listSubsWithCapacityOnDate,
  usesSharedProductCapacity,
} from "@/lib/catalog/capacity";
import {
  getProductBySlug,
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

  return (
    <PageShell kicker={nature.label} title={product.name} lead={product.description}>
      {product.heroImageKey ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/media?key=${encodeURIComponent(product.heroImageKey)}`}
          alt=""
          style={{
            width: "100%",
            aspectRatio: "16 / 9",
            objectFit: "cover",
            marginBottom: "1.75rem",
            background: "var(--placeholder)",
          }}
        />
      ) : (
        <div
          className="masonry-placeholder"
          style={{ aspectRatio: "16 / 9", marginBottom: "1.75rem" }}
          aria-hidden
        />
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
            <div className="sub-picker" role="list">
              {visibleSubs.map((sub) => (
                <Link
                  key={sub.id}
                  role="listitem"
                  className="sub-picker-item"
                  href={`/shop/${product.slug}/${sub.slug}?shipDate=${encodeURIComponent(selectedDate)}`}
                >
                  <div>
                    <strong>
                      {sub.name}
                      {sub.badgeText ? (
                        <span className="badge">{sub.badgeText}</span>
                      ) : null}
                    </strong>
                    <p className="product-link-meta">
                      {sub.description || "Select to customise & checkout"}
                    </p>
                  </div>
                  <div className="product-link-price">{senToRm(sub.priceSen)}</div>
                </Link>
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
