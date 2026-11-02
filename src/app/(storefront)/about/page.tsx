import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <PageShell
      kicker="About"
      title="Petunia Gift"
      lead="Handmade personalised gifts crafted for Malaysia delivery — frames, collectibles, and graduation keepsakes."
    >
      <div className="panel stack" style={{ maxWidth: 520, marginInline: "auto", textAlign: "left" }}>
        <p style={{ margin: 0, fontWeight: 300 }}>
          Soft launch in English. Browse the shop, personalise where the product
          nature asks for it, reserve a ship date with remaining capacity, and
          pay via Touch ’n Go QR.
        </p>
        <Link className="button" href="/shop">
          Browse the shop
        </Link>
      </div>
    </PageShell>
  );
}
