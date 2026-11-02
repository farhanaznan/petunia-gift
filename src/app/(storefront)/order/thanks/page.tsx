import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export const metadata = { title: "Thank you" };

export default async function OrderThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <PageShell
      kicker="Done"
      title="Order received"
      lead={
        ref
          ? `Reference ${ref}. We’ll confirm after reviewing your Touch ’n Go receipt.`
          : "We’ll confirm after reviewing your Touch ’n Go receipt."
      }
    >
      <div className="panel elevated stack" style={{ maxWidth: 480 }}>
        <p className="muted" style={{ margin: 0 }}>
          Soft launch: status updates are manual for now. Keep your reference
          handy if you message us.
        </p>
        <Link className="button" href="/shop">
          Back to shop
        </Link>
      </div>
    </PageShell>
  );
}
