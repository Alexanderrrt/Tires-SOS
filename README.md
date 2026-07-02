# Tires SOS Rescue — website

Next.js (App Router) marketing site for Tires SOS Rescue, a tire & auto shop
in San José, CA (tires, brakes, oil changes, batteries, rims, alignment).

**Stack:** Next.js 14 · React · plain CSS · Vercel (hosting). No database,
no backend — the shop runs on walk-ins and phone calls, not online booking.

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

## Photos

The gallery section currently uses placeholder tiles (`app/components/Gallery.js`)
since Instagram photos can't be pulled in automatically. Drop real shop/vehicle
photos into `/public`, then swap the placeholder tiles for `<img>` tags pointing
at them.

## Deploying to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the
   `alexanderrrt/tires-sos` GitHub repo.
2. Framework preset: Next.js (auto-detected). No environment variables are
   required.
3. Deploy. Every push to the connected branch will auto-deploy.
