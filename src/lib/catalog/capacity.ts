import { and, count, eq, gte, inArray, sql } from "drizzle-orm";
import { tryGetDb, getDb } from "@/lib/db";
import { capacitySlots, orders, products, subProducts } from "@/lib/db/schema";
import type { ProductNature } from "@/lib/natures/types";

const ACTIVE_ORDER_STATUSES = sql`${orders.status} in ('draft_hold','pending_payment_review','confirmed','done')`;

export type OpenCapacityDate = {
  id: string;
  shipDate: string;
  maxOrders: number;
  used: number;
  remaining: number;
};

/** Museum of Us shares one order pool across all frames for a ship date. */
export function usesSharedProductCapacity(nature: ProductNature): boolean {
  return nature === "museum_of_us";
}

async function listSubIdsForProduct(productId: string): Promise<string[]> {
  const db = await tryGetDb();
  if (!db) return [];
  const rows = await db
    .select({ id: subProducts.id })
    .from(subProducts)
    .where(eq(subProducts.productId, productId));
  return rows.map((r) => r.id);
}

async function countUsedOrders(opts: {
  nature: ProductNature;
  productId: string;
  subProductId: string;
  shipDate: string;
}): Promise<number> {
  const db = await tryGetDb();
  if (!db) return 0;

  if (usesSharedProductCapacity(opts.nature)) {
    const [active] = await db
      .select({ value: count() })
      .from(orders)
      .where(
        and(
          eq(orders.productId, opts.productId),
          eq(orders.shipDate, opts.shipDate),
          ACTIVE_ORDER_STATUSES,
        ),
      );
    return active?.value ?? 0;
  }

  const [active] = await db
    .select({ value: count() })
    .from(orders)
    .where(
      and(
        eq(orders.subProductId, opts.subProductId),
        eq(orders.shipDate, opts.shipDate),
        ACTIVE_ORDER_STATUSES,
      ),
    );
  return active?.value ?? 0;
}

/**
 * Open ship dates for a product (date-first checkout).
 * Museum: one shared pool per date across all frames.
 * Other natures: union of dates that still have remaining capacity on at least one sub.
 */
export async function listOpenShipDatesForProduct(
  productId: string,
  nature: ProductNature,
): Promise<OpenCapacityDate[]> {
  const db = await tryGetDb();
  if (!db) return [];
  const today = new Date().toISOString().slice(0, 10);
  const subIds = await listSubIdsForProduct(productId);
  if (!subIds.length) return [];

  const slots = await db
    .select()
    .from(capacitySlots)
    .where(
      and(
        inArray(capacitySlots.subProductId, subIds),
        eq(capacitySlots.isOpen, true),
        gte(capacitySlots.shipDate, today),
      ),
    )
    .orderBy(capacitySlots.shipDate);

  if (usesSharedProductCapacity(nature)) {
    const byDate = new Map<string, { id: string; maxOrders: number }>();
    for (const slot of slots) {
      const prev = byDate.get(slot.shipDate);
      if (!prev || slot.maxOrders > prev.maxOrders) {
        byDate.set(slot.shipDate, { id: slot.id, maxOrders: slot.maxOrders });
      }
    }
    const out: OpenCapacityDate[] = [];
    for (const [shipDate, meta] of byDate) {
      const used = await countUsedOrders({
        nature,
        productId,
        subProductId: subIds[0],
        shipDate,
      });
      const remaining = Math.max(0, meta.maxOrders - used);
      if (remaining > 0) {
        out.push({
          id: meta.id,
          shipDate,
          maxOrders: meta.maxOrders,
          used,
          remaining,
        });
      }
    }
    return out.sort((a, b) => a.shipDate.localeCompare(b.shipDate));
  }

  // Per-sub: expose dates that have remaining on any sub (max remaining shown).
  const byDate = new Map<string, OpenCapacityDate>();
  for (const slot of slots) {
    const used = await countUsedOrders({
      nature,
      productId,
      subProductId: slot.subProductId,
      shipDate: slot.shipDate,
    });
    const remaining = Math.max(0, slot.maxOrders - used);
    if (remaining <= 0) continue;
    const prev = byDate.get(slot.shipDate);
    if (!prev || remaining > prev.remaining) {
      byDate.set(slot.shipDate, {
        id: slot.id,
        shipDate: slot.shipDate,
        maxOrders: slot.maxOrders,
        used,
        remaining,
      });
    }
  }
  return [...byDate.values()].sort((a, b) => a.shipDate.localeCompare(b.shipDate));
}

