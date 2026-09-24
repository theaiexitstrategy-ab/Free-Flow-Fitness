# Free Flow Fitness — Funnel

Standalone **Next.js 14 (App Router)** marketing + booking site for Free Flow
Fitness, a pole-fitness studio in Bridgeton, MO. Dark / cobalt / magenta design,
Bebas Neue + Inter.

The **frontend + booking UI lives here**. The **backend** (Stripe deposits,
`freeflow_bookings` table, sub-60s Twilio SMS, the Vapi phone assistant, and the
studio's monthly platform billing) lives in the **goelev8-portal** repo. This app
never holds Stripe/Twilio/Vapi secrets — it forwards validated submissions to the
portal over an authenticated server-to-server call. See
[`docs/GOELEV8-PORTAL-PROMPT.md`](docs/GOELEV8-PORTAL-PROMPT.md) for the backend build.

## Architecture

```
Browser ──> /api/book      (server route, validates + re-derives deposit)
        ──> /api/inquiry    ──┐
                              ├─> POST {PORTAL_API_URL}/api/freeflow/bookings
                              │        header: x-goelev8-secret
                              │   portal: insert row → Stripe Checkout (deposits)
                              │           → send SMS <60s → meter booking
                              └─< { checkoutUrl?, bookingId? }
Browser <── redirect to Stripe Checkout (deposit packages only)
        <── returns to /?booking=success|cancelled  (StatusBanner)
```

- **Party packages** (`lib/packages.ts`): Fab Flow $400 / **$200 deposit**,
  Ultimate Flow $500 / **$250 deposit**, Private Group $300 / **$150 deposit**,
  Body Painting $300 / **inquiry only** (no customer deposit confirmed yet).
- **Private lessons**: inquiry / hold only — **no price shown, no charge** (pricing
  not finalized; see the flagged comment in `app/components/PrivateLesson.tsx`).
- Deposit amounts are **re-derived server-side** from the catalog in
  `app/api/book/route.ts`, so a tampered client request can't change the charge.

## Logos

Copied into `public/logos/`:
- `ff-black-mark.png` — header (inverted in CSS to read on the dark bar)
- `ff-cobalt.png` — hero
- `ff-teal-ornate.png` — footer

## Local setup

```bash
npm install
cp .env.example .env.local   # optional — runs in demo mode without it
npm run dev                  # http://localhost:3000
```

**Demo mode:** with no `PORTAL_API_URL` / `GOELEV8_WEBHOOK_SECRET` set, submissions
are validated and logged to the server console instead of hitting the portal, and
no Stripe redirect happens. This lets you exercise the whole funnel with zero
secrets. Wire the two portal env vars to go live against the real backend.

### Environment

| Var | Purpose |
|-----|---------|
| `PORTAL_API_URL` | Portal base URL, e.g. `https://portal.goelev8.ai` (server-only) |
| `GOELEV8_WEBHOOK_SECRET` | Shared secret sent as `x-goelev8-secret` (server-only) |
| `FREEFLOW_TENANT_SLUG` | Tenant routing key (default `freeflow_fitness_stl`) |
| `NEXT_PUBLIC_SITE_URL` | Public site URL for Stripe return links |
| `NEXT_PUBLIC_STUDIO_PHONE` | Display phone (safe to expose) |
| `NEXT_PUBLIC_CLASS_SCHEDULE_URL` | Optional — weekly-class schedule link |

## Testing walkthrough

See [`docs/TEST-WALKTHROUGH.md`](docs/TEST-WALKTHROUGH.md).

## Deploy

**Do not deploy to production until reviewed.** Intended target: its own Vercel
project. The private-lesson price and any Body Painting deposit must be confirmed
before the portal wires them to real Stripe charges.

## Party-request intake agent (`/intake`)

Replaces the Google Form + Sheet ("Free Flow Fitness Party Request Form").

- **`/intake`** — chat agent (Claude `claude-sonnet-5`, streamed) that asks the form's
  questions conversationally, confirms a summary, then calls `submit_intake`.
- **`/intake/form`** — the same questions as a plain accessible form (same endpoint).
- **`/intake/responses`** — password-protected dashboard: list, detail + transcript,
  status (new / contacted / done), CSV export in the original form's column order.

`data/intake-form.json` is the single source of truth (questions, options, required
flags, branching). Regenerate it from the live form with
`node scripts/extract-intake-form.mjs`. Submissions land in `ffs_intake_submissions`
in the GoElev8.AI Supabase project (`supabase/migrations/`), written server-side only
with the service-role key (RLS on, no policies).

| Var | Purpose |
|-----|---------|
| `ANTHROPIC_API_KEY` | Claude API key for the chat agent (server-only) |
| `SUPABASE_URL` | GoElev8.AI Supabase URL (server-only) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key for inserts/reads (server-only) |
| `INTAKE_ADMIN_PASSWORD` | Password for `/intake/responses` |
