"use client";

import { useState } from "react";
import { AdminActionForm } from "@/components/admin/admin-form";
import { MediaKeyField } from "@/components/admin/media-key-field";
import {
  upsertSubProductAction,
  type AdminActionState,
} from "@/lib/admin/catalog-actions";
import { senToRm } from "@/lib/money";

type SubRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceSen: number;
  badgeText: string | null;
  isActive: boolean;
  sortOrder: number;
  config: unknown;
  images: { id: string; storageKey: string; alt: string }[];
};

export function SubProductEditor({
  productId,
  nature,
  defaultConfig,
  subs,
  addImageAction,
}: {
  productId: string;
  nature: string;
  defaultConfig: string;
  subs: SubRow[];
  addImageAction: (
    prev: AdminActionState,
    formData: FormData,
  ) => Promise<AdminActionState>;
}) {
  const [editingId, setEditingId] = useState<string | "new">("new");
  const editing = editingId === "new" ? null : subs.find((s) => s.id === editingId);

  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      <ul className="product-rail">
        {subs.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className="product-link"
              style={{ width: "100%", cursor: "pointer", textAlign: "left" }}
              onClick={() => setEditingId(s.id)}
            >
              <div>
                <h3 className="product-link-title">
                  {s.name}
                  {s.badgeText ? <span className="badge">{s.badgeText}</span> : null}
                </h3>
                <p className="product-link-meta">
                  {s.slug}
                  {!s.isActive ? " · inactive" : ""}
                  {s.images.length ? ` · ${s.images.length} image(s)` : ""}
                </p>
              </div>
              <div className="product-link-price">{senToRm(s.priceSen)}</div>
            </button>
          </li>
        ))}
      </ul>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button
          type="button"
          className="button secondary"
          onClick={() => setEditingId("new")}
        >
          New sub-product
        </button>
      </div>

      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-display), sans-serif",
          letterSpacing: "-0.03em",
          fontSize: "1.4rem",
        }}
      >
        {editing ? `Edit ${editing.name}` : "Create sub-product"}
      </h2>
      <AdminActionForm
        key={editing?.id ?? "new"}
        action={upsertSubProductAction}
        submitLabel={editing ? "Update sub-product" : "Create sub-product"}
      >
        <input type="hidden" name="productId" value={productId} />
        {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
        <div className="form-grid">
          <label className="stack">
            <span className="field-label">Slug</span>
            <input name="slug" required defaultValue={editing?.slug ?? ""} />
          </label>
          <label className="stack">
            <span className="field-label">Name</span>
            <input name="name" required defaultValue={editing?.name ?? ""} />
          </label>
          <label className="stack span-2">
            <span className="field-label">Description</span>
            <textarea
              name="description"
              rows={2}
              defaultValue={editing?.description ?? ""}
            />
          </label>
          <label className="stack">
            <span className="field-label">Price (sen)</span>
            <input
              name="priceSen"
              type="number"
              required
              defaultValue={editing?.priceSen ?? 5000}
            />
          </label>
          <label className="stack">
            <span className="field-label">Badge (e.g. HOT!)</span>
            <input name="badgeText" defaultValue={editing?.badgeText ?? ""} />
          </label>
          <label className="stack">
            <span className="field-label">Sort order</span>
            <input
              name="sortOrder"
              type="number"
              defaultValue={editing?.sortOrder ?? 0}
            />
          </label>
          <label
            className="stack"
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <input
              name="isActive"
              type="checkbox"
              defaultChecked={editing?.isActive ?? true}
            />{" "}
            Active
          </label>
          <label className="stack span-2">
            <span className="field-label">Nature config JSON ({nature})</span>
            <textarea
              name="config"
              rows={10}
              defaultValue={
                editing ? JSON.stringify(editing.config, null, 2) : defaultConfig
              }
            />
          </label>
        </div>
      </AdminActionForm>

      {editing ? (
        <div className="panel elevated stack">
          <h3 style={{ margin: 0, fontSize: "1.05rem" }}>Gallery images</h3>
          <ul className="upload-list">
            {editing.images.map((img) => (
              <li key={img.id}>
                <a
                  href={`/api/media?key=${encodeURIComponent(img.storageKey)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {img.alt || img.storageKey}
                </a>
              </li>
            ))}
          </ul>
          <AdminActionForm action={addImageAction} submitLabel="Add image">
            <input type="hidden" name="subProductId" value={editing.id} />
            <input type="hidden" name="productId" value={productId} />
            <MediaKeyField
              name="storageKey"
              kind="sub_product_image"
              label="Upload gallery image"
              productId={productId}
              subProductId={editing.id}
            />
            <label className="stack">
              <span className="field-label">Alt text</span>
              <input name="alt" defaultValue={editing.name} />
            </label>
          </AdminActionForm>
        </div>
      ) : null}
    </div>
  );
}
