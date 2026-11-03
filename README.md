# Petunia Gift

Malaysia-only handmade gift storefront + admin (MVP scaffold).

**Locked v1 decisions:** English only · Touch ’n Go QR + receipt upload · soft-launch first · Cloudflare OpenNext + Neon + Hyperdrive + R2 for all media (no blobs in Postgres).

Product natures: `museum_of_us` · `f1_pick_and_go` · `graduation_lego_frame`.

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js App Router + TypeScript |
| Deploy | Cloudflare Workers via `@opennextjs/cloudflare` |
| DB | Neon Postgres through Cloudflare Hyperdrive |
| ORM | Drizzle (`src/lib/db/schema.ts`) |
| Media | Cloudflare R2 (`MEDIA_BUCKET`) — keys only in Postgres |
| Admin auth | iron-session + bcryptjs against `admins` |
| Validation | Zod shared natures / Malaysia address |

## Quick start (local)

```bash
npm install
# Auth + link (once): neon login   OR   export NEON_API_KEY=…
neon init -y --org-id <org> --project-id <project> --branch production --services postgres
neon deploy                  # writes DATABASE_URL* into .env.local (gitignored)
# also set SESSION_SECRET (+ optional ADMIN_SEED_*) in .env.local
npm run db:push              # uses DATABASE_URL_UNPOOLED when present
npm run db:seed-admin        # first admin from ADMIN_SEED_*
npm run dev
```

Open `http://localhost:3000/admin/login`. DB probe: `GET /api/health/db`.

App queries use **pooled** `DATABASE_URL` via `@neondatabase/serverless` + Drizzle. Migrations use **direct** `DATABASE_URL_UNPOOLED`. Workers later: Hyperdrive + `pg`.

## Admin auth

- **Login:** `/admin/login` — email/password → iron-session cookie `petunia_admin_session`
- **Gate:** middleware protects all `/admin/*` except `/admin/login`
- **Seed options:**
  1. `npm run db:seed-admin` with `DATABASE_URL` + `ADMIN_SEED_EMAIL` + `ADMIN_SEED_PASSWORD`
  2. On the login page, **Seed first admin from env** (only if `admins` is empty and those env vars are set on the Worker / `.env.local`)
- **Logout:** button in admin nav

## Deploy path (Cloudflare)

### A) Shell-only staging (no DB yet)

Current `wrangler.jsonc` omits Hyperdrive + R2 so route shells keep deploying.

```bash
npx wrangler login   # or CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID
npm run deploy
```

URL shape: `https://petunia-gift.<subdomain>.workers.dev`  
Admin login will show “Database is not configured” until Neon/Hyperdrive (or `DATABASE_URL` secret) is wired.

### B) Enable real admin login on staging

**1. Neon**

1. [console.neon.tech](https://console.neon.tech) → New project → copy the connection string (`postgresql://…?sslmode=require`).
2. Locally:

```bash
export DATABASE_URL='postgresql://…'
npm run db:push
export ADMIN_SEED_EMAIL='you@example.com'
export ADMIN_SEED_PASSWORD='your-strong-password'
npm run db:seed-admin
```

**2. Hyperdrive**

Staging already uses Hyperdrive config id `9c36d08dbfe9498c868173af5a726a16` (`petunia-gift-neon`) in `wrangler.jsonc`.

To recreate elsewhere:

```bash
npx wrangler hyperdrive create petunia-gift-neon \
  --connection-string "$DATABASE_URL_UNPOOLED"
```

Put the printed id into `wrangler.jsonc` `hyperdrive[0].id`.

**3. Secrets**

```bash
npx wrangler secret put SESSION_SECRET          # min 32 chars
npx wrangler secret put DELYVA_API_KEY          # Delyva access token (never commit)
# optional if seeding from the login button on Workers:
npx wrangler secret put ADMIN_SEED_EMAIL
npx wrangler secret put ADMIN_SEED_PASSWORD
# optional bridge without Hyperdrive yet:
# npx wrangler secret put DATABASE_URL
```

Courier integration uses Delyva with **Shopee Express (SPX)** only, **1 kg** per gift order. Admin confirm creates/processes the shipment and stores the consignment number; customers track via the SPX tracker on `/order/status/[token]`.

**4. R2 (media — not required for login)**

1. R2 → Create bucket `petunia-gift-media`
2. Uncomment `r2_buckets` / `MEDIA_BUCKET` in `wrangler.jsonc`

**5. Redeploy**

```bash
npm run deploy
```

Then open `https://petunia-gift.<subdomain>.workers.dev/admin/login` and sign in with the seeded admin.

Do **not** cut over `petunia-gift.com` until approved.

## R2 layout

```text
products/{productId}/hero/{filename}
products/{productId}/subs/{subProductId}/{filename}
products/graduation/variants/{variant}.png
customer/{orderId}/{uuid}.{ext}
receipts/{orderId}/{uuid}.{ext}
payments/tng-qr/{version}.{ext}
```

## Route map

**Storefront:** `/` · `/shop` · `/shop/[productSlug]` · `/shop/[productSlug]/[subSlug]` · `/order` · `/order/pay` · `/order/thanks` · `/order/status/[token]` · `/about` · `/faq` · `/contact` · `/legal/*`

**Admin:** `/admin/login` (public) · gated `/admin` · `/admin/orders` · `/admin/products` · `/admin/capacity` · `/admin/payments/qr` · `/admin/settings`

## What’s in

- Phase 0 scaffold + OpenNext / Wrangler
- Drizzle schema + `drizzle/0000_init.sql`
- Working admin login gate + seed path
- Nature registry + R2 helpers + storefront/admin shells

## Phase 1 storefront + admin

```bash
npm run db:seed-catalog   # Museum / F1 / Graduation + capacity dates
```

Live paths: shop from DB · nature customizers · MY checkout + capacity hold · TnG pay + receipt key · admin products/subs/capacity/orders/QR.

R2 browser upload: `POST /api/uploads/presign` (needs R2 secrets + bucket `petunia-gift-media`). Until then, paste storage keys in forms.

## Repo

https://github.com/farhanaznan/petunia-gift

