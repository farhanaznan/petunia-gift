import Link from "next/link";
import { Reveal } from "@/components/gallery/reveal";

export function ProductTile({
  href,
  name,
  line,
  priceLabel,
  imageKey,
  badgeText,
  natureLabel,
  tall,
  index = 0,
}: {
  href: string;
  name: string;
  line: string;
  priceLabel: string;
  imageKey?: string | null;
  badgeText?: string | null;
  natureLabel?: string;
  tall?: boolean;
  index?: number;
}) {
  return (
    <Reveal as="div" className="masonry-item-wrap" delayMs={Math.min(index * 70, 280)}>
      <Link className="masonry-item" href={href}>
        <div className="masonry-frame">
          {imageKey ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="masonry-media"
              src={`/api/media?key=${encodeURIComponent(imageKey)}`}
              alt=""
              style={tall ? { aspectRatio: "3 / 4", objectFit: "cover" } : undefined}
            />
          ) : (
            <div
              className="masonry-placeholder"
              style={tall ? { aspectRatio: "3 / 4" } : undefined}
              aria-hidden
            >
              <span>Petunia</span>
            </div>
          )}
        </div>
        <div className="masonry-caption">
          {natureLabel ? <span className="nature-tag">{natureLabel}</span> : null}
          <h3 className="masonry-name">
            {name}
            {badgeText ? <span className="badge">{badgeText}</span> : null}
          </h3>
          <p className="masonry-line">{line}</p>
          <p className="masonry-price">{priceLabel}</p>
        </div>
      </Link>
    </Reveal>
  );
}
