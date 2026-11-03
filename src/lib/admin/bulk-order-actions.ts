"use server";

import { inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { AdminActionState } from "@/lib/admin/catalog-actions";
import { requireAdminSession } from "@/lib/auth/session";
import { DelyvaError } from "@/lib/delyva/client";
import { createAndConfirmDelyvaShipment } from "@/lib/delyva/fulfillment";
import { getDb } from "@/lib/db";
import { orders } from "@/lib/db/schema";

async function guard() {
  const session = await requireAdminSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

function parseIds(formData: FormData): string[] {
  const raw = formData.getAll("orderIds");
  const ids = raw
    .flatMap((v) => String(v).split(","))
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set(ids)];
}

export async function bulkConfirmOrdersAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await guard();
  const ids = parseIds(formData);
  if (!ids.length) return { error: "Select at least one order." };

  const ok: string[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];

  for (const id of ids) {
    try {
      const result = await createAndConfirmDelyvaShipment(id);
      if (result.skippedCreate) skipped.push(id);
      else ok.push(id);
    } catch (err) {
      const message =
        err instanceof DelyvaError
          ? err.message
          : err instanceof Error
            ? err.message
            : "failed";
      failed.push(`${id.slice(0, 8)}… ${message}`);
    }
  }

  revalidatePath("/admin/orders");
  const parts = [
    ok.length ? `Confirmed ${ok.length}` : null,
    skipped.length ? `skipped create ${skipped.length} (already linked)` : null,
    failed.length ? `failed ${failed.length}: ${failed.slice(0, 3).join("; ")}` : null,
  ].filter(Boolean);
  if (failed.length && !ok.length && !skipped.length) {
    return { error: parts.join(" · ") };
  }
  return { info: parts.join(" · ") || "No changes." };
}

export async function bulkRejectOrdersAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await guard();
  const ids = parseIds(formData);
  if (!ids.length) return { error: "Select at least one order." };

  const db = await getDb();
  await db
    .update(orders)
    .set({
      status: "rejected",
      updatedAt: new Date(),
    })
    .where(inArray(orders.id, ids));

  revalidatePath("/admin/orders");
  return { info: `Marked ${ids.length} order(s) rejected.` };
}
