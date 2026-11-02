import { PageShell } from "@/components/page-shell";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <PageShell
      kicker="Contact"
      title="Say hello"
      lead="WhatsApp, email, and Instagram links will land from admin settings during soft launch."
    >
      <div className="panel elevated" style={{ maxWidth: 480 }}>
        <p className="muted" style={{ margin: 0 }}>
          For order issues, include your public order reference from the thank-you
          page.
        </p>
      </div>
    </PageShell>
  );
}
