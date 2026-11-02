import Link from "next/link";
import { PlaceOrderForm } from "@/components/checkout/place-order-form";
import { PageShell } from "@/components/page-shell";
import { listOpenCapacityWithRemaining } from "@/lib/catalog/capacity";
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

  const dates = await listOpenCapacityWithRemaining(cart.subProductId);

  return (
    <PageShell
      title="Checkout"
      lead={`${cart.productName} · ${cart.subName}`}
    >
      <div className="panel stack" style={{ marginBottom: "1rem" }}>
        <p>
          Review: {cart.nature.replaceAll("_", " ")} · base{" "}
          {senToRm(cart.unitPriceSen)}
          {cart.surchargeSen ? ` + surcharge ${senToRm(cart.surchargeSen)}` : ""}
        </p>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem", margin: 0 }}>
          {JSON.stringify(cart.customization, null, 2)}
        </pre>
      </div>
      <PlaceOrderForm
        shipDates={dates.map((d) => ({
          shipDate: d.shipDate,
          remaining: d.remaining,
        }))}
        states={[...MALAYSIA_STATES]}
        unitPriceSen={cart.unitPriceSen}
        surchargeSen={cart.surchargeSen}
      />
    </PageShell>
  );
}
