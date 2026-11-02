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
| Admin auth | iron-session + bcryptjs (stub UI + helpers) |
| Validation | Zod shared natures / Malaysia address |

## Quick start (local)

```bash
cp .env.example .env.local
npm install
npm run dev
```

Optional:

```bash
npm run typecheck
npm run db:generate   # needs DATABASE_URL
npm run preview       # OpenNext build + Wrangler preview
```

## Deploy path (Cloudflare)

### Shell-only staging (current `wrangler.jsonc`)

Hyperdrive + R2 bindings are **omitted** so route shells can deploy without Neon/R2.

```bash
npx wrangler login   # or CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID
npm run deploy
```

Expect `https://petunia-gift.<subdomain>.workers.dev`. No live catalog, checkout, or media until full bindings return.

### Full soft-launch (Neon + R2)

1. Create **Neon** database; copy connection string into `.env` / Hyperdrive origin.
2. Create **Hyperdrive** → put id in `wrangler.jsonc` `hyperdrive` binding.
3. Create private **R2** bucket `petunia-gift-media` → `MEDIA_BUCKET` binding.
4. Optional R2 S3 API tokens for browser **presigned** uploads (`R2_*` secrets).
5. Set Worker secrets: `SESSION_SECRET`, optional `ADMIN_SEED_*`.
6. `npm run deploy`

Do **not** cut over `petunia-gift.com` until approved.

## R2 layout

All media in `petunia-gift-media` (private). Postgres stores keys + metadata only.

```text
products/{productId}/hero/{filename}
products/{productId}/subs/{subProductId}/{filename}
products/graduation/variants/{variant}.png
customer/{orderId}/{uuid}.{ext}          # private customization photos
receipts/{orderId}/{uuid}.{ext}          # private payment proof
payments/tng-qr/{version}.{ext}          # singleton shared TnG QR (versioned)
```

Helpers: `src/lib/r2/keys.ts`, `src/lib/r2/client.ts`, `src/lib/r2/signed-url.ts`.

## Route shells

**Storefront:** `/` · `/shop` · `/shop/[productSlug]` · `/shop/[productSlug]/[subSlug]` · `/order` · `/order/pay` · `/order/thanks` · `/order/status/[token]` · `/about` · `/faq` · `/contact` · `/legal/privacy` · `/legal/terms`

**Admin:** `/admin/login` · `/admin` · `/admin/orders` · `/admin/orders/[id]` · `/admin/products` · `/admin/products/[id]` · `/admin/products/[id]/subs` · `/admin/capacity` · `/admin/payments/qr` · `/admin/settings`

## What’s in this scaffold (Phase 0)

- Cloudflare-ready Next.js app + OpenNext / Wrangler config
- Drizzle schema for products, capacity, orders, media keys, payment settings, audit
- Nature registry for the three locked product types
- Admin session/password helpers (login UI stub)
- R2 key helpers + binding + presign stubs
- Storefront + admin route shells (EN)
- `.env.example` + this README

## Next (Phase 1)

- Seed admin + catalog (Museum / F1 / Graduation)
- Wire DB client in Server Actions / Route Handlers via Hyperdrive
- Typed customizers + checkout (capacity hold, MY address, TnG + receipt)
- Admin CRUD, capacity calendar, receipt confirm/reject
- Real auth gate on `/admin/*`

## Repo

https://github.com/farhanaznan/petunia-gift
