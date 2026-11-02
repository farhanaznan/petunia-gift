"use client";

import { useActionState, useState } from "react";
import {
  submitReceiptAction,
  type ActionState,
} from "@/lib/checkout/actions";

const initial: ActionState = {};

export function PayForm({
  publicRef,
  statusToken,
  hasQr,
}: {
  publicRef: string;
  statusToken: string;
  hasQr: boolean;
}) {
  const [receiptKey, setReceiptKey] = useState(
    `receipts/${publicRef}/manual-upload.jpg`,
  );
  const [state, action, pending] = useActionState(submitReceiptAction, initial);

  return (
    <form action={action} className="panel stack">
      <input type="hidden" name="publicRef" value={publicRef} />
      <input type="hidden" name="statusToken" value={statusToken} />
      <input type="hidden" name="receiptMime" value="image/jpeg" />
      <input type="hidden" name="receiptBytes" value="0" />

      <p className="muted">
        {hasQr
          ? "Scan the Touch ’n Go QR above, then confirm your receipt key below."
          : "Admin has not uploaded a TnG QR yet — you can still submit a receipt key for review."}
      </p>

      <label className="stack">
        <span>
          Receipt storage key (R2). Until browser upload is wired, paste/keep the
          placeholder key after paying.
        </span>
        <input
          name="receiptKey"
          value={receiptKey}
          onChange={(e) => setReceiptKey(e.target.value)}
          required
        />
      </label>

      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <button className="button" type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Submit for payment review"}
      </button>
    </form>
  );
}
