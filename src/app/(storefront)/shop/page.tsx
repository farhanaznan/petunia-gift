import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { listActiveProducts, listSubsForProduct } from "@/lib/catalog/queries";
import { senToRm } from "@/lib/money";

export const metadata = { title: "Shop" };
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const products = await listActiveProducts();

  return (
    <PageShell
      kicker="Collections"
      title="Shop"
      lead={
        products.length
          ? "Choose a collection, pick your option, personalise where needed, then reserve a ship date."
          : "Catalog is empty. Run npm run db:seed-catalog after Neon is linked."
      }
    >
      <ul className="product-rail">
        {await Promise.all(
          products.map(async (product) => {
            const subs = await listSubsForProduct(product.id);
            const from = subs.reduce<number | null>((min, s) => {
              if (min == null || s.priceSen < min) return s.priceSen;
              return min;
            }, null);
            return (
              <li key={product.id}>
                <Link className="product-link" href={`/shop/${product.slug}`}>
                  <div>
                    {product.heroImageKey ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="product-link-media"
                        src={`/api/media?key=${encodeURIComponent(product.heroImageKey)}`}
                        alt=""
                      />
                    ) : null}
                    <p className="nature-tag">
                      {product.nature.replaceAll("_", " ")}
                    </p>
                    <h2 className="product-link-title">
                      {product.name}
                      {product.badgeText ? (
                        <span className="badge">{product.badgeText}</span>
                      ) : null}
                    </h2>
                    <p className="product-link-meta">
                      {product.description}
                      {subs.length ? ` · ${subs.length} option${subs.length === 1 ? "" : "s"}` : ""}
                    </p>
                  </div>
                  <div className="product-link-price">
                    {from != null ? `from ${senToRm(from)}` : "View"}
                  </div>
                </Link>
              </li>
            );
          }),
        )}
      </ul>
    </PageShell>
  );
}
