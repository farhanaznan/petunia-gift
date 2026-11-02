import { PageShell } from "@/components/page-shell";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageShell
      title={`Order ${id}`}
      lead="Customization payload, customer media, receipt (signed GET), status actions, admin notes."
    >
      <div className="panel muted">Confirm / reject actions reserved for Phase 1.</div>
    </PageShell>
  );
}
