import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import {
  getProductBySlug,
  listSubsForProduct,
} from "@/lib/catalog/queries";
import { senToRm } from "@/lib/money";
import { natureRegistry } from "@/lib/natures/registry";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productSlug: string }>;
}) {
  const { productSlug } = await params;
  const product = await getProductBySlug(productSlug);
  if (!product) notFound();
  const subs = await listSubsForProduct(product.id);
  const nature = natureRegistry[product.nature];

  return (
    <PageShell
      kicker={nature.label}
      title={product.name}
      lead={product.description}
    >
      {product.heroImageKey ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/media?key=${encodeURIComponent(product.heroImageKey)}`}
          alt=""
          style={{
            width: "100%",
            maxWidth: 720,
            aspectRatio: "16 / 9",
            objectFit: "cover",
            borderRadius: "0.85rem",
            marginBottom: "1.25rem",
          }}
        />
      ) : null}

      {product.badgeText ? (
        <p>
          <span className="badge">{product.badgeText}</span>
        </p>
      ) : null}

      <div className="sub-picker" role="list">
        {subs.map((sub) => (
          <Link
            key={sub.id}
            role="listitem"
            className="sub-picker-item"
            href={`/shop/${product.slug}/${sub.slug}`}
          >
            <div>
              <strong>
                {sub.name}
                {sub.badgeText ? <span className="badge">{sub.badgeText}</span> : null}
              </strong>
              {sub.description ? (
                <p className="product-link-meta" style={{ marginTop: "0.35rem" }}>
                  {sub.description}
                </p>
              ) : (
                <p className="product-link-meta" style={{ marginTop: "0.35rem" }}>
                  Select to customise &amp; checkout
                </p>
              )}
            </div>
            <div className="product-link-price">{senToRm(sub.priceSen)}</div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
