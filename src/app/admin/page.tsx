import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export default function AdminHomePage() {
  return (
    <PageShell
      title="Ops home"
      lead="Pending receipt reviews, today’s ship slots, and quick links. Auth gate lands with session stub wiring."
    >
      <ul className="route-list">
        <li>
          <Link href="/admin/orders">Orders (pending payment review)</Link>
        </li>
        <li>
          <Link href="/admin/capacity">Capacity calendar</Link>
        </li>
        <li>
          <Link href="/admin/products">Products</Link>
        </li>
        <li>
          <Link href="/admin/payments/qr">Touch ’n Go QR</Link>
        </li>
      </ul>
    </PageShell>
  );
}