/** Remaining capacity for a specific sub on a date (museum = product-wide pool). */
export async function getCapacityOnDate(opts: {
  nature: ProductNature;
  productId: string;
  subProductId: string;
  shipDate: string;
}): Promise<OpenCapacityDate | null> {
  const db = await tryGetDb();
  if (!db) return null;
  const today = new Date().toISOString().slice(0, 10);
  if (opts.shipDate < today) return null;

  if (usesSharedProductCapacity(opts.nature)) {
    const subIds = await listSubIdsForProduct(opts.productId);
    if (!subIds.length) return null;
    const slots = await db
      .select()
      .from(capacitySlots)
      .where(
        and(
          inArray(capacitySlots.subProductId, subIds),
          eq(capacitySlots.shipDate, opts.shipDate),
          eq(capacitySlots.isOpen, true),
        ),
      );
    if (!slots.length) return null;
    const maxOrders = Math.max(...slots.map((s) => s.maxOrders));
    const used = await countUsedOrders(opts);
    const remaining = Math.max(0, maxOrders - used);
    if (remaining <= 0) return null;
    return {
      id: slots[0].id,
      shipDate: opts.shipDate,
      maxOrders,
      used,
      remaining,
    };
  }

  const [slot] = await db
    .select()
    .from(capacitySlots)
    .where(
      and(
        eq(capacitySlots.subProductId, opts.subProductId),
        eq(capacitySlots.shipDate, opts.shipDate),
        eq(capacitySlots.isOpen, true),
      ),
    )
    .limit(1);
  if (!slot) return null;
  const used = await countUsedOrders(opts);
  const remaining = Math.max(0, slot.maxOrders - used);
  if (remaining <= 0) return null;
  return {
    id: slot.id,
    shipDate: slot.shipDate,
    maxOrders: slot.maxOrders,
    used,
    remaining,
  };
}

/** Which active sub-products still have capacity on this ship date. */
export async function listSubsWithCapacityOnDate(
  productId: string,
  nature: ProductNature,
  shipDate: string,
): Promise<{ subProductId: string; remaining: number }[]> {
  const db = await tryGetDb();
  if (!db) return [];
  const subs = await db
    .select()
    .from(subProducts)
    .where(and(eq(subProducts.productId, productId), eq(subProducts.isActive, true)));

  const out: { subProductId: string; remaining: number }[] = [];
  for (const sub of subs) {
    const cap = await getCapacityOnDate({
      nature,
      productId,
      subProductId: sub.id,
      shipDate,
    });
    if (cap && cap.remaining > 0) {
      out.push({ subProductId: sub.id, remaining: cap.remaining });
    }
  }
  return out;
}

/** @deprecated Prefer listOpenShipDatesForProduct / getCapacityOnDate */
export async function listOpenCapacityWithRemaining(
  subProductId: string,
): Promise<OpenCapacityDate[]> {
  const db = await tryGetDb();
  if (!db) return [];
  const [sub] = await db
    .select({
      id: subProducts.id,
      productId: subProducts.productId,
      nature: products.nature,
    })
    .from(subProducts)
    .innerJoin(products, eq(subProducts.productId, products.id))
    .where(eq(subProducts.id, subProductId))
    .limit(1);
  if (!sub) return [];

  if (usesSharedProductCapacity(sub.nature)) {
    return listOpenShipDatesForProduct(sub.productId, sub.nature);
  }

  const today = new Date().toISOString().slice(0, 10);
  const slots = await db
    .select()
    .from(capacitySlots)
    .where(
      and(
        eq(capacitySlots.subProductId, subProductId),
        eq(capacitySlots.isOpen, true),
        gte(capacitySlots.shipDate, today),
      ),
    )
    .orderBy(capacitySlots.shipDate);

  const out: OpenCapacityDate[] = [];
  for (const slot of slots) {
    const used = await countUsedOrders({
      nature: sub.nature,
      productId: sub.productId,
      subProductId,
      shipDate: slot.shipDate,
    });
    const remaining = Math.max(0, slot.maxOrders - used);
    if (remaining > 0) {
      out.push({
        id: slot.id,
        shipDate: slot.shipDate,
        maxOrders: slot.maxOrders,
        used,
        remaining,
      });
    }
  }
  return out;
}

/** Sync museum capacity to every frame under the product (shared pool). */
export async function syncMuseumCapacitySlots(opts: {
  productId: string;
  shipDate: string;
  maxOrders: number;
  isOpen: boolean;
}): Promise<void> {
  const db = await getDb();
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, opts.productId))
    .limit(1);
  if (!product || product.nature !== "museum_of_us") return;

  const siblings = await db
    .select({ id: subProducts.id })
    .from(subProducts)
    .where(eq(subProducts.productId, opts.productId));

  for (const sibling of siblings) {
    const [existing] = await db
      .select()
      .from(capacitySlots)
      .where(
        and(
          eq(capacitySlots.subProductId, sibling.id),
          eq(capacitySlots.shipDate, opts.shipDate),
        ),
      )
      .limit(1);
    if (existing) {
      await db
        .update(capacitySlots)
        .set({
          maxOrders: opts.maxOrders,
          isOpen: opts.isOpen,
          updatedAt: new Date(),
        })
        .where(eq(capacitySlots.id, existing.id));
    } else {
      await db.insert(capacitySlots).values({
        subProductId: sibling.id,
        shipDate: opts.shipDate,
        maxOrders: opts.maxOrders,
        isOpen: opts.isOpen,
      });
    }
  }
}
