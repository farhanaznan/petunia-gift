"use client";

import { useState } from "react";

export type UploadedMedia = {
  key: string;
  mime?: string;
  byteSize?: number;
  url?: string;
};

export function UploadField({
  kind,
  label,
  accept,
  multiple,
  maxFiles,
  orderId,
  productId,
  subProductId,
  onKeysChange,
  onUploaded,
}: {
  kind:
    | "customer_image"
    | "receipt"
    | "tng_qr"
    | "product_hero"
    | "sub_product_image";
  label: string;
  accept: string;
  multiple?: boolean;
  maxFiles?: number;
  orderId?: string;
  productId?: string;
  subProductId?: string;
  onKeysChange: (keys: string[]) => void;
  onUploaded?: (files: UploadedMedia[]) => void;
}) {
  const [keys, setKeys] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const nextKeys = multiple ? [...keys] : [];
      const nextMeta: UploadedMedia[] = [];
      const list = Array.from(files).slice(
        0,
        Math.max(0, (maxFiles ?? 12) - nextKeys.length),
      );
      for (const file of list) {
        const body = new FormData();
        body.set("kind", kind);
        body.set("file", file);
        if (orderId) body.set("orderId", orderId);
        if (productId) body.set("productId", productId);
        if (subProductId) body.set("subProductId", subProductId);
        const res = await fetch("/api/uploads", { method: "POST", body });
        const json = (await res.json()) as {
          key?: string;
          mime?: string;
          byteSize?: number;
          url?: string;
          error?: string;
        };
        if (!res.ok || !json.key) {
          throw new Error(json.error || "Upload failed");
        }
        nextKeys.push(json.key);
        nextMeta.push({
          key: json.key,
          mime: json.mime,
          byteSize: json.byteSize,
          url: json.url,
        });
      }
      setKeys(nextKeys);
      onKeysChange(nextKeys);
      onUploaded?.(nextMeta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <label className="stack">
        <span>{label}</span>
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={busy}
          onChange={(e) => onChange(e.target.files)}
        />
      </label>
      {busy ? <p className="muted">Uploading…</p> : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {keys.length ? (
        <ul className="route-list">
          {keys.map((key) => (
            <li key={key}>
              <a href={`/api/media?key=${encodeURIComponent(key)}`} target="_blank" rel="noreferrer">
                Uploaded ✓
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
