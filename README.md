# Tires SOS Rescue — website

Next.js (App Router) marketing site for Tires SOS Rescue, a tire & auto shop
in San José, CA. Fully bilingual (English/Spanish). Static marketing pages +
dynamic quote estimator + AI chat + admin console (pricing, leads,
appointments, Yelp lead auto-responder) + an internal ad-ops dashboard.

**Stack:** Next.js 14 · React 18 · plain CSS · Vercel (hosting) · Supabase (data) ·
Groq (AI chat + Yelp replies) · Gmail API (Yelp leads + all outbound email) ·
Clerk (internal `/dashboard` auth)

---

## AI — Read this first

This file is the single source of truth for understanding this project. Every
section below is relevant to AI agents working with this codebase.

---

## Quick start

```bash
npm install
npm run dev     # → http://localhost:3000
npm run build   # production build
npm run lint    # ESLint (config: eslint-config-next)
```

Node >= 18.17 required (`.nvmrc` locks to 20).

---

## File map — what lives where

```
.
├── app/                          # Next.js App Router pages & components
│   ├── layout.js                 # Root layout: fonts, metadata, LanguageProvider
│   ├── page.js                   # Homepage — assembles all section components
│   ├── globals.css               # THE ONLY CSS FILE (2905 lines, no Tailwind)
│   ├── site.config.js            # ALL bilingual content + business data
│   ├── robots.js / sitemap.js    # /robots.txt + /sitemap.xml generators
│   ├── components/
│   │   ├── Header.js             # Sticky nav + Open/Closed badge + lang toggle
│   │   ├── Hero.js               # Hero + alignment machine spotlight
│   │   ├── Marquee.js            # Infinite scrolling bilingual banner
│   │   ├── Services.js           # "What We Do" / "Lo Que Hacemos" card grid
│   │   ├── Gallery.js            # Instagram reels embed section
│   │   ├── Promos.js             # Deals: financing, loyalty card, driver program
│   │   ├── OwnersRide.js         # BMW M3 "Owner's Ride" section
│   │   ├── Location.js           # Google Maps + hours table + both addresses
│   │   ├── Reviews.js            # Testimonial cards
│   │   ├── Footer.js             # Logo + social links + rights
│   │   ├── BrandPopups.js        # Tire brand logos carousel overlay
│   │   ├── Icons.js              # 15 custom SVG icons (24×24, automotive)
│   │   ├── JsonLd.js             # schema.org structured data (TireShop)
│   │   └── Reveal.js             # IntersectionObserver scroll-reveal wrapper
│   ├── i18n/
│   │   └── LanguageContext.js    # LanguageProvider + useT() hook (EN/ES)
│   ├── hooks/
│   │   ├── useOpenStatus.js      # Computes "Open now" / "Closed" from hours
│   │   └── useSecretAdminTap.js  # 5-tap easter egg → /admin
│   ├── admin/
│   │   ├── page.js               # Server component — admin panel
│   │   └── PricingEditor.js      # Client component — pricing CRUD UI
│   ├── quote/
│   │   ├── page.js               # /quote route page
│   │   ├── QuoteCalculator.js    # Interactive price estimator
│   │   └── QuoteIntro.js         # /quote intro text
│   └── api/
│       ├── pricing/
│       │   └── route.js          # GET /api/pricing — public pricing data
│       └── admin/
│           ├── login/
│           │   └── route.js      # POST /api/admin/login — session auth
│           ├── logout/
│           │   └── route.js      # POST /api/admin/logout — destroy session
│           └── pricing/
│               └── route.js      # PUT /api/admin/pricing — save edited prices
├── lib/                          # Shared logic (server-only, pure functions)
│   ├── auth.js                   # HMAC-signed session cookies
│   ├── quote.js                  # Quote calculation engine
│   ├── pricing.default.js        # Default/seed pricing data
│   ├── pricing-store.js          # Supabase read/write with dev fallback
│   ├── pricing-validate.js       # Server-side payload sanitization
│   └── vehicles.js               # 60+ vehicle makes/models DB
├── db/
│   └── pricing-schema.sql        # Supabase table DDL + seed data
├── public/                       # Static assets
│   ├── brands/                   # Tire brand logos
│   ├── services/                 # Service card images
│   ├── vehicles/                 # Vehicle photos
│   ├── logo.jpg / logo-mark.png  # Logo variants
│   ├── og.png                    # Open Graph share image
│   ├── storefront.jpg            # Shop exterior
│   ├── owner.jpg / owners-m3.jpg # Owner & car photos
│   ├── snap-finance.jpg / loyalty-card.jpg  # Promo images
│   └── favicon.svg / manifest.json / apple-touch-icon*.png
├── package.json                  # Dependencies & scripts
├── next.config.js                # { reactStrictMode: true }
├── .env.example                  # All required env vars documented
├── .nvmrc                        # Node 20
├── .gitignore
└── README.md                     # ← This file
```

