"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { AdminActionState } from "@/lib/admin/catalog-actions";
import { requireAdminSession } from "@/lib/auth/session";
import { DelyvaError } from "@/lib/delyva/client";
import {
  cancelDelyvaShipment,
  createAndConfirmDelyvaShipment,
  processExistingDelyvaShipment,
  syncDelyvaOrderDetails,
} from "@/lib/delyva/fulfillment";
import { getDb } from "@/lib/db";
import { orders } from "@/lib/db/schema";

async function guard() {
  const session = await requireAdminSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

function fail(err: unknown): AdminActionState {
  if (err instanceof DelyvaError) {
    return { error: `Delyva: ${err.message}` };
  }
  if (err instanceof Error) return { error: err.message };
  return { error: "Unexpected Delyva error." };
}

function revalidateOrder(id: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function confirmOrderWithDelyvaAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await guard();
  const id = String(formData.get("id") || "");
  const adminNotes = String(formData.get("adminNotes") || "");
  if (!id) return { error: "Missing order id." };

  try {
    const result = await createAndConfirmDelyvaShipment(id);
    if (adminNotes.trim()) {
      const db = await getDb();
      await db
        .update(orders)
        .set({ adminNotes: adminNotes.trim(), updatedAt: new Date() })
        .where(eq(orders.id, id));
    }
    revalidateOrder(id);
    return { info: result.info };
  } catch (err) {
    return fail(err);
  }
}

export async function processDelyvaOrderAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await guard();
  const id = String(formData.get("id") || "");
  if (!id) return { error: "Missing order id." };
  try {
    const result = await processExistingDelyvaShipment(id);
    revalidateOrder(id);
    return { info: `Processed. ${result.info}` };
  } catch (err) {
    return fail(err);
  }
}

export async function refreshDelyvaDetailsAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await guard();
  const id = String(formData.get("id") || "");
  if (!id) return { error: "Missing order id." };
  try {
    const result = await syncDelyvaOrderDetails(id);
    revalidateOrder(id);
    return { info: result.info };
  } catch (err) {
    return fail(err);
  }
}

export async function cancelDelyvaOrderAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await guard();
  const id = String(formData.get("id") || "");
  if (!id) return { error: "Missing order id." };
  try {
    const result = await cancelDelyvaShipment(id);
    revalidateOrder(id);
    return { info: result.info };
  } catch (err) {
    return fail(err);
  }
}
