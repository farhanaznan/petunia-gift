import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import {
  cancelDelyvaOrder,
  createDelyvaOrder,
  DelyvaError,
  getDelyvaCustomer,
  getDelyvaOrderDetails,
  processDelyvaOrder,
  quoteSpxServiceCode,
  resolveTrackingNumber,
  type DelyvaContact,
  type DelyvaOrderDetails,
} from "@/lib/delyva/client";
import { DELYVA_SPX_SERVICE_CODE } from "@/lib/delyva/constants";
import { getDb } from "@/lib/db";
import { orders, products, subProducts } from "@/lib/db/schema";
import { getRuntimeEnv } from "@/lib/runtime-env";

const CREATE_LOCK = "create_in_progress";
const COURIER_SPX = "Shopee Express (SPX)";

function shipDateToSchedule(shipDate: string, hour: number): string {
  return `${shipDate}T${String(hour).padStart(2, "0")}:00:00+0800`;
}

async function originContactFromAccount(): Promise<DelyvaContact> {
  const env = await getRuntimeEnv();
  const customer = await getDelyvaCustomer();
  return {
    name: env.DELYVA_ORIGIN_NAME?.trim() || customer.name || "Petunia Gift",
    email: env.DELYVA_ORIGIN_EMAIL?.trim() || customer.email || undefined,
    phone: env.DELYVA_ORIGIN_PHONE?.trim() || customer.phone || "",
    address1:
      env.DELYVA_ORIGIN_ADDRESS1?.trim() || customer.address1 || "",
    address2:
      env.DELYVA_ORIGIN_ADDRESS2?.trim() || customer.address2 || undefined,
    city: env.DELYVA_ORIGIN_CITY?.trim() || customer.city || "",
    state: env.DELYVA_ORIGIN_STATE?.trim() || customer.state || "",
    postcode: env.DELYVA_ORIGIN_POSTCODE?.trim() || customer.postcode || "",
    country: env.DELYVA_ORIGIN_COUNTRY?.trim() || customer.country || "MY",
  };
}

function destinationFromOrder(order: typeof orders.$inferSelect): DelyvaContact {
  return {
    name: order.buyerName,
    email: order.email,
    phone: order.recipientPhone || order.customerPhone,
    address1: order.addressLine1,
    address2: order.addressLine2 ?? undefined,
    city: order.city,
    state: order.state,
    postcode: order.postcode,
    country: order.country || "MY",
  };
}

