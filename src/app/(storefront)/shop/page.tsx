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
      return { product, from, tall: index % 3 === 1, optionCount: subs.length, index };
    }),
  );

  return (
    <PageShell
      kicker="Shop"
      title="Collections"
      lead={
        products.length
          ? "Choose a collection, pick your ship date, personalise where needed, then reserve your gift."
          : undefined
      }
    >
      {tiles.length ? (
        <div className="masonry">
          {tiles.map(({ product, from, tall, optionCount, index }) => (
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
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>Catalog arriving</h3>
          <p>Products will appear here once the gallery is seeded.</p>
        </div>
      )}
    </PageShell>
  );
}
