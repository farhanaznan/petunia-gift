import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageShell
      title={`Product ${id}`}
      lead="Edit main product: image (R2), description, nature, active, labels."
    >
      <Link href={`/admin/products/${id}/subs`}>Manage sub-products →</Link>
    </PageShell>
  );
}
