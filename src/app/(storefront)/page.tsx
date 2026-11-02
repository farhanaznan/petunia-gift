import Link from "next/link";
import { listActiveProducts } from "@/lib/catalog/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await listActiveProducts();
  const featured = products.slice(0, 3);

  return (
    <>
      <section className="hero">
        <p className="brand-mark">Petunia Gift</p>
        <h1>Handmade gifts, made for Malaysia.</h1>
        <p className="lead">
          Personalised frames and collectibles — pick a ship date, pay with Touch
          &apos;n Go QR, upload your receipt. Soft launch in English.
        </p>
        <div className="cta-row">
          <Link className="button" href="/shop">
            Browse the shop
          </Link>
          <Link className="button secondary" href="/faq">
            How ordering works
          </Link>
        </div>
      </section>
      {featured.length ? (
        <section className="page-shell" style={{ paddingTop: 0 }}>
          <h2 style={{ fontFamily: "var(--font-display), Georgia, serif" }}>
            Featured
          </h2>
          <ul className="route-list">
            {featured.map((p) => (
              <li key={p.id}>
                <Link href={`/shop/${p.slug}`}>
                  {p.name}
                  {p.badgeText ? ` · ${p.badgeText}` : ""}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
