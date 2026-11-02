import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { PageShell } from "@/components/page-shell";
import { tryGetDb } from "@/lib/db";
import { orders, products } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const db = await tryGetDb();
  const pending = db
    ? await db
        .select()
        .from(orders)
        .where(eq(orders.status, "pending_payment_review"))
        .orderBy(desc(orders.createdAt))
        .limit(10)
    : [];
  const productCount = db
    ? (await db.select().from(products)).length
    : 0;

  return (
    <PageShell
      title="Ops home"
      lead={`${pending.length} pending receipt review(s) · ${productCount} products`}
    >
      <ul className="route-list">
        <li>
          <Link href="/admin/orders">Orders (pending payment review)</Link>
        </li>
        <li>
          <Link href="/admin/capacity">Capacity calendar</Link>
        </li>
        <li>
          <Link href="/admin/products">Products</Link>
        </li>
        <li>
          <Link href="/admin/payments/qr">Touch ’n Go QR</Link>
        </li>
      </ul>
      {pending.length ? (
        <div className="panel stack" style={{ marginTop: "1.5rem" }}>
          <strong>Pending reviews</strong>
          {pending.map((o) => (
            <Link key={o.id} href={`/admin/orders/${o.id}`}>
              {o.publicRef} · {o.email} · {o.shipDate}
            </Link>
          ))}
        </div>
      ) : null}
    </PageShell>
  );
}
