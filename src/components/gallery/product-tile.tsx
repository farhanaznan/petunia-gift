import Link from "next/link";

export function ProductTile({
  href,
  name,
  line,
  priceLabel,
  imageKey,
  badgeText,
  natureLabel,
  tall,
}: {
  href: string;
  name: string;
  line: string;
  priceLabel: string;
  imageKey?: string | null;
  badgeText?: string | null;
  natureLabel?: string;
  tall?: boolean;
}) {
  return (
    <Link className="masonry-item" href={href}>
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
        />
      )}
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
  );
}
