import { PageShell } from "@/components/page-shell";
import { SHIPPING_FEE_SEN } from "@/lib/malaysia";
import { senToRm } from "@/lib/money";

export const metadata = { title: "Settings" };

export default function AdminSettingsPage() {
  return (
    <PageShell
      title="Settings"
      lead="Shipping fee rules, default surcharges, contact links (MVP-light)."
    >
      <div className="panel stack">
        <p>
          Peninsular default: <strong>{senToRm(SHIPPING_FEE_SEN.peninsular)}</strong>
        </p>
        <p>
          East MY (Sabah / Sarawak / Labuan):{" "}
          <strong>{senToRm(SHIPPING_FEE_SEN.east)}</strong>
        </p>
        <p className="muted">Language: English only for v1 soft launch.</p>
      </div>
    </PageShell>
  );
}
