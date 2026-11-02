import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { OrderCustomization, ProductNature, SubProductConfig } from "@/lib/natures/types";

/** Money is integer sen (RM1.00 = 100). Timestamps UTC; display Asia/Kuala_Lumpur. */

export const productNatureEnum = pgEnum("product_nature", [
  "museum_of_us",
  "f1_pick_and_go",
  "graduation_lego_frame",
]);

/**
 * Soft-launch MVP statuses. Richer set (in_production / shipped / draft_hold)
 * can land in phase 2 — schema keeps room via text comments in README.
 */
export const orderStatusEnum = pgEnum("order_status", [
  "draft_hold",
  "pending_payment_review",
  "confirmed",
  "rejected",
  "cancelled",
  "expired_hold",
  "done",
]);

export const orderMediaKindEnum = pgEnum("order_media_kind", [
  "customer_image",
  "receipt",
  "admin_product_image",
]);

export const malaysiaStateEnum = pgEnum("malaysia_state", [
  "Johor",
  "Kedah",
  "Kelantan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Perak",
  "Perlis",
  "Pulau Pinang",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
  "Kuala Lumpur",
  "Putrajaya",
  "Labuan",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const admins = pgTable("admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  ...timestamps,
}, (t) => [uniqueIndex("admins_email_uidx").on(t.email)]);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    nature: productNatureEnum("nature").notNull().$type<ProductNature>(),
    heroImageKey: text("hero_image_key"),
    badgeText: text("badge_text"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("products_slug_uidx").on(t.slug),
    index("products_active_sort_idx").on(t.isActive, t.sortOrder),
  ],
);

export const subProducts = pgTable(
  "sub_products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    priceSen: integer("price_sen").notNull(),
    badgeText: text("badge_text"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    config: jsonb("config").notNull().$type<SubProductConfig>().default(sql`'{}'::jsonb`),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("sub_products_product_slug_uidx").on(t.productId, t.slug),
    index("sub_products_product_active_idx").on(t.productId, t.isActive),
  ],
);

export const subProductImages = pgTable(
  "sub_product_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    subProductId: uuid("sub_product_id")
      .notNull()
      .references(() => subProducts.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull(),
    alt: text("alt").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("sub_product_images_sub_idx").on(t.subProductId, t.sortOrder)],
);

export const capacitySlots = pgTable(
  "capacity_slots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    subProductId: uuid("sub_product_id")
      .notNull()
      .references(() => subProducts.id, { onDelete: "cascade" }),
    shipDate: date("ship_date").notNull(),
    maxOrders: integer("max_orders").notNull(),
    isOpen: boolean("is_open").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("capacity_slots_sub_date_uidx").on(t.subProductId, t.shipDate),
    index("capacity_slots_open_date_idx").on(t.isOpen, t.shipDate),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    publicRef: text("public_ref").notNull(),
    status: orderStatusEnum("status").notNull().default("draft_hold"),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    subProductId: uuid("sub_product_id")
      .notNull()
      .references(() => subProducts.id),
    shipDate: date("ship_date").notNull(),
    unitPriceSen: integer("unit_price_sen").notNull(),
    surchargeSen: integer("surcharge_sen").notNull().default(0),
    shippingFeeSen: integer("shipping_fee_sen").notNull().default(0),
    totalSen: integer("total_sen").notNull(),
    buyerName: text("buyer_name").notNull(),
    email: text("email").notNull(),
    recipientPhone: text("recipient_phone").notNull(),
    customerPhone: text("customer_phone").notNull(),
    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2"),
    postcode: text("postcode").notNull(),
    city: text("city").notNull(),
    state: malaysiaStateEnum("state").notNull(),
    country: text("country").notNull().default("MY"),
    customization: jsonb("customization")
      .notNull()
      .$type<OrderCustomization>()
      .default(sql`'{}'::jsonb`),
    receiptKey: text("receipt_key"),
    adminNotes: text("admin_notes"),
    statusToken: text("status_token").notNull(),
    capacityHeldUntil: timestamp("capacity_held_until", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("orders_public_ref_uidx").on(t.publicRef),
    uniqueIndex("orders_status_token_uidx").on(t.statusToken),
    index("orders_status_created_idx").on(t.status, t.createdAt),
    index("orders_ship_date_idx").on(t.shipDate),
    index("orders_sub_product_idx").on(t.subProductId),
    index("orders_email_idx").on(t.email),
  ],
);

export const orderMedia = pgTable(
  "order_media",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    kind: orderMediaKindEnum("kind").notNull(),
    storageKey: text("storage_key").notNull(),
    mime: text("mime").notNull(),
    byteSize: integer("byte_size").notNull(),
    ...timestamps,
  },
  (t) => [index("order_media_order_kind_idx").on(t.orderId, t.kind)],
);

/** Singleton shared TnG QR — one row; replace key to update all new pay sessions. */
export const paymentSettings = pgTable("payment_settings", {
  id: integer("id").primaryKey().default(1),
  tngQrKey: text("tng_qr_key"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid("updated_by").references(() => admins.id),
});

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminId: uuid("admin_id").references(() => admins.id),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    meta: jsonb("meta").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_events_created_idx").on(t.createdAt)],
);
