import { PageShell } from "@/components/page-shell";
import { SHIPPING_FEE_SEN } from "@/lib/malaysia";
import { senToRm } from "@/lib/money";

export const metadata = { title: "Settings" };

export default function AdminSettingsPage() {
  return (
    <PageShell
      kicker="Settings"
      title="Launch defaults"
      lead="Shipping fee rules for Malaysia soft launch. English only."
    >
      <div className="ops-stats">
        <div className="ops-stat">
          <strong>{senToRm(SHIPPING_FEE_SEN.peninsular)}</strong>
          <span>Peninsular shipping</span>
        </div>
        <div className="ops-stat">
          <strong>{senToRm(SHIPPING_FEE_SEN.east)}</strong>
          <span>East MY shipping</span>
        </div>
        <div className="ops-stat">
          <strong>EN</strong>
          <span>Storefront language</span>
        </div>
      </div>
    </PageShell>
  );
}
