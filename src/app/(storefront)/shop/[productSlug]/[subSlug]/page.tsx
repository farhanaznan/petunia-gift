import Link from "next/link";
import { notFound } from "next/navigation";
import { ShipDatePicker } from "@/components/checkout/ship-date-picker";
import { NatureCustomizer } from "@/components/customizers/nature-customizer";
import { PageShell } from "@/components/page-shell";
import {
  getCapacityOnDate,
  listOpenCapacityWithRemaining,
  usesSharedProductCapacity,
} from "@/lib/catalog/capacity";
import { getSubBySlugs } from "@/lib/catalog/queries";
import { senToRm } from "@/lib/money";
import { natureRegistry } from "@/lib/natures/registry";

export const dynamic = "force-dynamic";

export default async function SubProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ productSlug: string; subSlug: string }>;
  searchParams: Promise<{ shipDate?: string }>;
}) {
  const { productSlug, subSlug } = await params;
  const { shipDate } = await searchParams;
  const found = await getSubBySlugs(productSlug, subSlug);
  if (!found) notFound();
  const { product, sub } = found;
  const nature = natureRegistry[product.nature];
  const hrefBase = `/shop/${product.slug}/${sub.slug}`;
  const selectedDate =
    shipDate && /^\d{4}-\d{2}-\d{2}$/.test(shipDate) ? shipDate : undefined;

  const dates = await listOpenCapacityWithRemaining(sub.id);

  if (!selectedDate) {
    return (
      <PageShell
        kicker={`${product.name} · ${nature.label}`}
        title={sub.name}
        lead={`${senToRm(sub.priceSen)}${sub.badgeText ? ` · ${sub.badgeText}` : ""} — pick a ship date with remaining capacity, then personalise.`}
      >
        {usesSharedProductCapacity(product.nature) ? (
          <p className="muted" style={{ textAlign: "center", marginBottom: "1rem" }}>
            Museum frames share one capacity pool per ship date.
          </p>
        ) : null}
        <ShipDatePicker
          hrefBase={hrefBase}
          dates={dates.map((d) => ({
            shipDate: d.shipDate,
            remaining: d.remaining,
          }))}
          label="Choose a ship date"
        />
        <div className="cta-row">
          <Link className="button secondary" href={`/shop/${product.slug}`}>
            Back to options
          </Link>
        </div>
      </PageShell>
    );
  }

  const cap = await getCapacityOnDate({
    nature: product.nature,
    productId: product.id,
    subProductId: sub.id,
    shipDate: selectedDate,
  });
  if (!cap) {
    return (
      <PageShell
        kicker={product.name}
        title={sub.name}
        lead={`Ship date ${selectedDate} is no longer available for this option.`}
      >
        <ShipDatePicker
          hrefBase={hrefBase}
          dates={dates.map((d) => ({
            shipDate: d.shipDate,
            remaining: d.remaining,
          }))}
          label="Pick another ship date"
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      kicker={`${product.name} · ${nature.label}`}
      title={sub.name}
      lead={`${senToRm(sub.priceSen)}${sub.badgeText ? ` · ${sub.badgeText}` : ""} · ship ${selectedDate} · ${cap.remaining} left — personalise, then checkout.`}
    >
      <ShipDatePicker
        hrefBase={hrefBase}
        dates={dates.map((d) => ({
          shipDate: d.shipDate,
          remaining: d.remaining,
        }))}
        selected={selectedDate}
        label="Ship date"
      />
      <NatureCustomizer
        nature={product.nature}
        config={sub.config}
        productSlug={product.slug}
        subSlug={sub.slug}
        unitPriceSen={sub.priceSen}
        shipDate={selectedDate}
      />
    </PageShell>
  );
}
