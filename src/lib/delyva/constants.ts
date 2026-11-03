/** Always Shopee Express (SPX) via Delyva — pickup NDD service code. */
export const DELYVA_SPX_SERVICE_CODE = "SPXMY-PN-B200";

/** Fallback drop-off SPX code if pickup is unavailable on a route. */
export const DELYVA_SPX_DROP_SERVICE_CODE = "SPXDMY-PN-B200";

export const DELYVA_API_BASE = "https://api.delyva.app/v1.0";

/** One gift item per Petunia order — always 1 kg. */
export const DELYVA_ITEM_WEIGHT_KG = 1;

export const DELYVA_SOURCE = "petunia-gift";

/** Official SPX Malaysia tracker (tracking number appended). */
export function spxExpressTrackUrl(trackingNumber: string): string {
  const tn = trackingNumber.trim();
  return `https://spx.com.my/track?${encodeURIComponent(tn)}`;
}
