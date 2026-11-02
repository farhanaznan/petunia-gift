"use client";

import { useRouter } from "next/navigation";

export function ShipDatePicker({
  productSlug,
  dates,
  selected,
}: {
  productSlug: string;
  dates: { shipDate: string; remaining: number }[];
  selected?: string;
}) {
  const router = useRouter();

  if (!dates.length) {
    return (
      <p className="form-error" style={{ textAlign: "center" }}>
        No open ship dates with remaining capacity. Please check back later.
      </p>
    );
  }

  return (
    <div className="stack" style={{ marginBottom: "2rem" }}>
      <p className="field-label" style={{ textAlign: "center" }}>
        Choose a ship date first
      </p>
      <div
        className="chip-row"
        role="listbox"
        aria-label="Ship dates"
        style={{ justifyContent: "center" }}
      >
        {dates.map((d) => (
          <button
            key={d.shipDate}
            type="button"
            className="chip"
            role="option"
            aria-selected={selected === d.shipDate}
            data-selected={selected === d.shipDate}
            onClick={() => {
              router.push(
                `/shop/${productSlug}?shipDate=${encodeURIComponent(d.shipDate)}`,
              );
            }}
          >
            {d.shipDate}
            <span className="chip-meta">{d.remaining} left</span>
          </button>
        ))}
      </div>
    </div>
  );
}
