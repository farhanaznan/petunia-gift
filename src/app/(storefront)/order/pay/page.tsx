import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { PayForm } from "@/components/checkout/pay-form";
import { PageShell } from "@/components/page-shell";
import { getPaymentQrKey } from "@/lib/checkout/actions";
import { tryGetDb } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { senToRm } from "@/lib/money";

export const metadata = { title: "Pay" };
export const dynamic = "force-dynamic";

export default async function OrderPayPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; token?: string }>;
}) {
  const { ref, token } = await searchParams;
  if (!ref || !token) {
    return (
      <PageShell title="Pay with Touch ’n Go" lead="Missing order reference.">
        <Link href="/shop">Back to shop</Link>
      </PageShell>
    );
  }

  const db = await tryGetDb();
  if (!db) {
    return (
      <PageShell title="Pay with Touch ’n Go" lead="Database unavailable." />
    );
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.publicRef, ref), eq(orders.statusToken, token)))
    .limit(1);

  if (!order) {
    return (
      <PageShell title="Pay with Touch ’n Go" lead="Order not found.">
        <Link href="/shop">Back to shop</Link>
      </PageShell>
    );
  }

  let qrKey: string | null = null;
  try {
    qrKey = await getPaymentQrKey();
  } catch {
    qrKey = null;
  }

  return (
    <PageShell
      title="Pay with Touch ’n Go"
      lead={`Order ${order.publicRef} · total ${senToRm(order.totalSen)} · ${order.status}`}
    >
      <div className="panel stack" style={{ marginBottom: "1rem" }}>
        <p>Item {senToRm(order.unitPriceSen)}</p>
        <p>Surcharge {senToRm(order.surchargeSen)}</p>
        <p>Shipping {senToRm(order.shippingFeeSen)}</p>
        <p>
          <strong>Total {senToRm(order.totalSen)}</strong>
        </p>
      </div>
      <PayForm
        publicRef={order.publicRef}
        statusToken={order.statusToken}
        orderId={order.id}
        qrKey={qrKey}
      />
    </PageShell>
  );
}
