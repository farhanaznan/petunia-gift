/**
 * R2 key layout — all media lives in object storage; Postgres stores keys only.
 *
 * petunia-gift-media/
 *   products/{productId}/hero/{filename}
 *   products/{productId}/subs/{subProductId}/{filename}
 *   products/graduation/variants/{variant}.png   (seed/admin artwork)
 *   customer/{orderId}/{uuid}.{ext}              (private customization photos)
 *   receipts/{orderId}/{uuid}.{ext}              (private payment proof)
 *   payments/tng-qr/{version}.{ext}              (singleton shared QR; versioned on replace)
 */

export const R2_PREFIX = {
  products: "products",
  customer: "customer",
  receipts: "receipts",
  payments: "payments",
} as const;

export function productHeroKey(productId: string, filename: string): string {
  return `${R2_PREFIX.products}/${productId}/hero/${sanitizeFilename(filename)}`;
}

export function subProductImageKey(
  productId: string,
  subProductId: string,
  filename: string,
): string {
  return `${R2_PREFIX.products}/${productId}/subs/${subProductId}/${sanitizeFilename(filename)}`;
}

export function customerImageKey(
  orderId: string,
  objectId: string,
  ext: string,
): string {
  return `${R2_PREFIX.customer}/${orderId}/${objectId}.${normalizeExt(ext)}`;
}

export function receiptKey(
  orderId: string,
  objectId: string,
  ext: string,
): string {
  return `${R2_PREFIX.receipts}/${orderId}/${objectId}.${normalizeExt(ext)}`;
}

/** Versioned so replacing QR does not fight CDN/browser cache of the previous object. */
export function tngQrKey(version: string, ext: string): string {
  return `${R2_PREFIX.payments}/tng-qr/${version}.${normalizeExt(ext)}`;
}

export function isPrivateMediaKey(key: string): boolean {
  return (
    key.startsWith(`${R2_PREFIX.customer}/`) ||
    key.startsWith(`${R2_PREFIX.receipts}/`)
  );
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^\.+/, "") || "file";
}

function normalizeExt(ext: string): string {
  return ext.replace(/^\./, "").toLowerCase() || "bin";
}
