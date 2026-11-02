import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export default async function SubProductPage({
  params,
}: {
  params: Promise<{ productSlug: string; subSlug: string }>;
}) {
  const { productSlug, subSlug } = await params;

  return (
    <PageShell
      title={subSlug}
      lead={`Sub-product under ${productSlug}. Nature-specific customizer mounts here from the type registry.`}
    >
      <div className="cta-row">
        <Link className="button" href="/order">
          Continue to order
        </Link>
      </div>
    </PageShell>
  );
}
