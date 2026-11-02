import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminActionForm } from "@/components/admin/admin-form";
import { PageShell } from "@/components/page-shell";
import { updateOrderStatusAction } from "@/lib/admin/catalog-actions";
import { getDb } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { senToRm } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) notFound();

  return (
    <PageShell title={order.publicRef} lead={`Status: ${order.status}`}>
      <div className="panel stack">
        <p>
          Total <strong>{senToRm(order.totalSen)}</strong> · ship {order.shipDate}
        </p>
        <p>
          {order.buyerName} · {order.email} · {order.customerPhone} /{" "}
          {order.recipientPhone}
        </p>
        <p>
          {order.addressLine1}
          {order.addressLine2 ? `, ${order.addressLine2}` : ""}, {order.postcode}{" "}
          {order.city}, {order.state}, {order.country}
        </p>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>
          {JSON.stringify(order.customization, null, 2)}
        </pre>
        <p className="muted">
          Receipt key: {order.receiptKey ? <code>{order.receiptKey}</code> : "—"}
        </p>
      </div>

      <h2 style={{ marginTop: "1.5rem" }}>Update status</h2>
      <AdminActionForm action={updateOrderStatusAction} submitLabel="Update order">
        <input type="hidden" name="id" value={order.id} />
        <label className="stack">
          <span>Status</span>
          <select name="status" defaultValue={order.status}>
            <option value="pending_payment_review">pending_payment_review</option>
            <option value="confirmed">confirmed</option>
            <option value="rejected">rejected</option>
            <option value="cancelled">cancelled</option>
            <option value="done">done</option>
          </select>
        </label>
        <label className="stack">
          <span>Admin notes</span>
          <textarea name="adminNotes" rows={3} defaultValue={order.adminNotes ?? ""} />
        </label>
      </AdminActionForm>
    </PageShell>
  );
}
