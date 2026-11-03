import Link from "next/link";
import { Reveal } from "@/components/gallery/reveal";

export function ProductTile({
  href,
  name,
  priceLabel,
  imageKey,
  badgeText,
  index = 0,
}: {
  href: string;
  name: string;
  priceLabel: string;
  imageKey?: string | null;
  badgeText?: string | null;
  index?: number;
}) {
  return (
    <Reveal as="div" className="bubble-card-wrap" delayMs={Math.min(index * 70, 280)}>
      <Link className="bubble-card" href={href}>
        <div className="bubble-well" aria-hidden={!imageKey}>
          {imageKey ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="bubble-media"
              src={`/api/media?key=${encodeURIComponent(imageKey)}`}
              alt=""
            />
          ) : (
            <div className="bubble-placeholder">
              <span>Petunia</span>
            </div>
          )}
        </div>
        <h3 className="bubble-name">
          {name}
          {badgeText ? <span className="badge">{badgeText}</span> : null}
        </h3>
        <p className="bubble-price">{priceLabel}</p>
      </Link>
    </Reveal>
  );
}
