import Link from "next/link";
import { logoutAdminAction } from "@/lib/auth/actions";

const links = [
  { href: "/admin", label: "Ops home" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/capacity", label: "Capacity" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/payments/qr", label: "TnG QR" },
  { href: "/admin/settings", label: "Settings" },
] as const;

export function AdminNav({ email }: { email?: string }) {
  return (
    <nav className="admin-nav" aria-label="Admin">
      <div>
        <Link href="/admin" className="brand">
          Petunia Ops
        </Link>
        <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.8rem" }}>
          Soft-launch console
        </p>
      </div>
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
      <div className="admin-login-link stack">
        {email ? <span className="muted">{email}</span> : null}
        <form action={logoutAdminAction}>
          <button type="submit" className="button secondary">
            Log out
          </button>
        </form>
      </div>
    </nav>
  );
}
