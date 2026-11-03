import Link from "next/link";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="M3 7l9 7 9-7" />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 19l1.5-4A7.5 7.5 0 1119 12a7.4 7.4 0 01-1.2 4.1L19 19l-4.2-1.1A7.5 7.5 0 015 19z" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-top">
        <div className="social-row" aria-label="Social">
          <a href="/contact" aria-label="Instagram">
            <IconInstagram />
          </a>
          <a href="/contact" aria-label="WhatsApp">
            <IconWhatsApp />
          </a>
          <a href="/contact" aria-label="Email">
            <IconMail />
          </a>
        </div>
        <div className="header-wordmark">
          <Link href="/" className="brand-script">
            Petunia Gift
          </Link>
        </div>
        <div className="header-spacer">Made in MY</div>
      </div>
      <nav className="site-nav" aria-label="Primary">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
