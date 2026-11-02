import { notFound } from "next/navigation";
import { NatureCustomizer } from "@/components/customizers/nature-customizer";
import { PageShell } from "@/components/page-shell";
import { getSubBySlugs } from "@/lib/catalog/queries";
import { senToRm } from "@/lib/money";
import { natureRegistry } from "@/lib/natures/registry";

export const dynamic = "force-dynamic";

export default async function SubProductPage({
  params,
}: {
  params: Promise<{ productSlug: string; subSlug: string }>;
}) {
  const { productSlug, subSlug } = await params;
  const found = await getSubBySlugs(productSlug, subSlug);
  if (!found) notFound();
  const { product, sub } = found;
  const nature = natureRegistry[product.nature];

  return (
    <PageShell
      title={sub.name}
      lead={`${product.name} · ${nature.label} · ${senToRm(sub.priceSen)}${sub.badgeText ? ` · ${sub.badgeText}` : ""}`}
    >
      <NatureCustomizer
        nature={product.nature}
        config={sub.config}
        productSlug={product.slug}
        subSlug={sub.slug}
        unitPriceSen={sub.priceSen}
      />
    </PageShell>
  );
}
