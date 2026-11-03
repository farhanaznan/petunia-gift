import Link from "next/link";
import { ProductTile } from "@/components/gallery/product-tile";
import { Reveal } from "@/components/gallery/reveal";
import { listActiveProducts, listSubsForProduct } from "@/lib/catalog/queries";
import { senToRm } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await listActiveProducts();
  const heroImage =
    products.find((p) => p.heroImageKey)?.heroImageKey ?? null;

  const tiles = await Promise.all(
    products.map(async (p, index) => {
      const subs = await listSubsForProduct(p.id);
      const from = subs.reduce<number | null>((min, s) => {
        if (min == null || s.priceSen < min) return s.priceSen;
        return min;
      }, null);
      return {
        product: p,
        from,
        index,
      };
    }),
  );

  return (
    <div className="page-column" style={{ paddingBottom: "2rem" }}>
      <section className="gallery-hero" aria-label="Featured">
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/media?key=${encodeURIComponent(heroImage)}`} alt="" />
        ) : (
          <div className="gallery-hero-placeholder" aria-hidden />
        )}
        <div className="gallery-hero-overlay">
          <p className="gallery-hero-kicker">Handmade for Malaysia</p>
          <p className="gallery-hero-script">Petunia Gift</p>
        </div>
      </section>

      <section className="browse-section">
        <Reveal>
          <header className="browse-header">
            <h2>The collection</h2>
            <p>Big photos, soft bubbles — tap a gift to choose your ship date.</p>
          </header>
        </Reveal>
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
            <h3>Coming soon</h3>
            <p>The gallery is being prepared. Check back shortly.</p>
          </div>
        )}
        <div className="cta-row" style={{ marginTop: "0.5rem" }}>
          <Link className="button secondary" href="/shop">
            View all
          </Link>
        </div>
      </section>
    </div>
  );
}
