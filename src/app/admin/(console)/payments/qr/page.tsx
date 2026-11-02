import { AdminActionForm } from "@/components/admin/admin-form";
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
      title="Touch ’n Go QR"
      lead="Store the R2 object key for the shared TnG QR. Replace anytime."
    >
      <p className="muted">
        Current key: {row?.tngQrKey ? <code>{row.tngQrKey}</code> : "not set"}
      </p>
      <AdminActionForm action={saveTngQrAction} submitLabel="Save QR key">
        <label className="stack">
          <span>R2 key (e.g. payments/tng-qr/v1.png)</span>
          <input
            name="tngQrKey"
            required
            defaultValue={row?.tngQrKey ?? "payments/tng-qr/v1.png"}
          />
        </label>
      </AdminActionForm>
      <p className="muted" style={{ marginTop: "1rem" }}>
        Browser upload to R2 via presigned PUT lands next — for now paste the key
        after uploading with Wrangler/R2 console.
      </p>
    </PageShell>
  );
}
