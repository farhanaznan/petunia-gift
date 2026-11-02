import Link from "next/link";
import { desc } from "drizzle-orm";
import { PageShell } from "@/components/page-shell";
import { tryGetDb } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { senToRm } from "@/lib/money";

export const metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const db = await tryGetDb();
  const rows = db
    ? await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(50)
    : [];

  return (
    <PageShell
      title="Orders"
      lead="Latest 50 orders. Open a row to confirm/reject payment."
    >
      <ul className="route-list">
        {rows.map((o) => (
          <li key={o.id}>
            <Link href={`/admin/orders/${o.id}`}>
              {o.publicRef} · {o.status} · {o.shipDate} · {senToRm(o.totalSen)} ·{" "}
              {o.email}
            </Link>
          </li>
        ))}
      </ul>
      {!rows.length ? <p className="muted">No orders yet.</p> : null}
    </PageShell>
  );
}
