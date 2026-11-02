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
        kicker="Checkout"
        title="Nothing in checkout yet"
        lead="Pick a product from the shop to begin."
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
      kicker="Checkout"
      title="Delivery details"
      lead={`${cart.productName} · ${cart.subName} · ${senToRm(cart.unitPriceSen)}${cart.surchargeSen ? ` + ${senToRm(cart.surchargeSen)}` : ""}`}
    >
      <div className="panel" style={{ marginBottom: "1.25rem" }}>
        <p className="nature-tag">{cart.nature.replaceAll("_", " ")}</p>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            fontSize: "0.85rem",
            margin: 0,
            fontFamily: "var(--font-body), sans-serif",
            color: "var(--muted)",
          }}
        >
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
