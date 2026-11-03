import { eq } from "drizzle-orm";
import {
  cancelDelyvaOrder,
  createDelyvaOrder,
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

function shipDateToSchedule(shipDate: string, hour: number): string {
  // Malaysia +08:00
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
  };
}

/**
 * Create a Shopee Express (SPX) shipment on Delyva for a Petunia order,
 * process it, and persist the tracking / consignment number.
 */
export async function createAndConfirmDelyvaShipment(orderId: string) {
  const { order, productName, subName } = await loadOrderBundle(orderId);
  if (order.delyvaOrderId) {
    const details = await syncDelyvaOrderDetails(orderId);
    return {
      info: `Delyva shipment already linked (${order.delyvaOrderId}). Tracking refreshed.`,
      details,
    };
  }

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

  const created = await createDelyvaOrder({
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

  const delyvaOrderId = String(created.id);
  await persistDelyvaFields(orderId, {
    delyvaOrderId,
    delyvaServiceCode: serviceCode,
    delyvaStatusCode:
      typeof created.statusCode === "number" ? created.statusCode : null,
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
    status: "confirmed",
  });

  return {
    info: patch.trackingNumber
      ? `Confirmed on Delyva (SPX). Tracking ${patch.trackingNumber}.`
      : `Confirmed on Delyva (SPX). Order ${delyvaOrderId} — tracking pending; refresh details shortly.`,
    details,
  };
}

export async function processExistingDelyvaShipment(orderId: string) {
  const { order } = await loadOrderBundle(orderId);
  if (!order.delyvaOrderId) {
    throw new Error("No Delyva shipment on this order yet. Confirm first.");
  }
  const serviceCode = order.delyvaServiceCode || DELYVA_SPX_SERVICE_CODE;
  const originScheduledAt = shipDateToSchedule(order.shipDate, 11);
  const destinationScheduledAt = shipDateToSchedule(order.shipDate, 17);
  await processDelyvaOrder(order.delyvaOrderId, {
    serviceCode,
    originScheduledAt,
    destinationScheduledAt,
  });
  return syncDelyvaOrderDetails(orderId);
}

export async function syncDelyvaOrderDetails(orderId: string) {
  const { order } = await loadOrderBundle(orderId);
  if (!order.delyvaOrderId) {
    throw new Error("No Delyva shipment on this order yet.");
  }
  const details = await getDelyvaOrderDetails(order.delyvaOrderId);
  const patch = applyDetailsPatch(
    details,
    order.delyvaServiceCode ?? undefined,
  );
  await persistDelyvaFields(orderId, patch);
  return {
    info: patch.trackingNumber
      ? `Tracking ${patch.trackingNumber} (status ${patch.delyvaStatusCode ?? "n/a"}).`
      : `Delyva status ${patch.delyvaStatusCode ?? "n/a"} — consignment not issued yet.`,
    details,
  };
}

export async function cancelDelyvaShipment(orderId: string) {
  const { order } = await loadOrderBundle(orderId);
  if (!order.delyvaOrderId) {
    throw new Error("No Delyva shipment to cancel.");
  }
  const details = await cancelDelyvaOrder(order.delyvaOrderId);
  const patch = applyDetailsPatch(
    details,
    order.delyvaServiceCode ?? undefined,
  );
  await persistDelyvaFields(orderId, {
    ...patch,
    status: "cancelled",
  });
  return {
    info: `Delyva shipment cancelled${patch.trackingNumber ? ` (${patch.trackingNumber})` : ""}.`,
    details,
  };
}
