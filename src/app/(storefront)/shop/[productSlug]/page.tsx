import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productSlug: string }>;
}) {
  const { productSlug } = await params;

  return (
    <PageShell
      title={productSlug}
      lead="Main product detail shell — choose a sub-product to customize and order."
    >
      <ul className="route-list">
        <li>
          <Link href={`/shop/${productSlug}/sample-sub`}>Sample sub-product →</Link>
        </li>
      </ul>
    </PageShell>
  );
}