async function loadOrderBundle(orderId: string) {
  const db = await getDb();
  const [row] = await db
    .select({
      order: orders,
      productName: products.name,
      subName: subProducts.name,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .innerJoin(subProducts, eq(orders.subProductId, subProducts.id))
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!row) throw new Error("Order not found.");
  return row;
}

async function persistDelyvaFields(
  orderId: string,
  patch: Partial<{
    delyvaOrderId: string | null;
    trackingNumber: string | null;
    delyvaTrackingNo: string | null;
    delyvaServiceCode: string | null;
    delyvaStatusCode: number | null;
    delyvaCourier: string | null;
    delyvaLastError: string | null;
    status: typeof orders.$inferSelect.status;
    adminNotes: string | null;
  }>,
) {
  const db = await getDb();
  await db
    .update(orders)
    .set({
      ...patch,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));
}

function applyDetailsPatch(details: DelyvaOrderDetails, serviceCode?: string) {
  const tracking = resolveTrackingNumber(details);
  return {
    trackingNumber: tracking,
    delyvaTrackingNo:
      typeof details.trackingNo === "string" ? details.trackingNo : null,
    delyvaServiceCode:
      (typeof details.serviceCode === "string" && details.serviceCode) ||
      serviceCode ||
      null,
    delyvaStatusCode:
      typeof details.statusCode === "number" ? details.statusCode : null,
    delyvaCourier: COURIER_SPX,
  };
}

function alreadyLinked(order: typeof orders.$inferSelect): boolean {
  return Boolean(order.delyvaOrderId || order.trackingNumber);
}

async function returnExistingShipment(orderId: string) {
  const { order } = await loadOrderBundle(orderId);
  if (order.delyvaOrderId) {
    try {
      const details = await syncDelyvaOrderDetails(orderId);
      return {
        info: `Already linked to Delyva ${order.delyvaOrderId}${
          order.trackingNumber ? ` · tracking ${order.trackingNumber}` : ""
        }. Returned saved shipment (create skipped).`,
        details: details.details,
        skippedCreate: true as const,
      };
    } catch {
      return {
        info: `Already linked to Delyva ${order.delyvaOrderId}${
          order.trackingNumber ? ` · tracking ${order.trackingNumber}` : ""
        }. Create skipped.`,
        details: undefined,
        skippedCreate: true as const,
      };
    }
  }
  return {
    info: `Tracking ${order.trackingNumber} already saved — create skipped.`,
    details: undefined,
    skippedCreate: true as const,
  };
}

/**
 * Create a Shopee Express (SPX) shipment on Delyva for a Petunia order,
 * process it, and persist the tracking / consignment number.
 * Runs create at most once per order until cancel clears the link.
 */
export async function createAndConfirmDelyvaShipment(orderId: string) {
  const initial = await loadOrderBundle(orderId);
  if (alreadyLinked(initial.order)) {
    return returnExistingShipment(orderId);
  }

  const db = await getDb();
  // Claim create lock so concurrent confirms do not double-POST /order.
  const claimed = await db
    .update(orders)
    .set({
      delyvaLastError: CREATE_LOCK,
      delyvaCourier: COURIER_SPX,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(orders.id, orderId),
        isNull(orders.delyvaOrderId),
        isNull(orders.trackingNumber),
        sql`${orders.delyvaLastError} is distinct from ${CREATE_LOCK}`,
      ),
    )
    .returning();

  if (!claimed.length) {
    const again = await loadOrderBundle(orderId);
    if (alreadyLinked(again.order)) {
      return returnExistingShipment(orderId);
    }
    if (again.order.delyvaLastError === CREATE_LOCK) {
      return {
        info: "Delyva create already in progress for this order — create skipped.",
        details: undefined,
        skippedCreate: true as const,
      };
    }
    return returnExistingShipment(orderId);
  }

  const { order, productName, subName } = await loadOrderBundle(orderId);

  try {
    const customer = await getDelyvaCustomer();
    const origin = await originContactFromAccount();
    if (!origin.address1 || !origin.postcode || !origin.phone) {
      throw new Error(
        "Delyva origin address/phone incomplete. Update the Delyva customer profile or set DELYVA_ORIGIN_* env.",
      );
    }
    const destination = destinationFromOrder(order);
    const serviceCode = await quoteSpxServiceCode({
      customerId: customer.id,
      origin,
      destination,
    }).catch(() => DELYVA_SPX_SERVICE_CODE);

    const originScheduledAt = shipDateToSchedule(order.shipDate, 11);
    const destinationScheduledAt = shipDateToSchedule(order.shipDate, 17);

    // Re-check immediately before network create (another worker may have linked).
    const preCreate = await loadOrderBundle(orderId);
    if (alreadyLinked(preCreate.order)) {
      await persistDelyvaFields(orderId, { delyvaLastError: null });
      return returnExistingShipment(orderId);
    }

    let created: DelyvaOrderDetails;
    try {
      created = await createDelyvaOrder({
        customerId: customer.id,
        serviceCode,
        referenceNo: order.publicRef,
        process: false,
        note: `${productName} · ${subName}`,
        itemName: `${productName} — ${subName}`,
        priceSen: order.unitPriceSen + order.surchargeSen,
        origin: { ...origin, scheduledAt: originScheduledAt },
        destination: { ...destination, scheduledAt: destinationScheduledAt },
      });
    } catch (err) {
      // Duplicate / 400 on second create: do not invent a new shipment.
      const message =
        err instanceof DelyvaError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Create failed";
      const statusHint =
        err instanceof DelyvaError ? ` (code ${err.code ?? "n/a"})` : "";
      await persistDelyvaFields(orderId, {
        delyvaLastError: `create failed${statusHint}: ${message}`.slice(0, 500),
        delyvaCourier: COURIER_SPX,
      });
      throw new Error(
        `Delyva create failed${statusHint}: ${message}. Create was not retried. If a shipment already exists on Delyva for this ref, save its id via Get details after linking, or cancel and recreate.`,
      );
    }

    const delyvaOrderId = String(created.id);
    // Persist id immediately so any parallel confirm sees the link.
    await persistDelyvaFields(orderId, {
      delyvaOrderId,
      delyvaServiceCode: serviceCode,
      delyvaCourier: COURIER_SPX,
      delyvaStatusCode:
        typeof created.statusCode === "number" ? created.statusCode : null,
      delyvaLastError: null,
    });

    await processDelyvaOrder(delyvaOrderId, {
      serviceCode,
      originScheduledAt,
      destinationScheduledAt,
    });

    const details = await getDelyvaOrderDetails(delyvaOrderId);
    const patch = applyDetailsPatch(details, serviceCode);
    await persistDelyvaFields(orderId, {
      ...patch,
      delyvaLastError: null,
      status: "confirmed",
    });

    return {
      info: patch.trackingNumber
        ? `Confirmed on Delyva (SPX). Tracking ${patch.trackingNumber}.`
        : `Confirmed on Delyva (SPX). Order ${delyvaOrderId} — tracking pending; refresh details shortly.`,
      details,
      skippedCreate: false as const,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected Delyva error";
    // Keep lock cleared if we never got an id, so admin can retry after fixing.
    const current = await loadOrderBundle(orderId);
    if (!current.order.delyvaOrderId) {
      await persistDelyvaFields(orderId, {
        delyvaLastError: message.slice(0, 500),
        delyvaCourier: COURIER_SPX,
      });
    } else {
      await persistDelyvaFields(orderId, {
        delyvaLastError: message.slice(0, 500),
      });
    }
    throw err;
  }
}

export async function processExistingDelyvaShipment(orderId: string) {
  const { order } = await loadOrderBundle(orderId);
  if (!order.delyvaOrderId) {
    throw new Error("No Delyva shipment on this order yet. Confirm first.");
  }
  const serviceCode = order.delyvaServiceCode || DELYVA_SPX_SERVICE_CODE;
  const originScheduledAt = shipDateToSchedule(order.shipDate, 11);
  const destinationScheduledAt = shipDateToSchedule(order.shipDate, 17);
  try {
    await processDelyvaOrder(order.delyvaOrderId, {
      serviceCode,
      originScheduledAt,
      destinationScheduledAt,
    });
    await persistDelyvaFields(orderId, { delyvaLastError: null });
    return syncDelyvaOrderDetails(orderId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Process failed";
    await persistDelyvaFields(orderId, {
      delyvaLastError: message.slice(0, 500),
    });
    throw err;
  }
}

export async function syncDelyvaOrderDetails(orderId: string) {
  const { order } = await loadOrderBundle(orderId);
  if (!order.delyvaOrderId) {
    throw new Error("No Delyva shipment on this order yet.");
  }
  try {
    const details = await getDelyvaOrderDetails(order.delyvaOrderId);
    const patch = applyDetailsPatch(
      details,
      order.delyvaServiceCode ?? undefined,
    );
    await persistDelyvaFields(orderId, {
      ...patch,
      delyvaLastError: null,
    });
    return {
      info: patch.trackingNumber
        ? `Tracking ${patch.trackingNumber} (status ${patch.delyvaStatusCode ?? "n/a"}).`
        : `Delyva status ${patch.delyvaStatusCode ?? "n/a"} — consignment not issued yet.`,
      details,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Details failed";
    await persistDelyvaFields(orderId, {
      delyvaLastError: message.slice(0, 500),
    });
    throw err;
  }
}

/** Cancel on Delyva and clear the local link so a later confirm may create again. */
export async function cancelDelyvaShipment(orderId: string) {
  const { order } = await loadOrderBundle(orderId);
  if (!order.delyvaOrderId) {
    throw new Error("No Delyva shipment to cancel.");
  }
  try {
    await cancelDelyvaOrder(order.delyvaOrderId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cancel failed";
    await persistDelyvaFields(orderId, {
      delyvaLastError: message.slice(0, 500),
    });
    throw err;
  }

  await persistDelyvaFields(orderId, {
    delyvaOrderId: null,
    trackingNumber: null,
    delyvaTrackingNo: null,
    delyvaServiceCode: null,
    delyvaStatusCode: null,
    delyvaCourier: null,
    delyvaLastError: null,
    status: "cancelled",
  });

  return {
    info: "Delyva shipment cancelled and local link cleared — confirm may create again.",
    details: undefined,
  };
}

export async function listDelyvaOrderIdsForPetuniaOrders(
  orderIds: string[],
): Promise<{ orderId: string; delyvaOrderId: string; publicRef: string }[]> {
  if (!orderIds.length) return [];
  const db = await getDb();
  const rows = await db
    .select({
      orderId: orders.id,
      delyvaOrderId: orders.delyvaOrderId,
      publicRef: orders.publicRef,
    })
    .from(orders)
    .where(inArray(orders.id, orderIds));
  return rows
    .filter((r): r is typeof r & { delyvaOrderId: string } =>
      Boolean(r.delyvaOrderId),
    )
    .map((r) => ({
      orderId: r.orderId,
      delyvaOrderId: r.delyvaOrderId!,
      publicRef: r.publicRef,
    }));
}
