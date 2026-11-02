import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>Handmade gifts · Malaysia delivery only · Soft launch</p>
      <p>
        <Link href="/legal/privacy">Privacy</Link>
        {" · "}
        <Link href="/legal/terms">Terms</Link>
      </p>
    </footer>
  );
}
