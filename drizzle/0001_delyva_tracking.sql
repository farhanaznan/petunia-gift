ALTER TABLE "orders" ADD COLUMN "delyva_order_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tracking_number" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delyva_tracking_no" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delyva_service_code" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delyva_status_code" integer;--> statement-breakpoint
CREATE INDEX "orders_delyva_order_idx" ON "orders" USING btree ("delyva_order_id");--> statement-breakpoint
CREATE INDEX "orders_tracking_number_idx" ON "orders" USING btree ("tracking_number");