---

## Architecture decisions

### Client vs Server components

| Convention | Used for |
|---|---|
| `"use client"` | Any component with state, effects, event handlers, or browser APIs |
| Default (server) | Static sections, layout, metadata config, API routes |

The homepage (`app/page.js`) is a server component that imports client leaf
components. This keeps the rendering surface small.

### CSS — plain, no frameworks

All styles are in a single `app/globals.css` (2905 lines). No CSS Modules,
Tailwind, CSS-in-JS, or preprocessors. Pattern:

- **Custom properties** for colors, radii, fonts (`:root` block)
- **BEM naming** for components: `.service-card`, `.service-card__icon`,
  `.service-card--active`
- **Global utility** classes: `.icon`, `.btn`, `.btn--primary`, `.section`,
  `.reveal`, `.reveal-item`
- **Breakpoint** at 768px (single mobile breakpoint, near end of file)
- **`prefers-reduced-motion`** respected — all animations disabled

### Fonts — self-hosted via `next/font`

- **Barlow Condensed** (600/700/800) — headings, display (`--font-display`)
- **Barlow** (400/500/600) — body text (`--font-body`)
- **Caveat** (600) — signature/accent (`--font-signature`)

Zero runtime font requests — built into CSS at build time.

### Color system

`--ink: #14100c` (near-black), `--paper: #f3ede3` (warm off-white),
`--orange: #f86000` (brand accent), `--surface` / `--surface-2` / `--line`
for card/surface hierarchy. Brown-orange bias throughout.

---

## i18n system

The site is fully bilingual (English/Spanish) with a runtime toggle.

**How it works:**

1. `app/i18n/LanguageContext.js` provides `<LanguageProvider>` wrapping the
   entire app in `layout.js`.
2. `useT()` hook returns a function: `t({ en: "...", es: "..." })` → active
   string. Auto-picks browser language on first visit; persists to
   `localStorage` key `tsr-lang`.
3. `lang` and `toggleLang` are also available via `useLanguage()`.
4. `<html lang>` is kept in sync for SEO/screen readers.

**Every UI string** is a `{ en, es }` object defined in `app/site.config.js`
inside the `COPY` object. Content-only entries (service descriptions,
testimonials, marquee items) are also `{ en, es }`.

---

## Data flow

### Static content (most of the site)

All content is defined in `app/site.config.js`:
- `SITE` — business info, locations, hours, social links
- `SERVICES` — 7 service cards for "What We Do"
- `TESTIMONIALS` — 3 review cards
- `MARQUEE_ITEMS` — scrolling bilingual banner items
- `REELS` — Instagram reel URLs
- `OWNERS_RIDE` — BMW M3 section text
- `COPY` — every other UI string (nav, hero, quote, footer, status, admin)

All component files import from `site.config.js` directly (no API calls for
content). **To change site content, edit `site.config.js` only.**

### Dynamic data — Quote pricing

The quote estimator uses a pricing model in `lib/`:
- `lib/pricing.default.js` — default/seed prices
- `lib/pricing-store.js` — tries Supabase first, falls back to defaults
- `lib/quote.js` — pure calculation: (base × vehicle multiplier × qty) + labor

Prices are edited at `/admin` (password-protected):
- With Supabase env vars → persisted to Supabase `pricing` table
- Without Supabase → in-memory for the session only

### API routes

