import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { listNatures, natureRegistry } from "@/lib/natures/registry";

export const metadata = { title: "Products" };

export default function AdminProductsPage() {
  return (
    <PageShell
      title="Products"
      lead="Main products CRUD shell. Natures registered for MVP:"
    >
      <ul className="route-list">
        {listNatures().map((nature) => (
          <li key={nature}>
            <code>{nature}</code> — {natureRegistry[nature].label}
          </li>
        ))}
      </ul>
      <p style={{ marginTop: "1rem" }}>
        <Link href="/admin/products/new">New product shell →</Link>
      </p>
    </PageShell>
  );
}
