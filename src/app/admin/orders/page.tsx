import { PageShell } from "@/components/page-shell";

export const metadata = { title: "Orders" };

export default function AdminOrdersPage() {
  return (
    <PageShell
      title="Orders"
      lead="Filters: order date, ship date, sub-product, status, search email/phone/ref. Daily priority: pending_payment_review."
    >
      <div className="panel muted">Order list shell — Neon query + receipt signed URLs next.</div>
    </PageShell>
  );
}
