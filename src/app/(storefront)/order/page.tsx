import Link from "next/link";
import { PlaceOrderForm } from "@/components/checkout/place-order-form";
import { PageShell } from "@/components/page-shell";
import { getCapacityOnDate } from "@/lib/catalog/capacity";
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
        <div className="cta-row">
          <Link className="button" href="/shop">
            Browse shop
          </Link>
        </div>
      </PageShell>
    );
  }

  const cap = await getCapacityOnDate({
    nature: cart.nature,
    productId: cart.productId,
    subProductId: cart.subProductId,
    shipDate: cart.shipDate,
  });

  if (!cap) {
    return (
      <PageShell
        kicker="Checkout"
        title="Ship date unavailable"
        lead={`${cart.shipDate} no longer has remaining capacity. Choose another date.`}
      >
        <div className="cta-row">
          <Link className="button" href={`/shop/${cart.productSlug}`}>
            Pick another date
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      kicker="Checkout"
      title="Delivery details"
      lead={`${cart.productName} · ${cart.subName} · ${senToRm(cart.unitPriceSen)}${cart.surchargeSen ? ` + ${senToRm(cart.surchargeSen)}` : ""} · ship ${cart.shipDate}`}
    >
      <div className="panel" style={{ marginBottom: "1.5rem", maxWidth: 520, marginInline: "auto" }}>
        <p className="nature-tag">{cart.nature.replaceAll("_", " ")}</p>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            fontSize: "0.82rem",
            margin: 0,
            fontFamily: "var(--font-body), sans-serif",
            color: "var(--muted)",
            textAlign: "left",
          }}
        >
          {JSON.stringify(cart.customization, null, 2)}
        </pre>
      </div>
      <PlaceOrderForm
        shipDate={cart.shipDate}
        remaining={cap.remaining}
        states={[...MALAYSIA_STATES]}
        unitPriceSen={cart.unitPriceSen}
        surchargeSen={cart.surchargeSen}
      />
    </PageShell>
  );
}
