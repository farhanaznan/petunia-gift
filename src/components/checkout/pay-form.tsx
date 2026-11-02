"use client";

import { useActionState, useState } from "react";
import { UploadField } from "@/components/upload-field";
import {
  submitReceiptAction,
  type ActionState,
} from "@/lib/checkout/actions";

const initial: ActionState = {};

export function PayForm({
  publicRef,
  statusToken,
  orderId,
  qrKey,
}: {
  publicRef: string;
  statusToken: string;
  orderId: string;
  qrKey: string | null;
}) {
  const [receiptKey, setReceiptKey] = useState("");
  const [receiptMime, setReceiptMime] = useState("image/jpeg");
  const [receiptBytes, setReceiptBytes] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [state, action, pending] = useActionState(submitReceiptAction, initial);

  return (
    <div className="checkout-layout">
      <div className="stack">
        {qrKey ? (
          <div className="panel qr-stage">
            <p className="nature-tag">Touch ’n Go</p>
            <p style={{ margin: 0 }}>
              Scan the QR, then upload your receipt image or PDF.
            </p>
            <button
              type="button"
              className="qr-thumb"
              onClick={() => setZoom(true)}
              aria-label="Zoom Touch n Go QR"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/media?key=${encodeURIComponent(qrKey)}`}
                alt="Touch n Go QR"
              />
            </button>
            <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
              Tap image to zoom
            </p>
          </div>
        ) : (
          <div className="panel">
            <p className="form-error">
              Admin has not uploaded a TnG QR yet. Payment cannot complete until
              QR is set.
            </p>
          </div>
        )}

        {zoom && qrKey ? (
          <div
            className="qr-lightbox"
            role="dialog"
            aria-modal="true"
            onClick={() => setZoom(false)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/media?key=${encodeURIComponent(qrKey)}`}
              alt="Touch n Go QR zoomed"
            />
          </div>
        ) : null}

        <form action={action} className="panel stack">
          <input type="hidden" name="publicRef" value={publicRef} />
          <input type="hidden" name="statusToken" value={statusToken} />
          <input type="hidden" name="receiptKey" value={receiptKey} />
          <input type="hidden" name="receiptMime" value={receiptMime} />
          <input type="hidden" name="receiptBytes" value={String(receiptBytes)} />

          <UploadField
            kind="receipt"
            label="Payment receipt"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            orderId={orderId}
            onKeysChange={(keys) => setReceiptKey(keys[0] || "")}
            onUploaded={(files) => {
              const file = files[0];
              if (!file) return;
              setReceiptKey(file.key);
              setReceiptMime(file.mime || "application/octet-stream");
              setReceiptBytes(file.byteSize || 0);
            }}
          />

          {receiptKey ? (
            <p className="form-info">
              Receipt ready.{" "}
              <a
                href={`/api/media?key=${encodeURIComponent(receiptKey)}&ref=${encodeURIComponent(publicRef)}&token=${encodeURIComponent(statusToken)}`}
                target="_blank"
                rel="noreferrer"
              >
                Preview
              </a>
            </p>
          ) : null}

          {state.error ? (
            <p className="form-error" role="alert">
              {state.error}
            </p>
          ) : null}

          <button
            className="button"
            type="submit"
            disabled={pending || !receiptKey || !qrKey}
          >
            {pending ? "Submitting…" : "Submit for payment review"}
          </button>
        </form>
      </div>

      <aside className="checkout-summary">
        <div className="panel stack">
          <p className="nature-tag">Order</p>
          <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem" }}>
            {publicRef}
          </strong>
          <p className="muted" style={{ margin: 0 }}>
            After submit, we review your receipt and confirm the order.
          </p>
        </div>
      </aside>
    </div>
  );
}
