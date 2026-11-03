/**
 * Seed MVP catalog (Museum / F1 / Graduation) + sample capacity slots.
 *
 *   export DATABASE_URL=…   # or source .env.local
 *   npm run db:seed-catalog
 */
import { eq } from "drizzle-orm";
import {
  getDbFromConnectionString,
  getDbFromDatabaseUrl,
} from "../src/lib/db/client";
import {
  capacitySlots,
  products,
  subProducts,
} from "../src/lib/db/schema";
import type { SubProductConfig } from "../src/lib/natures/types";
import { natureRegistry } from "../src/lib/natures/registry";

function dbFromEnv() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error("Missing DATABASE_URL");
  return url.includes("neon.tech")
    ? getDbFromDatabaseUrl(url)
    : getDbFromConnectionString(url);
}

type SeedSub = {
  slug: string;
  name: string;
  priceSen: number;
  badgeText?: string;
  config: SubProductConfig;
  sortOrder: number;
};

type SeedProduct = {
  slug: string;
  name: string;
  description: string;
  nature: "museum_of_us" | "f1_pick_and_go" | "graduation_lego_frame";
  badgeText?: string;
  sortOrder: number;
  subs: SeedSub[];
};

const museumConfig = (minImages: number): SubProductConfig => ({
  minImages,
  titleMaxChars: 20,
  messageMaxWords: 50,
  requireTitle: true,
  requireMessage: true,
});

const catalog: SeedProduct[] = [
  {
    slug: "museum-of-us",
    name: "Museum of Us",
    description: "Personalised museum-style frames with your photos and words.",
    nature: "museum_of_us",
    sortOrder: 10,
    subs: [
      { slug: "museum-convo", name: "Museum Convo", priceSen: 5000, config: museumConfig(1), sortOrder: 1 },
      { slug: "whimsy", name: "Whimsy", priceSen: 6500, config: museumConfig(3), sortOrder: 2 },
      { slug: "mary-jane", name: "Mary Jane", priceSen: 8000, config: museumConfig(5), sortOrder: 3 },
      { slug: "ophelia", name: "Ophelia", priceSen: 8000, config: museumConfig(5), sortOrder: 4 },
      { slug: "bridgerton-pink", name: "Bridgerton Pink", priceSen: 10000, config: museumConfig(5), sortOrder: 5 },
      { slug: "bridgerton-green", name: "Bridgerton Green", priceSen: 10000, config: museumConfig(5), sortOrder: 6 },
    ],
  },
  {
    slug: "f1-collectibles",
    name: "F1 Collectibles",
    description: "Pick-and-go F1 stand and coaster — no customisation needed.",
    nature: "f1_pick_and_go",
    sortOrder: 20,
    subs: [
      { slug: "f1-stand", name: "F1 Stand", priceSen: 4000, config: { includedCopy: "F1 stand collectible" }, sortOrder: 1 },
      { slug: "f1-coaster", name: "F1 Coaster", priceSen: 1500, config: { includedCopy: "F1 coaster" }, sortOrder: 2 },
    ],
  },
  {
    slug: "f1-sepang-frames",
    name: "F1 Sepang Frames",
    description: "Team Sepang frames — ready to gift.",
    nature: "f1_pick_and_go",
    sortOrder: 30,
    subs: [
      { slug: "red-bull", name: "Design Red Bull", priceSen: 12000, badgeText: "HOT!", config: {}, sortOrder: 1 },
      { slug: "ferrari", name: "Ferrari F1", priceSen: 14000, badgeText: "HOT", config: {}, sortOrder: 2 },
      { slug: "mclaren", name: "McLaren F1", priceSen: 13000, config: {}, sortOrder: 3 },
      { slug: "mercedes", name: "Mercedes F1", priceSen: 13000, badgeText: "Hot", config: {}, sortOrder: 4 },
      { slug: "kimi-antonelli", name: "Mercedes Kimi Antonelli edition", priceSen: 14000, badgeText: "Limited Edition", config: {}, sortOrder: 5 },
    ],
  },
  {
    slug: "graduation-lego-frame",
    name: "Graduation Lego Frame",
    description: "Choose a Lego graduate variant; optional photo (+RM5).",
    nature: "graduation_lego_frame",
    sortOrder: 40,
    subs: [
      {
        slug: "standard",
        name: "Graduation Lego Frame",
        priceSen: 12000,
        sortOrder: 1,
        config: natureRegistry.graduation_lego_frame.defaultConfig(),
      },
    ],
  },
];

async function main() {
  const db = dbFromEnv();
  let productsCreated = 0;
  let subsCreated = 0;

  for (const item of catalog) {
    const existing = await db
      .select()
      .from(products)
      .where(eq(products.slug, item.slug))
      .limit(1);

    let productId = existing[0]?.id;
    if (!productId) {
      const [row] = await db
        .insert(products)
        .values({
          slug: item.slug,
          name: item.name,
          description: item.description,
          nature: item.nature,
          badgeText: item.badgeText,
          sortOrder: item.sortOrder,
          isActive: true,
        })
        .returning();
      productId = row.id;
      productsCreated += 1;
      console.log(`+ product ${item.slug}`);
    } else {
      console.log(`= product ${item.slug} exists`);
    }

    for (const sub of item.subs) {
      const found = await db
        .select()
        .from(subProducts)
        .where(eq(subProducts.slug, sub.slug));
      const match = found.find((s) => s.productId === productId);
      if (match) {
        console.log(`  = sub ${sub.slug}`);
        continue;
      }
      const [created] = await db
        .insert(subProducts)
        .values({
          productId,
          slug: sub.slug,
          name: sub.name,
          priceSen: sub.priceSen,
          badgeText: sub.badgeText,
          config: sub.config,
          sortOrder: sub.sortOrder,
          isActive: true,
        })
        .returning();
      subsCreated += 1;
      console.log(`  + sub ${sub.slug}`);

      // Seed ~7 open capacity days starting tomorrow
      const today = new Date();
      for (let i = 1; i <= 7; i += 1) {
        const d = new Date(today);
        d.setUTCDate(today.getUTCDate() + i);
        const shipDate = d.toISOString().slice(0, 10);
        try {
          await db.insert(capacitySlots).values({
            subProductId: created.id,
            shipDate,
            maxOrders: 10,
            isOpen: true,
          });
        } catch {
          // unique (sub_product_id, ship_date) — ignore duplicates on re-seed
        }
      }
    }
  }

  console.log(`Done. products+${productsCreated} subs+${subsCreated}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
