"use client";

import { useRouter } from "next/navigation";

export function ShipDatePicker({
  hrefBase,
  dates,
  selected,
  label = "Then choose a ship date",
}: {
  /** Path without query, e.g. `/shop/museum-of-us/classic-frame` */
  hrefBase: string;
  dates: { shipDate: string; remaining: number }[];
  selected?: string;
  label?: string;
}) {
  const router = useRouter();

  if (!dates.length) {
    return (
      <div className="empty-state">
        <h3>No open dates</h3>
        <p>Capacity is full for now. Please check back soon.</p>
      </div>
    );
  }

  return (
    <div className="stack" style={{ marginBottom: "2rem" }}>
      <p className="field-label" style={{ textAlign: "center" }}>
        {label}
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
                `${hrefBase}?shipDate=${encodeURIComponent(d.shipDate)}`,
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
