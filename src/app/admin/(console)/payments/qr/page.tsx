import { AdminActionForm } from "@/components/admin/admin-form";
import { MediaKeyField } from "@/components/admin/media-key-field";
import { PageShell } from "@/components/page-shell";
import { saveTngQrAction } from "@/lib/admin/catalog-actions";
import { tryGetDb } from "@/lib/db";
import { paymentSettings } from "@/lib/db/schema";

export const metadata = { title: "TnG QR" };
export const dynamic = "force-dynamic";

export default async function AdminTngQrPage() {
  const db = await tryGetDb();
  const [row] = db ? await db.select().from(paymentSettings).limit(1) : [];

  return (
    <PageShell
      kicker="Payments"
      title="Touch ’n Go QR"
      lead="Upload or replace the shared QR shown on the checkout payment step."
    >
      {row?.tngQrKey ? (
        <div className="panel elevated stack" style={{ marginBottom: "1rem", maxWidth: 360 }}>
          <p className="muted" style={{ margin: 0 }}>
            Current key: <code>{row.tngQrKey}</code>
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/media?key=${encodeURIComponent(row.tngQrKey)}`}
            alt="Current Touch n Go QR"
            style={{ width: "100%", background: "#fff", borderRadius: "0.55rem" }}
          />
        </div>
      ) : (
        <p className="muted">No QR uploaded yet.</p>
      )}

      <AdminActionForm action={saveTngQrAction} submitLabel="Save TnG QR">
        <MediaKeyField
          name="tngQrKey"
          kind="tng_qr"
          label="Upload TnG QR image"
          defaultKey={row?.tngQrKey ?? ""}
        />
      </AdminActionForm>
    </PageShell>
  );
}
