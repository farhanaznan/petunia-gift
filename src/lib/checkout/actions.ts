"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getCapacityOnDate } from "@/lib/catalog/capacity";
import {
  clearCheckoutCart,
  getCheckoutCart,
  setCheckoutCart,
  computeSurchargeSen,
} from "@/lib/checkout/cart";
import { getDb } from "@/lib/db";
import {
  orderMedia,
  orders,
  paymentSettings,
  products,
  subProducts,
} from "@/lib/db/schema";
import {
  malaysiaAddressSchema,
  normalizeMyPhone,
  shippingFeeSenForState,
  type MalaysiaState,
} from "@/lib/malaysia";
import { sumSen } from "@/lib/money";
import {
  f1CustomizationSchema,
  graduationCustomizationSchema,
  graduationLegoFrameConfigSchema,
  museumCustomizationSchema,
  museumOfUsConfigSchema,
  type OrderCustomization,
  type ProductNature,
} from "@/lib/natures/types";
import { makePublicRef, makeStatusToken } from "@/lib/orders/refs";

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function parseCustomization(
  nature: ProductNature,
  raw: unknown,
  config: unknown,
): { ok: true; value: OrderCustomization; surchargeSen: number } | { ok: false; error: string } {
  if (nature === "museum_of_us") {
    const cfg = museumOfUsConfigSchema.parse(config);
    const parsed = museumCustomizationSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: "Invalid Museum of Us fields." };
    if (cfg.requireTitle && !parsed.data.title.trim()) {
      return { ok: false, error: "Title is required." };
    }
    if (parsed.data.title.length > cfg.titleMaxChars) {
      return { ok: false, error: `Title max ${cfg.titleMaxChars} characters.` };
    }
    if (cfg.requireMessage && !parsed.data.message.trim()) {
      return { ok: false, error: "Message is required." };
    }
    if (wordCount(parsed.data.message) > cfg.messageMaxWords) {
      return { ok: false, error: `Message max ${cfg.messageMaxWords} words.` };
    }
    if (parsed.data.imageKeys.length < cfg.minImages) {
      return { ok: false, error: `Upload at least ${cfg.minImages} image(s).` };
    }
    return { ok: true, value: parsed.data, surchargeSen: 0 };
  }

  if (nature === "f1_pick_and_go") {
    const parsed = f1CustomizationSchema.safeParse(raw ?? {});
    if (!parsed.success) return { ok: false, error: "Invalid F1 selection." };
    return { ok: true, value: parsed.data, surchargeSen: 0 };
  }

  const cfg = graduationLegoFrameConfigSchema.parse(config);
  const parsed = graduationCustomizationSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Choose a Lego variant." };
  const allowed = new Set(cfg.variants.map((v) => v.key));
  if (!allowed.has(parsed.data.legoVariant)) {
    return { ok: false, error: "Pick exactly one of the three Lego variants." };
  }
  if (parsed.data.imageKeys.length > 1) {
    return { ok: false, error: "Graduation frames allow at most one photo." };
  }
  const surchargeSen = computeSurchargeSen(
    "graduation_lego_frame",
    parsed.data,
    cfg.optionalImageSurchargeSen,
  );
  return { ok: true, value: parsed.data, surchargeSen };
}

export type ActionState = { error?: string; info?: string };

export async function startCheckoutAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const productSlug = String(formData.get("productSlug") || "");
  const subSlug = String(formData.get("subSlug") || "");
  const shipDate = String(formData.get("shipDate") || "");
  const customizationRaw = String(formData.get("customization") || "{}");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(shipDate)) {
    return { error: "Pick a ship date before continuing." };
  }

  const db = await getDb();
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, productSlug), eq(products.isActive, true)))
    .limit(1);
  if (!product) return { error: "Product not found." };

  const [sub] = await db
    .select()
    .from(subProducts)
    .where(
      and(
        eq(subProducts.productId, product.id),
        eq(subProducts.slug, subSlug),
        eq(subProducts.isActive, true),
      ),
    )
    .limit(1);
  if (!sub) return { error: "Sub-product not found." };

  const cap = await getCapacityOnDate({
    nature: product.nature,
    productId: product.id,
    subProductId: sub.id,
    shipDate,
  });
  if (!cap) {
    return { error: "That ship date is full or unavailable. Pick another date." };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(customizationRaw);
  } catch {
    return { error: "Invalid customization payload." };
  }

  const parsed = parseCustomization(product.nature, raw, sub.config);
  if (!parsed.ok) return { error: parsed.error };

  await setCheckoutCart({
    productId: product.id,
    subProductId: sub.id,
    productSlug: product.slug,
    subSlug: sub.slug,
    productName: product.name,
    subName: sub.name,
    nature: product.nature,
    unitPriceSen: sub.priceSen,
    surchargeSen: parsed.surchargeSen,
    shipDate,
    customization: parsed.value,
  });

  redirect("/order");
}

