import Link from "next/link";
import { PlaceOrderForm } from "@/components/checkout/place-order-form";
import { PageShell } from "@/components/page-shell";
import { listOpenCapacityDates } from "@/lib/catalog/queries";
import { getCheckoutCart } from "@/lib/checkout/cart";
import { MALAYSIA_STATES } from "@/lib/malaysia";
import { senToRm } from "@/lib/money";

export const metadata = { title: "Order" };
export const dynamic = "force-dynamic";

export default async function OrderPage() {
  const cart = await getCheckoutCart();
  if (!cart) {
    return (
      <PageShell
        title="Checkout"
        lead="No item in checkout yet. Pick a product from the shop."
      >
        <Link className="button" href="/shop">
          Browse shop
        </Link>
      </PageShell>
    );
  }

  const dates = await listOpenCapacityDates(cart.subProductId);

  return (
    <PageShell
      title="Checkout"
      lead={`${cart.productName} · ${cart.subName}`}
    >
      <div className="panel stack" style={{ marginBottom: "1rem" }}>
        <p>
          Unit {senToRm(cart.unitPriceSen)}
          {cart.surchargeSen
            ? ` + surcharge ${senToRm(cart.surchargeSen)}`
            : ""}
        </p>
        <p className="muted">Shipping calculated from Malaysia state (RM6 / East MY RM15).</p>
      </div>
      <PlaceOrderForm
        shipDates={dates.map((d) => d.shipDate)}
        states={[...MALAYSIA_STATES]}
      />
    </PageShell>
  );
}