| Route | Method | Purpose | Auth |
|---|---|---|---|
| `/api/pricing` | GET | Public pricing data for the quote calculator | None |
| `/api/admin/login` | POST | Validate password, set session cookie | None |
| `/api/admin/logout` | POST | Destroy session cookie | None |
| `/api/admin/pricing` | PUT | Save edited pricing | Session cookie |

Auth uses HMAC-signed cookies (`lib/auth.js`) — no JWT, no Supabase Auth.

---

## Yelp lead auto-responder & email system

A cron job (`app/api/cron/yelp-lead-responder/route.js`, every 5 minutes) reads
unread Yelp "Request a Quote" / "New Lead" emails from Gmail, drafts a reply
with Groq, and sends it back through the **same Gmail account** — not a
third-party email service. This is also now the transport for every other
outbound email in the app (chat/appointment lead notifications, weekly
reports, budget alerts, admin test-notify) — **Resend has been fully
retired**; `lib/gmail-client.js`'s `sendGmailEmail()` is the one email
primitive the whole app uses.

Key files:
- `lib/gmail-client.js` — raw-fetch Gmail API client (no `googleapis`
  dependency): OAuth token refresh, `listUnreadYelpLeadEmails()`,
  `markProcessed()`, `sendGmailEmail()`.
- `lib/yelp-lead-parser.js` — extracts the customer's message, name, and
  reply-to address from Yelp's email format.
- `lib/yelp-lead-ai-reply.js` — builds the AI reply via Groq.
- `lib/yelp-lead-responder.js` — orchestrator; run by the cron route and by
  the admin panel's manual "Check Yelp now" button.
- `lib/yelp-leads-store.js` — Supabase `yelp_leads` table (history/dedupe)
  and `yelp_responder_state` (a single-row watermark: only messages received
  **after the previous run** are ever considered, so an old backlog can never
  be reprocessed regardless of Gmail read/unread state).
- `app/admin/YelpLeads.js` + `app/api/admin/yelp-leads/route.js` — the admin
  console tab (lead history, status, AI replies, manual trigger).

One-time setup (Google Cloud OAuth client + `node scripts/gmail-oauth-setup.js`
to mint a refresh token) is documented in that script's header comment.

---

## Component tree (homepage)

```
<RootLayout>                 ← layout.js (fonts, metadata, LanguageProvider)
  <JsonLd />                 ← schema.org structured data
  <LanguageProvider>
    <HomePage>               ← page.js (server component)
      <Header />             ← client: sticky nav, open/closed badge, lang toggle
      <main>
        <Hero />             ← client: hero + alignment spotlight
        <Marquee />          ← client: infinite scrolling banner
        <Services />         ← client: "What We Do" cards (toggle reveal)
        <Gallery />          ← client: Instagram reels
        <Promos />           ← client: financing + loyalty + driver program
        <OwnersRide />       ← client: BMW M3 section
        <Location />         ← client: maps + hours + addresses
        <Reviews />          ← client: testimonial cards
      </main>
      <Footer />             ← client: social links + copyright
      <BrandPopups />        ← client: brand logos carousel
    </HomePage>
  </LanguageProvider>
</RootLayout>
```

---

## Common tasks for AI

### Add/edit a service in "What We Do"
1. Edit `SERVICES` array in `app/site.config.js` (add/remove/modify objects).
2. Each service needs: `id`, `icon` (name from `Icons.js`), `image` (path in
   `/public/services/` or null), `title` and `desc` (both `{ en, es }`).
3. If you need a new icon, add its SVG path to the `GLYPHS` map in
   `app/components/Icons.js`.

### Add a new section to the homepage
1. Create a component in `app/components/`.
2. Import it in `app/page.js` and add it to the `<main>` element.
3. Add its bilingual copy to `COPY` in `app/site.config.js`.
4. Add its CSS to `app/globals.css`.
5. Add a nav link in `Header.js` if needed.

### Add a new route/page
1. Create a folder under `app/` with a `page.js`.
2. If the page needs data at request time, add an API route under `app/api/`.
3. Add nav links in `Header.js`.

### Add/rotate Instagram reels
Edit the `REELS` array in `app/site.config.js` — paste new Instagram reel
permalinks.

