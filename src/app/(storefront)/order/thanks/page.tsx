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
      <p className="muted">Status updates are manual for soft launch (WhatsApp / email later).</p>
    </PageShell>
  );
}
