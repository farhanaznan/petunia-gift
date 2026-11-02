import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { listActiveProducts } from "@/lib/catalog/queries";
import { senToRm } from "@/lib/money";
import { listSubsForProduct } from "@/lib/catalog/queries";

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
            const from = subs[0]?.priceSen;
            return (
              <li key={product.id}>
                <Link href={`/shop/${product.slug}`}>
                  <strong>{product.name}</strong>
                  {product.badgeText ? ` · ${product.badgeText}` : ""}
                </Link>
                <div className="muted">
                  {product.description}
                  {from != null ? ` · from ${senToRm(from)}` : ""}
                </div>
              </li>
            );
          }),
        )}
      </ul>
    </PageShell>
  );
}
