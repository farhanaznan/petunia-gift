import Link from "next/link";
import { listActiveProducts, listSubsForProduct } from "@/lib/catalog/queries";
import { senToRm } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await listActiveProducts();
  const featured = products.slice(0, 3);

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <p className="brand-mark">Petunia Gift</p>
          <h1>Handmade gifts, made for Malaysia.</h1>
          <p className="lead">
            Personalised frames and collectibles — choose a ship date, pay with
            Touch &apos;n Go QR, upload your receipt.
          </p>
          <div className="cta-row">
            <Link className="button" href="/shop">
              Browse the shop
            </Link>
            <Link className="button secondary" href="/faq">
              How ordering works
            </Link>
          </div>
        </div>
      </section>

      {featured.length ? (
        <section className="home-featured">
          <h2>Start with a collection</h2>
          <ul className="product-rail">
            {await Promise.all(
              featured.map(async (p) => {
                const subs = await listSubsForProduct(p.id);
                const from = subs.reduce<number | null>((min, s) => {
                  if (min == null || s.priceSen < min) return s.priceSen;
                  return min;
                }, null);
                return (
                  <li key={p.id}>
                    <Link className="product-link" href={`/shop/${p.slug}`}>
                      <div>
                        <p className="nature-tag">{p.nature.replaceAll("_", " ")}</p>
                        <h3 className="product-link-title">
                          {p.name}
                          {p.badgeText ? <span className="badge">{p.badgeText}</span> : null}
                        </h3>
                        <p className="product-link-meta">{p.description}</p>
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
        </section>
      ) : null}
    </>
  );
}
