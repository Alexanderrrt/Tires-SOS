# Tires SOS Rescue — website

Next.js (App Router) marketing site for Tires SOS Rescue, a tire & auto shop
in San José, CA (tires, brakes, oil changes, batteries, rims, alignment).

**Stack:** Next.js 14 · React · plain CSS · Vercel (hosting) · Supabase
(stores editable quote pricing). The marketing pages are static; the quote
estimator (`/quote`) and admin panel (`/admin`) are the only dynamic parts.

## Run it

```bash
npm install
npm run dev   # http://localhost:3000
```

## Edit site content in ONE place

Open **`app/site.config.js`**:

- `SITE` — name, phone, address, map links, hours (per weekday, used to
  compute the live "Open now / Closed" badge), social links
- `SERVICES` — the service cards shown in the "What We Do" section
- `TESTIMONIALS` — the review quotes shown in "What Customers Say"
- `COPY` — every other bilingual (English/Spanish) UI string

Every text field that needs both languages is a `{ en: "...", es: "..." }`
object — the site's language toggle reads whichever one is active.

## Design system

Brand colors are the shop's real ones — **orange & black** (`--color-accent:
#f86000` in `app/globals.css`). Headings use Archivo Black, body uses Inter,
both self-hosted at build time via `next/font` (no runtime font requests).
All scroll/hover animations are pure CSS + a small IntersectionObserver
`Reveal` component (`app/components/Reveal.js`) and are fully disabled for
users with `prefers-reduced-motion`.

## Photos & Instagram

- **Owner's BMW M3 Competition** — `/public/owners-m3.jpg`, shown in the
  "Owner's Ride" section. Replace the file to update the photo.
- **Logo** — `/public/logo.jpg`, used in the header, footer and the social
  share image (`/public/og.png`).
- **Instagram reels** — the "From the Shop" section embeds the reels listed
  in `REELS` in `app/site.config.js`. Paste new reel permalinks there to
  rotate the featured content.

## Quote estimator + admin pricing

Customers get an instant estimate at **`/quote`**: they pick a vehicle type and
services and see a price range, then send it to the shop pre-filled over
WhatsApp. Prices "vary by model" via a per-vehicle-class multiplier and by
labor hours × rate — see the model in `lib/pricing.default.js` and the engine
in `lib/quote.js`.

The owner edits prices at **`/admin`** (no code):

1. In Supabase, run `db/pricing-schema.sql` once (creates + seeds the `pricing`
   table).
2. Set these env vars locally (`.env.local`) and in Vercel — see `.env.example`:
   - `ADMIN_PASSWORD` — the login password
   - `AUTH_SECRET` — random string (`openssl rand -base64 32`)
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — server-only (not NEXT_PUBLIC)
3. Confirm `SITE.whatsapp` in `app/site.config.js` is the shop's WhatsApp number.

Until Supabase is connected, the estimator runs on the built-in default prices
and the admin editor saves for the current session only. The default prices in
`lib/pricing.default.js` are starting points — the owner should set real numbers
in `/admin` (or you can edit that file).

## SEO

- `app/components/JsonLd.js` — schema.org `TireShop`/`AutoRepair` structured
  data (name, address, phone, hours, payment methods incl. Afterpay, social
  profiles) for Google local results.
- `app/robots.js` / `app/sitemap.js` — served at `/robots.txt` and
  `/sitemap.xml` automatically.
- `app/layout.js` — canonical URL, bilingual keywords, Open Graph + Twitter
  cards using `/public/og.png`.
- **IMPORTANT:** `SITE.url` in `app/site.config.js` is set to the default
  Vercel URL. Update it when a custom domain is attached, then also submit
  the sitemap in [Google Search Console](https://search.google.com/search-console)
  and create/claim the free **Google Business Profile** — for a local shop
  that matters more than anything on the site itself.

## Deploying to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the
   `alexanderrrt/tires-sos` GitHub repo.
2. Framework preset: Next.js (auto-detected). No environment variables are
   required.
3. Deploy. Every push to the connected branch will auto-deploy.