const placeOrderSchema = malaysiaAddressSchema;

export async function placeOrderAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const cart = await getCheckoutCart();
  if (!cart) return { error: "Checkout session expired. Pick a product again." };

  const parsed = placeOrderSchema.safeParse({
    buyerName: formData.get("buyerName"),
    email: formData.get("email"),
    recipientPhone: formData.get("recipientPhone"),
    customerPhone: formData.get("customerPhone"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2") || undefined,
    postcode: formData.get("postcode"),
    city: formData.get("city"),
    state: formData.get("state"),
    country: "MY",
  });
  if (!parsed.success) {
    return { error: "Please complete a valid Malaysia address." };
  }

  const cap = await getCapacityOnDate({
    nature: cart.nature,
    productId: cart.productId,
    subProductId: cart.subProductId,
    shipDate: cart.shipDate,
  });
  if (!cap) {
    return { error: "That ship date is full. Go back and pick another date." };
  }

  const db = await getDb();
  const state = parsed.data.state as MalaysiaState;
  const shippingFeeSen = shippingFeeSenForState(state);
  const totalSen = sumSen(
    cart.unitPriceSen,
    cart.surchargeSen,
    shippingFeeSen,
  );

  const publicRef = makePublicRef();
  const statusToken = makeStatusToken();
  const heldUntil = new Date(Date.now() + 30 * 60 * 1000);

  const [order] = await db
    .insert(orders)
    .values({
      publicRef,
      status: "draft_hold",
      productId: cart.productId,
      subProductId: cart.subProductId,
      shipDate: cart.shipDate,
      unitPriceSen: cart.unitPriceSen,
      surchargeSen: cart.surchargeSen,
      shippingFeeSen,
      totalSen,
      buyerName: parsed.data.buyerName,
      email: parsed.data.email,
      recipientPhone: normalizeMyPhone(parsed.data.recipientPhone),
      customerPhone: normalizeMyPhone(parsed.data.customerPhone),
      addressLine1: parsed.data.addressLine1,
      addressLine2: parsed.data.addressLine2,
      postcode: parsed.data.postcode,
      city: parsed.data.city,
      state,
      country: "MY",
      customization: cart.customization,
      statusToken,
      capacityHeldUntil: heldUntil,
    })
    .returning();

  await clearCheckoutCart();
  redirect(`/order/pay?ref=${encodeURIComponent(order.publicRef)}&token=${encodeURIComponent(order.statusToken)}`);
}

export async function submitReceiptAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const publicRef = String(formData.get("publicRef") || "");
  const statusToken = String(formData.get("statusToken") || "");
  const receiptKey = String(formData.get("receiptKey") || "").trim();

  if (!publicRef || !statusToken) return { error: "Missing order reference." };
  if (!receiptKey) {
    return { error: "Upload a receipt image or PDF before submitting." };
  }

  const db = await getDb();
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.publicRef, publicRef), eq(orders.statusToken, statusToken)))
    .limit(1);
  if (!order) return { error: "Order not found." };
  if (order.status !== "draft_hold" && order.status !== "pending_payment_review") {
    return { error: "This order can no longer accept a receipt." };
  }

  await db
    .update(orders)
    .set({
      receiptKey,
      status: "pending_payment_review",
      capacityHeldUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id));

  await db.insert(orderMedia).values({
    orderId: order.id,
    kind: "receipt",
    storageKey: receiptKey,
    mime: String(formData.get("receiptMime") || "application/octet-stream"),
    byteSize: Number(formData.get("receiptBytes") || 0),
  });

  redirect(`/order/thanks?ref=${encodeURIComponent(publicRef)}`);
}

export async function getPaymentQrKey(): Promise<string | null> {
  const db = await getDb();
  const [row] = await db.select().from(paymentSettings).limit(1);
  return row?.tngQrKey ?? null;
}
