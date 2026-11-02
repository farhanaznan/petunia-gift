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
    <>
      {qrKey ? (
        <div className="panel stack" style={{ marginBottom: "1rem" }}>
          <p>Scan this Touch ’n Go QR, then upload your receipt.</p>
          <button
            type="button"
            className="button secondary"
            onClick={() => setZoom(true)}
            style={{ padding: 0, border: "none", background: "transparent" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/media?key=${encodeURIComponent(qrKey)}`}
              alt="Touch n Go QR"
              style={{ width: "min(280px, 100%)", cursor: "zoom-in" }}
            />
          </button>
          <p className="muted">Tap image to zoom</p>
        </div>
      ) : (
        <div className="panel" style={{ marginBottom: "1rem" }}>
          <p className="form-error">
            Admin has not uploaded a TnG QR yet. Payment cannot complete until QR is set.
          </p>
        </div>
      )}

      {zoom && qrKey ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setZoom(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "grid",
            placeItems: "center",
            zIndex: 50,
            padding: "1rem",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/media?key=${encodeURIComponent(qrKey)}`}
            alt="Touch n Go QR zoomed"
            style={{ maxWidth: "90vw", maxHeight: "90vh", background: "#fff", padding: 12 }}
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
          label="Upload payment receipt (JPEG/PNG/WebP/PDF ≤10MB)"
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
    </>
  );
}
