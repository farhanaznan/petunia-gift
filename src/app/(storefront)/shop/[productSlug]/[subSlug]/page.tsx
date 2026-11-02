import Link from "next/link";
import { notFound } from "next/navigation";
import { NatureCustomizer } from "@/components/customizers/nature-customizer";
import { PageShell } from "@/components/page-shell";
import { getCapacityOnDate } from "@/lib/catalog/capacity";
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

  if (!shipDate || !/^\d{4}-\d{2}-\d{2}$/.test(shipDate)) {
    return (
      <PageShell
        kicker={product.name}
        title={sub.name}
        lead="Choose a ship date on the product page before customising."
      >
        <div className="cta-row">
          <Link className="button" href={`/shop/${product.slug}`}>
            Pick a ship date
          </Link>
        </div>
      </PageShell>
    );
  }

  const cap = await getCapacityOnDate({
    nature: product.nature,
    productId: product.id,
    subProductId: sub.id,
    shipDate,
  });
  if (!cap) {
    return (
      <PageShell
        kicker={product.name}
        title={sub.name}
        lead={`Ship date ${shipDate} is no longer available for this option.`}
      >
        <div className="cta-row">
          <Link className="button" href={`/shop/${product.slug}`}>
            Choose another date
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      kicker={`${product.name} · ${nature.label}`}
      title={sub.name}
      lead={`${senToRm(sub.priceSen)}${sub.badgeText ? ` · ${sub.badgeText}` : ""} · ship ${shipDate} · ${cap.remaining} left — personalise, then checkout.`}
    >
      <NatureCustomizer
        nature={product.nature}
        config={sub.config}
        productSlug={product.slug}
        subSlug={sub.slug}
        unitPriceSen={sub.priceSen}
        shipDate={shipDate}
      />
    </PageShell>
  );
}
