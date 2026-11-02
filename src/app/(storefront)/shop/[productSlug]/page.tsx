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
    <PageShell title={product.name} lead={product.description}>
      {product.heroImageKey ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/media?key=${encodeURIComponent(product.heroImageKey)}`}
          alt=""
          style={{
            width: "100%",
            maxWidth: 520,
            aspectRatio: "16 / 9",
            objectFit: "cover",
            borderRadius: 8,
            marginBottom: "1rem",
          }}
        />
      ) : null}
      <p className="muted">
        Type: {nature.label}
        {product.badgeText ? ` · ${product.badgeText}` : ""}
      </p>
      <ul className="route-list">
        {subs.map((sub) => (
          <li key={sub.id}>
            <Link href={`/shop/${product.slug}/${sub.slug}`}>
              {sub.name}
              {sub.badgeText ? ` · ${sub.badgeText}` : ""} — {senToRm(sub.priceSen)}
            </Link>
            {sub.description ? (
              <div className="muted">{sub.description}</div>
            ) : null}
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
