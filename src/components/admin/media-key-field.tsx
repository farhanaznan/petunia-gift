"use client";

import { useState } from "react";
import { UploadField } from "@/components/upload-field";

/** Hidden input + upload UI that writes the R2 object key into a form field. */
export function MediaKeyField({
  name,
  kind,
  label,
  accept = "image/jpeg,image/png,image/webp",
  defaultKey = "",
  productId,
  subProductId,
}: {
  name: string;
  kind: "tng_qr" | "product_hero" | "sub_product_image";
  label: string;
  accept?: string;
  defaultKey?: string;
  productId?: string;
  subProductId?: string;
}) {
  const [key, setKey] = useState(defaultKey);

  return (
    <div className="stack">
      <input type="hidden" name={name} value={key} />
      <UploadField
        kind={kind}
        label={label}
        accept={accept}
        maxFiles={1}
        productId={productId}
        subProductId={subProductId}
        onKeysChange={(keys) => setKey(keys[0] || "")}
      />
      {key ? (
        <p className="muted">
          Key: <code>{key}</code>{" "}
          <a
            href={`/api/media?key=${encodeURIComponent(key)}`}
            target="_blank"
            rel="noreferrer"
          >
            Preview
          </a>
        </p>
      ) : (
        <p className="muted">No file yet.</p>
      )}
    </div>
  );
}
