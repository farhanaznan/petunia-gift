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
  const [dragging, setDragging] = useState(false);

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
      setDragging(false);
    }
  }

  return (
    <div className="stack">
      <span className="field-label">{label}</span>
      <label
        className={`dropzone${dragging ? " is-dragging" : ""}`}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          void onChange(e.dataTransfer.files);
        }}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={busy}
          onChange={(e) => onChange(e.target.files)}
        />
        <span className="dropzone-title">
          {busy ? "Uploading…" : "Drop files here or tap to browse"}
        </span>
        <p className="dropzone-hint">
          {multiple ? `Up to ${maxFiles ?? 12} files` : "One file"} · JPEG / PNG / WebP
          {kind === "receipt" ? " / PDF" : ""} · max 10MB
        </p>
      </label>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {keys.length ? (
        <ul className="upload-list">
          {keys.map((key) => (
            <li key={key}>
              <a
                href={`/api/media?key=${encodeURIComponent(key)}`}
                target="_blank"
                rel="noreferrer"
              >
                Uploaded — preview
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
