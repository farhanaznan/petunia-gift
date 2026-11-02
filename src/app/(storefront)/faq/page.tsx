import { PageShell } from "@/components/page-shell";

export const metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <PageShell
      title="FAQ"
      lead="Delivery areas (MY only), lead times, Touch ’n Go payment how-to, and customization rules."
    >
      <div className="stack">
        <div className="panel">
          <strong>Where do you ship?</strong>
          <p className="muted">Malaysia only — Peninsular & East MY fee rules apply.</p>
        </div>
        <div className="panel">
          <strong>How do I pay?</strong>
          <p className="muted">
            Scan the Touch ’n Go QR, then upload your receipt for admin review.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
