import {
  DELYVA_API_BASE,
  DELYVA_ITEM_WEIGHT_KG,
  DELYVA_SOURCE,
  DELYVA_SPX_DROP_SERVICE_CODE,
  DELYVA_SPX_SERVICE_CODE,
} from "@/lib/delyva/constants";
import { getRuntimeEnv } from "@/lib/runtime-env";

export class DelyvaError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "DelyvaError";
  }
}

type Json = Record<string, unknown>;

export type DelyvaContact = {
  name: string;
  email?: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
};

export type DelyvaInventoryItem = {
  name: string;
  type: "PARCEL";
  price: { amount: string; currency: "MYR" };
  weight: { value: number; unit: "kg" };
  quantity: 1;
};

export type DelyvaOrderDetails = {
  id: number | string;
  statusCode?: number;
  consignmentNo?: string | null;
  trackingNo?: string | null;
  serviceCode?: string | null;
  message?: string;
  [key: string]: unknown;
};

export type DelyvaCustomer = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  postcode?: string | null;
  country?: string | null;
};

async function getApiKey(): Promise<string> {
  const env = await getRuntimeEnv();
  const key = env.DELYVA_API_KEY?.trim();
  if (!key) {
    throw new DelyvaError(
      "DELYVA_API_KEY is not configured (set as a Worker secret).",
    );
  }
  return key;
}

async function delyvaFetch<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const key = await getApiKey();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  headers.set("X-Delyvax-Access-Token", key);

  const res = await fetch(`${DELYVA_API_BASE}${path}`, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  });

  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  if (!res.ok) {
    const errObj = (parsed ?? {}) as Json;
    const message =
      (typeof errObj.message === "string" && errObj.message) ||
      (typeof errObj.error === "string" && errObj.error) ||
      `Delyva HTTP ${res.status}`;
    throw new DelyvaError(message, String(errObj.code ?? res.status), errObj);
  }

  if (parsed && typeof parsed === "object" && "data" in (parsed as object)) {
    return (parsed as { data: T }).data;
  }
  return parsed as T;
}

export function normalizeMyPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return phone;
  if (digits.startsWith("60")) return digits;
  if (digits.startsWith("0")) return `60${digits.slice(1)}`;
  return digits;
}

export async function getDelyvaCustomer(): Promise<DelyvaCustomer> {
  const env = await getRuntimeEnv();
  const customer = await delyvaFetch<DelyvaCustomer>("/customer");
  if (env.DELYVA_CUSTOMER_ID) {
    const override = Number(env.DELYVA_CUSTOMER_ID);
    if (Number.isFinite(override) && override > 0) {
      return { ...customer, id: override };
    }
  }
  return customer;
}

export async function quoteSpxServiceCode(input: {
  origin: Pick<DelyvaContact, "address1" | "city" | "state" | "postcode" | "country">;
  destination: Pick<
    DelyvaContact,
    "address1" | "city" | "state" | "postcode" | "country"
  >;
  customerId: number;
}): Promise<string> {
  try {
    const data = await delyvaFetch<{
      services?: Array<{
        service?: {
          code?: string;
          name?: string;
          serviceCompany?: { companyCode?: string; name?: string };
        };
      }>;
    }>("/service/instantQuote", {
      method: "POST",
      json: {
        customerId: input.customerId,
        origin: {
          address1: input.origin.address1,
          city: input.origin.city,
          state: input.origin.state,
          postcode: input.origin.postcode,
          country: input.origin.country,
        },
        destination: {
          address1: input.destination.address1,
          city: input.destination.city,
          state: input.destination.state,
          postcode: input.destination.postcode,
          country: input.destination.country,
        },
        weight: { unit: "kg", value: DELYVA_ITEM_WEIGHT_KG },
        itemType: "PARCEL",
      },
    });

    const services = data.services ?? [];
    const pickup = services.find((s) => {
      const code = s.service?.code ?? "";
      const company = s.service?.serviceCompany?.companyCode ?? "";
      return company === "SPXMY" || code.startsWith("SPXMY");
    });
    if (pickup?.service?.code) return pickup.service.code;

    const drop = services.find((s) => {
      const code = s.service?.code ?? "";
      const company = s.service?.serviceCompany?.companyCode ?? "";
      const name = `${s.service?.name ?? ""} ${s.service?.serviceCompany?.name ?? ""}`;
      return (
        company === "SPXDMY" ||
        code.startsWith("SPXDMY") ||
        /spx|shopee/i.test(name)
      );
    });
    if (drop?.service?.code) return drop.service.code;
  } catch {
    // Fall through to hardcoded SPX codes.
  }
  return DELYVA_SPX_SERVICE_CODE;
}

