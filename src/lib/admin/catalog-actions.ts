"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import {
  capacitySlots,
  orders,
  paymentSettings,
  products,
  subProducts,
} from "@/lib/db/schema";
import {
  productNatureSchema,
  type SubProductConfig,
} from "@/lib/natures/types";
import { natureRegistry } from "@/lib/natures/registry";

export type AdminActionState = { error?: string; info?: string };

async function guard() {
  const session = await requireAdminSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function upsertProductAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await guard();
  const parsed = z
    .object({
      id: z.string().uuid().optional().or(z.literal("")),
      slug: z.string().min(1),
      name: z.string().min(1),
      description: z.string().default(""),
      nature: productNatureSchema,
      badgeText: z.string().optional(),
      isActive: z.coerce.boolean().default(true),
      sortOrder: z.coerce.number().int().default(0),
    })
    .safeParse({
      id: formData.get("id") || undefined,
      slug: formData.get("slug"),
      name: formData.get("name"),
      description: formData.get("description") || "",
      nature: formData.get("nature"),
      badgeText: formData.get("badgeText") || undefined,
      isActive: formData.get("isActive") === "on",
      sortOrder: formData.get("sortOrder") || 0,
    });
  if (!parsed.success) return { error: "Invalid product fields." };

  const db = await getDb();
  if (parsed.data.id) {
    await db
      .update(products)
      .set({
        slug: parsed.data.slug,
        name: parsed.data.name,
        description: parsed.data.description,
        nature: parsed.data.nature,
        badgeText: parsed.data.badgeText || null,
        isActive: parsed.data.isActive,
        sortOrder: parsed.data.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(products.id, parsed.data.id));
  } else {
    await db.insert(products).values({
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description,
      nature: parsed.data.nature,
      badgeText: parsed.data.badgeText || null,
      isActive: parsed.data.isActive,
      sortOrder: parsed.data.sortOrder,
    });
  }
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { info: "Product saved." };
}

export async function upsertSubProductAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await guard();
  const productId = String(formData.get("productId") || "");
  const id = String(formData.get("id") || "");
  const slug = String(formData.get("slug") || "");
  const name = String(formData.get("name") || "");
  const priceSen = Number(formData.get("priceSen") || 0);
  const badgeText = String(formData.get("badgeText") || "") || null;
  const isActive = formData.get("isActive") === "on";
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const configRaw = String(formData.get("config") || "{}");

  if (!productId || !slug || !name || !Number.isFinite(priceSen)) {
    return { error: "Missing sub-product fields." };
  }

  const db = await getDb();
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  if (!product) return { error: "Product not found." };

  let config: SubProductConfig;
  try {
    const raw = JSON.parse(configRaw) as unknown;
    config = natureRegistry[product.nature].parseConfig(raw) as SubProductConfig;
  } catch {
    return { error: "Config must be valid JSON matching the product nature." };
  }

  if (id) {
    await db
      .update(subProducts)
      .set({
        slug,
        name,
        priceSen,
        badgeText,
        isActive,
        sortOrder,
        config,
        updatedAt: new Date(),
      })
      .where(eq(subProducts.id, id));
  } else {
    await db.insert(subProducts).values({
      productId,
      slug,
      name,
      priceSen,
      badgeText,
      isActive,
      sortOrder,
      config,
    });
  }
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/admin/products/${productId}/subs`);
  revalidatePath("/shop");
  return { info: "Sub-product saved." };
}

export async function upsertCapacityAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await guard();
  const subProductId = String(formData.get("subProductId") || "");
  const shipDate = String(formData.get("shipDate") || "");
  const maxOrders = Number(formData.get("maxOrders") || 0);
  const isOpen = formData.get("isOpen") === "on";
  if (!subProductId || !/^\d{4}-\d{2}-\d{2}$/.test(shipDate) || maxOrders < 1) {
    return { error: "Need sub-product, date, and max orders ≥ 1." };
  }

  const db = await getDb();
  const [existing] = await db
    .select()
    .from(capacitySlots)
    .where(
      and(
        eq(capacitySlots.subProductId, subProductId),
        eq(capacitySlots.shipDate, shipDate),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(capacitySlots)
      .set({ maxOrders, isOpen, updatedAt: new Date() })
      .where(eq(capacitySlots.id, existing.id));
  } else {
    await db.insert(capacitySlots).values({
      subProductId,
      shipDate,
      maxOrders,
      isOpen,
    });
  }
  revalidatePath("/admin/capacity");
  return { info: "Capacity slot saved." };
}

export async function updateOrderStatusAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await guard();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  const adminNotes = String(formData.get("adminNotes") || "");
  const allowed = new Set([
    "pending_payment_review",
    "confirmed",
    "rejected",
    "cancelled",
    "done",
  ]);
  if (!id || !allowed.has(status)) return { error: "Invalid status update." };

  const db = await getDb();
  await db
    .update(orders)
    .set({
      status: status as
        | "pending_payment_review"
        | "confirmed"
        | "rejected"
        | "cancelled"
        | "done",
      adminNotes: adminNotes || null,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, id));
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return { info: `Order marked ${status}.` };
}

export async function saveTngQrAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await guard();
  const tngQrKey = String(formData.get("tngQrKey") || "").trim();
  if (!tngQrKey) return { error: "Provide an R2 object key for the TnG QR." };

  const db = await getDb();
  const [existing] = await db.select().from(paymentSettings).limit(1);
  if (existing) {
    await db
      .update(paymentSettings)
      .set({
        tngQrKey,
        updatedAt: new Date(),
        updatedBy: session.adminId,
      })
      .where(eq(paymentSettings.id, existing.id));
  } else {
    await db.insert(paymentSettings).values({
      id: 1,
      tngQrKey,
      updatedBy: session.adminId,
    });
  }
  revalidatePath("/admin/payments/qr");
  return { info: "TnG QR key saved." };
}
