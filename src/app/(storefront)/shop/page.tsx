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
      title="Shop"
      lead={
        products.length
          ? "Handmade gifts for Malaysia delivery — choose a collection to customise."
          : "Catalog is empty. Run npm run db:seed-catalog after Neon is linked."
      }
    >
      <ul className="route-list">
        {await Promise.all(
          products.map(async (product) => {
            const subs = await listSubsForProduct(product.id);
            const from = subs.reduce<number | null>((min, s) => {
              if (min == null || s.priceSen < min) return s.priceSen;
              return min;
            }, null);
            return (
              <li key={product.id}>
                <Link href={`/shop/${product.slug}`} style={{ display: "grid", gap: "0.5rem" }}>
                  {product.heroImageKey ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/media?key=${encodeURIComponent(product.heroImageKey)}`}
                      alt=""
                      style={{
                        width: "100%",
                        maxWidth: 360,
                        aspectRatio: "4 / 3",
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                  ) : null}
                  <span>
                    <strong>{product.name}</strong>
                    {product.badgeText ? ` · ${product.badgeText}` : ""}
                  </span>
                </Link>
                <div className="muted">
                  {product.description}
                  {from != null ? ` · from ${senToRm(from)}` : ""}
                  {subs.length ? ` · ${subs.length} option(s)` : ""}
                </div>
              </li>
            );
          }),
        )}
      </ul>
    </PageShell>
  );
}
