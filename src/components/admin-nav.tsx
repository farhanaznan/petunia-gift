import Link from "next/link";

const links = [
  { href: "/admin", label: "Ops home" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/capacity", label: "Capacity" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/payments/qr", label: "TnG QR" },
  { href: "/admin/settings", label: "Settings" },
] as const;

export function AdminNav() {
  return (
    <nav className="admin-nav" aria-label="Admin">
      <Link href="/admin" className="brand">
        Petunia Admin
      </Link>
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
      <Link href="/admin/login" className="admin-login-link">
        Login
      </Link>
    </nav>
  );
}
