import { PageShell } from "@/components/page-shell";

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <PageShell
      title="Order status"
      lead="Lightweight customer status page (no login). Token lookup is a Phase 2 polish; shell only."
    >
      <p className="muted">Token: {token}</p>
    </PageShell>
  );
}
