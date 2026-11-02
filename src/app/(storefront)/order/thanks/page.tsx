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
      title="Order received"
      lead={
        ref
          ? `Reference ${ref}. We’ll confirm after reviewing your Touch ’n Go receipt.`
          : "We’ll confirm after reviewing your Touch ’n Go receipt."
      }
    >
      <p className="muted">Soft launch: status updates are manual for now.</p>
      <Link className="button secondary" href="/shop">
        Back to shop
      </Link>
    </PageShell>
  );
}
