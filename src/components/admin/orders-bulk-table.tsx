"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import type { AdminActionState } from "@/lib/admin/catalog-actions";
import {
  bulkConfirmOrdersAction,
  bulkRejectOrdersAction,
} from "@/lib/admin/bulk-order-actions";
import { formatOrderStatus } from "@/lib/orders/status-label";

type Row = {
  id: string;
  publicRef: string;
  status: string;
  shipDate: string;
  totalLabel: string;
  email: string;
  productName: string;
  subName: string;
  hasDelyva: boolean;
  trackingNumber: string | null;
};

const initial: AdminActionState = {};

function statusTone(status: string): "ok" | "warn" | "danger" | "neutral" {
  if (status === "confirmed" || status === "done") return "ok";
  if (status === "pending_payment_review" || status === "draft_hold") return "warn";
  if (status === "rejected" || status === "cancelled" || status === "expired_hold") {
    return "danger";
  }
  return "neutral";
}

export function OrdersBulkTable({ rows }: { rows: Row[] }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [confirmState, confirmAction, confirmPending] = useActionState(
    bulkConfirmOrdersAction,
    initial,
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    bulkRejectOrdersAction,
    initial,
  );

  const selectedIds = useMemo(
    () => rows.filter((r) => selected[r.id]).map((r) => r.id),
    [rows, selected],
  );
  const selectedWithDelyva = useMemo(
    () => rows.filter((r) => selected[r.id] && r.hasDelyva).map((r) => r.id),
    [rows, selected],
  );

  const allChecked = rows.length > 0 && rows.every((r) => selected[r.id]);
  const pending = confirmPending || rejectPending;

  return (
    <div className="stack">
      <div className="panel stack">
        <p className="nature-tag">Bulk payment review</p>
        <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
          Select orders, then confirm (creates SPX on Delyva once per order) or
          reject. Print labels only for rows that already have a Delyva
          shipment.
        </p>
        <div className="cta-row" style={{ justifyContent: "flex-start" }}>
          <form action={confirmAction}>
            {selectedIds.map((id) => (
              <input key={`c-${id}`} type="hidden" name="orderIds" value={id} />
            ))}
            <button
              className="button"
              type="submit"
              disabled={pending || !selectedIds.length}
            >
              {confirmPending ? "Confirming…" : "Confirm selected"}
            </button>
          </form>
          <form action={rejectAction}>
            {selectedIds.map((id) => (
              <input key={`r-${id}`} type="hidden" name="orderIds" value={id} />
            ))}
            <button
              className="button secondary"
              type="submit"
              disabled={pending || !selectedIds.length}
            >
              {rejectPending ? "Rejecting…" : "Reject selected"}
            </button>
          </form>
          <a
            className={`button secondary${selectedWithDelyva.length ? "" : " is-disabled"}`}
            href={
              selectedWithDelyva.length
                ? `/api/admin/orders/labels?ids=${encodeURIComponent(selectedWithDelyva.join(","))}`
                : undefined
            }
            target="_blank"
            rel="noreferrer"
            aria-disabled={!selectedWithDelyva.length}
            onClick={(e) => {
              if (!selectedWithDelyva.length) e.preventDefault();
            }}
            style={
              !selectedWithDelyva.length
                ? { opacity: 0.45, pointerEvents: "none" }
                : undefined
            }
          >
            Print labels ({selectedWithDelyva.length})
          </a>
        </div>
        {confirmState.error ? (
          <p className="form-error" role="alert">
            {confirmState.error}
          </p>
        ) : null}
        {confirmState.info ? <p className="form-info">{confirmState.info}</p> : null}
        {rejectState.error ? (
          <p className="form-error" role="alert">
            {rejectState.error}
          </p>
        ) : null}
        {rejectState.info ? <p className="form-info">{rejectState.info}</p> : null}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={allChecked}
                  aria-label="Select all"
                  onChange={(e) => {
                    const next: Record<string, boolean> = {};
                    if (e.target.checked) {
                      for (const r of rows) next[r.id] = true;
                    }
                    setSelected(next);
                  }}
                />
              </th>
              <th>Ref</th>
              <th>Status</th>
              <th>Ship</th>
              <th>Product</th>
              <th>SPX</th>
              <th>Total</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={Boolean(selected[o.id])}
                    aria-label={`Select ${o.publicRef}`}
                    onChange={(e) => {
                      setSelected((prev) => ({
                        ...prev,
                        [o.id]: e.target.checked,
                      }));
                    }}
                  />
                </td>
                <td>
                  <Link href={`/admin/orders/${o.id}`}>{o.publicRef}</Link>
                </td>
                <td>
                  <span className="status-pill" data-tone={statusTone(o.status)}>
                    {formatOrderStatus(o.status)}
                  </span>
                </td>
                <td>{o.shipDate}</td>
                <td>
                  {o.productName} / {o.subName}
                </td>
                <td>
                  {o.hasDelyva ? (
                    <span className="muted" style={{ fontSize: "0.78rem" }}>
                      {o.trackingNumber || "linked"}
                    </span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>{o.totalLabel}</td>
                <td>{o.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
