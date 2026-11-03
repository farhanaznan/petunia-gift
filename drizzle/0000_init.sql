CREATE TYPE "public"."malaysia_state" AS ENUM('Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu', 'Kuala Lumpur', 'Putrajaya', 'Labuan');--> statement-breakpoint
CREATE TYPE "public"."order_media_kind" AS ENUM('customer_image', 'receipt', 'admin_product_image');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('draft_hold', 'pending_payment_review', 'confirmed', 'rejected', 'cancelled', 'expired_hold', 'done');--> statement-breakpoint
CREATE TYPE "public"."product_nature" AS ENUM('museum_of_us', 'f1_pick_and_go', 'graduation_lego_frame');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "capacity_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sub_product_id" uuid NOT NULL,
	"ship_date" date NOT NULL,
	"max_orders" integer NOT NULL,
	"is_open" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"kind" "order_media_kind" NOT NULL,
	"storage_key" text NOT NULL,
	"mime" text NOT NULL,
	"byte_size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_ref" text NOT NULL,
	"status" "order_status" DEFAULT 'draft_hold' NOT NULL,
	"product_id" uuid NOT NULL,
	"sub_product_id" uuid NOT NULL,
	"ship_date" date NOT NULL,
	"unit_price_sen" integer NOT NULL,
	"surcharge_sen" integer DEFAULT 0 NOT NULL,
	"shipping_fee_sen" integer DEFAULT 0 NOT NULL,
	"total_sen" integer NOT NULL,
	"buyer_name" text NOT NULL,
	"email" text NOT NULL,
	"recipient_phone" text NOT NULL,
	"customer_phone" text NOT NULL,
	"address_line1" text NOT NULL,
	"address_line2" text,
	"postcode" text NOT NULL,
	"city" text NOT NULL,
	"state" "malaysia_state" NOT NULL,
	"country" text DEFAULT 'MY' NOT NULL,
	"customization" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"receipt_key" text,
	"admin_notes" text,
	"status_token" text NOT NULL,
	"capacity_held_until" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"tng_qr_key" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"nature" "product_nature" NOT NULL,
	"hero_image_key" text,
	"badge_text" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sub_product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sub_product_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sub_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price_sen" integer NOT NULL,
	"badge_text" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capacity_slots" ADD CONSTRAINT "capacity_slots_sub_product_id_sub_products_id_fk" FOREIGN KEY ("sub_product_id") REFERENCES "public"."sub_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_media" ADD CONSTRAINT "order_media_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_sub_product_id_sub_products_id_fk" FOREIGN KEY ("sub_product_id") REFERENCES "public"."sub_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_settings" ADD CONSTRAINT "payment_settings_updated_by_admins_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_product_images" ADD CONSTRAINT "sub_product_images_sub_product_id_sub_products_id_fk" FOREIGN KEY ("sub_product_id") REFERENCES "public"."sub_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_products" ADD CONSTRAINT "sub_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admins_email_uidx" ON "admins" USING btree ("email");--> statement-breakpoint
CREATE INDEX "audit_events_created_idx" ON "audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "capacity_slots_sub_date_uidx" ON "capacity_slots" USING btree ("sub_product_id","ship_date");--> statement-breakpoint
CREATE INDEX "capacity_slots_open_date_idx" ON "capacity_slots" USING btree ("is_open","ship_date");--> statement-breakpoint
CREATE INDEX "order_media_order_kind_idx" ON "order_media" USING btree ("order_id","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_public_ref_uidx" ON "orders" USING btree ("public_ref");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_status_token_uidx" ON "orders" USING btree ("status_token");--> statement-breakpoint
CREATE INDEX "orders_status_created_idx" ON "orders" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "orders_ship_date_idx" ON "orders" USING btree ("ship_date");--> statement-breakpoint
CREATE INDEX "orders_sub_product_idx" ON "orders" USING btree ("sub_product_id");--> statement-breakpoint
CREATE INDEX "orders_email_idx" ON "orders" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_uidx" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "products_active_sort_idx" ON "products" USING btree ("is_active","sort_order");--> statement-breakpoint
CREATE INDEX "sub_product_images_sub_idx" ON "sub_product_images" USING btree ("sub_product_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "sub_products_product_slug_uidx" ON "sub_products" USING btree ("product_id","slug");--> statement-breakpoint
CREATE INDEX "sub_products_product_active_idx" ON "sub_products" USING btree ("product_id","is_active");