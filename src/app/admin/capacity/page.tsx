import { PageShell } from "@/components/page-shell";

export const metadata = { title: "Capacity" };

export default function AdminCapacityPage() {
  return (
    <PageShell
      title="Capacity calendar"
      lead="Max orders per ship date × sub-product. Holds consume capacity until receipt submit / expiry / reject."
    >
      <div className="panel muted">Calendar UI shell — unique (sub_product_id, ship_date).</div>
    </PageShell>
  );
}
