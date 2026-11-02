import { PageShell } from "@/components/page-shell";

export const metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <PageShell
      kicker="Help"
      title="FAQ"
      lead="Delivery, payment, and how personalisation works for each product nature."
    >
      <div className="stack">
        <div className="panel elevated">
          <strong>Where do you ship?</strong>
          <p className="muted" style={{ marginBottom: 0 }}>
            Malaysia only — Peninsular and East MY shipping fees apply at checkout.
          </p>
        </div>
        <div className="panel elevated">
          <strong>How do I pay?</strong>
          <p className="muted" style={{ marginBottom: 0 }}>
            Scan the shared Touch ’n Go QR, then upload your receipt for review.
          </p>
        </div>
        <div className="panel elevated">
          <strong>What can I customise?</strong>
          <p className="muted" style={{ marginBottom: 0 }}>
            Museum of Us needs title, message, and photos. Graduation needs one Lego
            variant (optional photo). F1 is pick-and-go.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
