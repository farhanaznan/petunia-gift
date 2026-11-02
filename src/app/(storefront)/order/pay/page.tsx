import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export const metadata = { title: "Pay" };

export default function OrderPayPage() {
  return (
    <PageShell
      title="Pay with Touch ’n Go"
      lead="Show the shared admin-managed TnG QR (tap to zoom), upload receipt (JPEG/PNG/WebP/PDF ≤10MB), submit for review. No other gateways in v1."
    >
      <div className="panel stack">
        <p className="muted">TnG QR image loads from R2 key on payment_settings.tng_qr_key.</p>
        <p className="muted">Receipt upload → private R2 receipts/{"{orderId}"}/… via presigned PUT.</p>
        <Link className="button" href="/order/thanks?ref=PG-DEMO01">
          Submit receipt (shell)
        </Link>
      </div>
    </PageShell>
  );
}
