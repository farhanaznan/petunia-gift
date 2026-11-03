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
      return { product, from, index };
    }),
  );

  return (
    <PageShell
      title="Shop"
      lead={
        products.length
          ? "Handmade gifts ready to personalise — choose a collection, pick an option, then lock your ship date."
          : undefined
      }
    >
      {tiles.length ? (
        <div className="product-row">
          {tiles.map(({ product, from, index }) => (
            <ProductTile
              key={product.id}
              href={`/shop/${product.slug}`}
              name={product.name}
              priceLabel={from != null ? `from ${senToRm(from)}` : "View"}
              imageKey={product.heroImageKey}
              badgeText={product.badgeText}
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