function inventoryItem(name: string, priceSen: number): DelyvaInventoryItem {
  return {
    name,
    type: "PARCEL",
    price: {
      amount: (priceSen / 100).toFixed(2),
      currency: "MYR",
    },
    weight: { value: DELYVA_ITEM_WEIGHT_KG, unit: "kg" },
    quantity: 1,
  };
}

export async function createDelyvaOrder(input: {
  customerId: number;
  serviceCode: string;
  referenceNo: string;
  note?: string;
  process?: boolean;
  origin: DelyvaContact & { scheduledAt?: string };
  destination: DelyvaContact & { scheduledAt?: string };
  itemName: string;
  priceSen: number;
}): Promise<DelyvaOrderDetails> {
  const item = inventoryItem(input.itemName, input.priceSen);
  return delyvaFetch<DelyvaOrderDetails>("/order", {
    method: "POST",
    headers: {
      "idempotency-key": `petunia-${input.referenceNo}`,
    },
    json: {
      customerId: input.customerId,
      process: input.process ?? false,
      serviceCode: input.serviceCode,
      source: DELYVA_SOURCE,
      referenceNo: input.referenceNo,
      note: input.note ?? "Petunia Gift — handle with care",
      origin: {
        scheduledAt: input.origin.scheduledAt,
        inventory: [item],
        contact: {
          name: input.origin.name,
          email: input.origin.email,
          phone: normalizeMyPhone(input.origin.phone),
          address1: input.origin.address1,
          address2: input.origin.address2,
          city: input.origin.city,
          state: input.origin.state,
          postcode: input.origin.postcode,
          country: input.origin.country || "MY",
        },
      },
      destination: {
        scheduledAt: input.destination.scheduledAt,
        inventory: [item],
        contact: {
          name: input.destination.name,
          email: input.destination.email,
          phone: normalizeMyPhone(input.destination.phone),
          address1: input.destination.address1,
          address2: input.destination.address2,
          city: input.destination.city,
          state: input.destination.state,
          postcode: input.destination.postcode,
          country: input.destination.country || "MY",
        },
      },
    },
  });
}

export async function processDelyvaOrder(
  orderId: string | number,
  body: {
    serviceCode: string;
    originScheduledAt?: string;
    destinationScheduledAt?: string;
  },
): Promise<DelyvaOrderDetails> {
  return delyvaFetch<DelyvaOrderDetails>(`/order/${orderId}/process`, {
    method: "POST",
    json: body,
  });
}

export async function getDelyvaOrderDetails(
  orderId: string | number,
): Promise<DelyvaOrderDetails> {
  return delyvaFetch<DelyvaOrderDetails>(`/order/${orderId}`);
}

export async function cancelDelyvaOrder(
  orderId: string | number,
): Promise<DelyvaOrderDetails> {
  return delyvaFetch<DelyvaOrderDetails>(`/order/${orderId}/cancel`, {
    method: "POST",
    json: {},
  });
}

/** Returns raw PDF bytes for a shipping label. */
export async function fetchDelyvaLabelPdf(
  orderId: string | number,
): Promise<ArrayBuffer> {
  const key = await getApiKey();
  const res = await fetch(`${DELYVA_API_BASE}/order/${orderId}/label`, {
    headers: {
      "X-Delyvax-Access-Token": key,
      Accept: "application/pdf,application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new DelyvaError(`Label fetch failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.arrayBuffer();
}

export function resolveTrackingNumber(details: DelyvaOrderDetails): string | null {
  const consignment =
    (typeof details.consignmentNo === "string" && details.consignmentNo) ||
    null;
  const tracking =
    (typeof details.trackingNo === "string" && details.trackingNo) || null;
  return consignment || tracking || null;
}

export { DELYVA_SPX_SERVICE_CODE, DELYVA_SPX_DROP_SERVICE_CODE };
