import { and, count, eq, gte, sql } from "drizzle-orm";
import { tryGetDb } from "@/lib/db";
import { capacitySlots, orders } from "@/lib/db/schema";

export type OpenCapacityDate = {
  id: string;
  shipDate: string;
  maxOrders: number;
  used: number;
  remaining: number;
};

export async function listOpenCapacityWithRemaining(
  subProductId: string,
): Promise<OpenCapacityDate[]> {
  const db = await tryGetDb();
  if (!db) return [];
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
    const [active] = await db
      .select({ value: count() })
      .from(orders)
      .where(
        and(
          eq(orders.subProductId, subProductId),
          eq(orders.shipDate, slot.shipDate),
          sql`${orders.status} in ('draft_hold','pending_payment_review','confirmed','done')`,
        ),
      );
    const used = active?.value ?? 0;
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
