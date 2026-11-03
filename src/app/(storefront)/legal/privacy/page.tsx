import { PageShell } from "@/components/page-shell";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <PageShell
      title="Privacy"
      lead="PDPA-minded note: we collect photos, payment receipts, and phones to fulfil orders and verify Touch ’n Go payments. Customer media is private in R2; retention policy TBD."
    />
  );
}
