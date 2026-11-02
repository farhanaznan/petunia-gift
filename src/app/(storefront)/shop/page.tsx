import { ProductTile } from "@/components/gallery/product-tile";
import { PageShell } from "@/components/page-shell";
import { listActiveProducts, listSubsForProduct } from "@/lib/catalog/queries";
import { senToRm } from "@/lib/money";

export const metadata = { title: "Shop" };
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const products = await listActiveProducts();

  const tiles = await Promise.all(
    products.map(async (product, index) => {
      const subs = await listSubsForProduct(product.id);
      const from = subs.reduce<number | null>((min, s) => {
        if (min == null || s.priceSen < min) return s.priceSen;
        return min;
      }, null);
      return { product, from, tall: index % 3 === 1, optionCount: subs.length };
    }),
  );

  return (
    <PageShell
      kicker="Shop"
      title="Collections"
      lead={
        products.length
          ? "Choose a collection, pick your option, personalise where needed, then reserve a ship date."
          : "Catalog is empty. Run npm run db:seed-catalog after Neon is linked."
      }
    >
      <div className="masonry">
        {tiles.map(({ product, from, tall, optionCount }) => (
          <ProductTile
            key={product.id}
            href={`/shop/${product.slug}`}
            name={product.name}
            line={
              optionCount
                ? `${product.description} · ${optionCount} option${optionCount === 1 ? "" : "s"}`
                : product.description
            }
            priceLabel={from != null ? `from ${senToRm(from)}` : "View"}
            imageKey={product.heroImageKey}
            badgeText={product.badgeText}
            natureLabel={product.nature.replaceAll("_", " ")}
            tall={tall}
          />
        ))}
      </div>
    </PageShell>
  );
}
