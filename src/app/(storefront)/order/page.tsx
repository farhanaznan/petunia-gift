import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export const metadata = { title: "Order" };

export default function OrderPage() {
  return (
    <PageShell
      title="Checkout"
      lead="Multi-step shell: review selection → ship date (capacity) → Malaysia address → pay."
    >
      <ol className="stack">
        <li>Review product + custom fields + price</li>
        <li>Pick an open ship date with remaining capacity</li>
        <li>Enter MY address & contacts</li>
        <li>
          <Link href="/order/pay">Pay with Touch &apos;n Go QR →</Link>
        </li>
      </ol>
    </PageShell>
  );
}
