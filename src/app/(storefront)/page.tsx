import Link from "next/link";

export default function HomePage() {
  return (
    <section className="hero">
      <p className="brand-mark">Petunia Gift</p>
      <h1>Handmade gifts, made for Malaysia.</h1>
      <p className="lead">
        Personalised frames and collectibles — pick a ship date, pay with Touch
        &apos;n Go QR, upload your receipt. Soft launch in English.
      </p>
      <div className="cta-row">
        <Link className="button" href="/shop">
          Browse the shop
        </Link>
        <Link className="button secondary" href="/faq">
          How ordering works
        </Link>
      </div>
    </section>
  );
}
