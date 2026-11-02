import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { listNatures, natureRegistry } from "@/lib/natures/registry";

export const metadata = { title: "Shop" };

export default function ShopPage() {
  const natures = listNatures();

  return (
    <PageShell
      title="Shop"
      lead="Main products will load from Neon once seeded. Nature registry is wired for MVP."
    >
      <ul className="route-list">
        {natures.map((nature) => {
          const mod = natureRegistry[nature];
          return (
            <li key={nature}>
              <strong>{mod.label}</strong>
              <span className="muted"> — {mod.description}</span>
            </li>
          );
        })}
      </ul>
      <p className="muted" style={{ marginTop: "1.5rem" }}>
        Example detail shells:{" "}
        <Link href="/shop/museum-of-us">/shop/museum-of-us</Link>
        {" · "}
        <Link href="/shop/museum-of-us/museum-convo">
          /shop/museum-of-us/museum-convo
        </Link>
      </p>
    </PageShell>
  );
}