### Update prices
- **Via admin UI** (recommended): Go to `/admin`, log in with `ADMIN_PASSWORD`,
  edit prices. If Supabase env vars are set, changes persist.
- **Via code**: Edit `lib/pricing.default.js` for new defaults.

### Change hours
Edit `SITE.hours` in `app/site.config.js`. The `useOpenStatus.js` hook
computes "Open now / Closed" automatically.

### Update location / phone / social
Edit the relevant field in `SITE` in `app/site.config.js`.

### Deploy
Push to GitHub → Vercel auto-deploys. No manual steps.

---

## Environment variables (`.env.local`)

| Variable | Purpose |
|---|---|
| `ADMIN_PASSWORD` | Login password for `/admin` |
| `AUTH_SECRET` | Random 32-byte base64 string for cookie signing |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `AD_CONNECTIONS_ENCRYPTION_KEY` | Dedicated server-only key used to encrypt ad-platform credentials |
| `DASHBOARD_DEFAULT_CLIENT_ID` | Stable UUID used by dashboard cron jobs |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk browser key for `/dashboard` authentication |
| `CLERK_SECRET_KEY` | Clerk server key for protected dashboard routes |
| `DASHBOARD_ALLOWED_USER_IDS` | Comma-separated Clerk user IDs allowed into `/dashboard` |
| `GROQ_API_KEY` / `GROQ_MODEL` | AI chat + Yelp-reply generation (Groq) |
| `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` / `GMAIL_REFRESH_TOKEN` | Gmail API access — reads Yelp leads and sends **every** outbound app email (see below). Generate the refresh token with `node scripts/gmail-oauth-setup.js` |
| `YELP_REPLY_FROM_EMAIL` / `YELP_REPLY_FROM_NAME` | The Gmail send-from identity for Yelp replies and all owner notifications (must match the Yelp business account's email so Yelp's relay attributes replies correctly) |
| `NOTIFY_EMAIL_RECIPIENT` | Where every owner-facing notification lands (chat/appointment leads, weekly reports, budget alerts, admin test-notify) |
| `CRON_SECRET` | Bearer token Vercel Cron uses to call `/api/cron/*` routes |

Without Supabase vars, the quote calculator works on default prices and admin
edits are session-only. See `.env.example`.

For an existing dashboard database, run `lib/dashboard-db-repair.sql` once in
the Supabase SQL editor. It aligns the dashboard columns, creates encrypted
connection storage, adds indexes, enables RLS, and reloads the API schema cache.

---

## SEO

- `JsonLd.js` — schema.org `TireShop`/`AutoRepair` (name, address, phone,
  hours, payment methods: Afterpay, social profiles)
- `layout.js` — canonical URL, bilingual keywords, OG + Twitter cards
- `sitemap.js` / `robots.js` — auto-generated
- **Critical:** `SITE.url` in `site.config.js` must be updated when a custom
  domain is attached. Then submit sitemap to Google Search Console and
  create/claim a Google Business Profile.

---

## Deploying

Two environments, both auto-deploying from Git pushes:

| Branch | URL | Purpose |
|---|---|---|
| `staging` | `dev.tiressosrescue.com` (Vercel login required to view) | Preview changes before they go live. Gmail is intentionally **not** configured here — it shares the same real Gmail inbox/Supabase watermark as production, so testing the Yelp flow on staging would touch real customer data. Everything else (pricing, chat, leads, appointments) works normally for review. |
| `Pre-Production` (tracks `claude/tires-sos-website-plan-o3sua9`) | `tiressosrescue.com` | Live production. |

**Workflow:** commit → push to `staging` → review at `dev.tiressosrescue.com` →
merge `staging` into `Pre-Production` → push → live at `tiressosrescue.com`.

Initial setup (already done for this project, listed for reference):
1. Import the repo at [vercel.com/new](https://vercel.com/new).
2. Framework preset: Next.js (auto-detected).
3. Set environment variables in Vercel dashboard (Production **and** Preview).
4. Assign the `staging` branch to the `dev.tiressosrescue.com` domain in
   Project Settings → Domains.
