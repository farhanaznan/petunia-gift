import { and, asc, eq, gte } from "drizzle-orm";
import { getDb, tryGetDb } from "@/lib/db";
import {
  capacitySlots,
  products,
  subProductImages,
  subProducts,
} from "@/lib/db/schema";
import type { ProductNature, SubProductConfig } from "@/lib/natures/types";

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  nature: ProductNature;
  badgeText: string | null;
  heroImageKey: string | null;
};

export type CatalogSubProduct = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  description: string;
  priceSen: number;
  badgeText: string | null;
  config: SubProductConfig;
};

export async function listActiveProducts(): Promise<CatalogProduct[]> {
  const db = await tryGetDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(asc(products.sortOrder), asc(products.name));
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    nature: r.nature,
    badgeText: r.badgeText,
    heroImageKey: r.heroImageKey,
  }));
}

export async function getProductBySlug(
  slug: string,
): Promise<CatalogProduct | null> {
  const db = await tryGetDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.isActive, true)))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    nature: row.nature,
    badgeText: row.badgeText,
    heroImageKey: row.heroImageKey,
  };
}

export async function listSubsForProduct(
  productId: string,
): Promise<CatalogSubProduct[]> {
  const db = await tryGetDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(subProducts)
    .where(and(eq(subProducts.productId, productId), eq(subProducts.isActive, true)))
    .orderBy(asc(subProducts.sortOrder), asc(subProducts.name));
  return rows.map((r) => ({
    id: r.id,
    productId: r.productId,
    slug: r.slug,
    name: r.name,
    description: r.description,
    priceSen: r.priceSen,
    badgeText: r.badgeText,
    config: r.config as SubProductConfig,
  }));
}

export async function getSubBySlugs(
  productSlug: string,
  subSlug: string,
): Promise<{ product: CatalogProduct; sub: CatalogSubProduct } | null> {
  const product = await getProductBySlug(productSlug);
  if (!product) return null;
  const db = await tryGetDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(subProducts)
    .where(
      and(
        eq(subProducts.productId, product.id),
        eq(subProducts.slug, subSlug),
        eq(subProducts.isActive, true),
      ),
    )
    .limit(1);
  if (!row) return null;
  return {
    product,
    sub: {
      id: row.id,
      productId: row.productId,
      slug: row.slug,
      name: row.name,
      description: row.description,
      priceSen: row.priceSen,
      badgeText: row.badgeText,
      config: row.config as SubProductConfig,
    },
  };
}

export async function listOpenCapacityDates(subProductId: string) {
  const db = await tryGetDb();
  if (!db) return [] as { shipDate: string; maxOrders: number; id: string }[];
  const today = new Date().toISOString().slice(0, 10);
  const rows = await db
    .select()
    .from(capacitySlots)
    .where(
      and(
        eq(capacitySlots.subProductId, subProductId),
        eq(capacitySlots.isOpen, true),
        gte(capacitySlots.shipDate, today),
      ),
    )
    .orderBy(asc(capacitySlots.shipDate));
  return rows.map((r) => ({
    id: r.id,
    shipDate: r.shipDate,
    maxOrders: r.maxOrders,
  }));
}

export async function listSubImages(subProductId: string) {
  const db = await getDb();
  return db
    .select()
    .from(subProductImages)
    .where(eq(subProductImages.subProductId, subProductId))
    .orderBy(asc(subProductImages.sortOrder));
}
