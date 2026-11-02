import { PageShell } from "@/components/page-shell";

export default async function AdminSubProductsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageShell
      title="Sub-products"
      lead={`CRUD for product ${id}: images, price (sen), nature config JSON, badges.`}
    />
  );
}
