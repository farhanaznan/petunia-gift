import { PageShell } from "@/components/page-shell";

export const metadata = { title: "TnG QR" };

export default function AdminTngQrPage() {
  return (
    <PageShell
      title="Touch ’n Go QR"
      lead="Upload/replace the single shared QR image in R2 (payments/tng-qr/{version}.ext). Updates payment_settings.tng_qr_key for all new pay sessions."
    >
      <div className="panel muted">Replace flow uses private bucket + admin auth (Phase 1).</div>
    </PageShell>
  );
}
