# Claude Code prompt — Free Flow Fitness backend (run this INSIDE the goelev8-portal repo)

> Copy everything in the fenced block below into a Claude Code session opened in
> your **goelev8-portal** repo (the Next.js 14 App Router repo that already has
> Stripe, Supabase, Twilio, and Vapi wired). It builds the backend for the
> standalone **Free Flow Fitness** funnel (which lives in a separate
> `free-fitness-flow` repo and calls these endpoints).
>
> ⚠️ Before you let it wire live charges, confirm the two open items in
> "Guardrails" at the bottom.

---

````text
You are working in the goelev8-portal repo. Build the backend for a new client,
Free Flow Fitness (a pole-fitness studio in Bridgeton, MO). A separate standalone
Next.js funnel (repo: free-fitness-flow) already exists and calls the endpoints
below. Match THIS repo's existing conventions exactly — do not invent new patterns.
Study these existing files first and copy their style:

- Stripe checkout:            app/api/checkout/[tier]/route.ts  (Stripe SDK, inline price_data)
- Stripe webhook:             app/api/webhooks/stripe/route.ts  (signature verify, always 200, idempotent)
- Supabase service client:    lib/db/supabase-service.ts        (createServiceClient)
- Booking insert + SMS:       app/api/bookings/route.ts         (await SMS inline for <60s)
- Twilio raw-REST send:       app/api/demo/send-sms/route.ts    (fetch to api.twilio.com, no SDK)
- Opt-out compliance:         lib/sms-opt-outs.ts               (isOptedOut / withOptOutNotice)
- Vapi assistant provisioning: scripts/setup-vapi-lev.ts        (POST /assistant, assign phone number)
- Vapi webhook receiver:      app/api/vapi/lev-webhook/route.ts (end-of-call-report -> vapi_calls)
- Public-route allowlist:     middleware.ts                     (isPublicRoute)
- Cron pattern + secret:      vercel.json crons + CRON_SECRET

Tenant slug: freeflow_fitness_stl. Timezone: America/Chicago.

────────────────────────────────────────────────────────────────────────
TASK 1 — Migration: dedicated freeflow_bookings table
────────────────────────────────────────────────────────────────────────
Add a timestamped migration in supabase/migrations/ (e.g.
<timestamp>_freeflow_bookings.sql). Free Flow gets its OWN table (explicit
client requirement — do NOT reuse the shared bookings/leads tables):

  create table if not exists freeflow_bookings (
    id                uuid primary key default gen_random_uuid(),
    tenant_slug       text not null default 'freeflow_fitness_stl',
    service_type      text not null check (service_type in ('party','private_lesson')),
    package_id        text,                 -- fab-flow | ultimate-flow | private-group | body-painting | null
    package_name      text,
    -- contact
    first_name        text not null,
    last_name         text not null,
    email             text not null,
    phone             text not null,        -- store E.164 (+1XXXXXXXXXX)
    sms_consent       boolean not null default false,
    -- party details
    preferred_date    date,
    preferred_time    text,
    guest_count       int,
    occasion          text,
    dance_style       text,
    -- private-lesson details
    preferred_times   text,
    goals             text,
    experience_level  text,
    notes             text,
    -- money (deposit charged to the CUSTOMER; null = inquiry/hold, no charge)
    deposit_cents     int,
    stripe_session_id text,
    payment_status    text not null default 'none'
                      check (payment_status in ('none','deposit_pending','deposit_paid','refunded')),
    -- lifecycle
    booking_status    text not null default 'new_request',
    confirmation_sms_sent boolean not null default false,
    -- Flow B metering: has this booking been counted toward the studio's monthly usage?
    billing_counted   boolean not null default false,
    billing_period    text,                 -- 'YYYY-MM' the booking was counted in
    lead_source       text default 'freeflow_funnel',
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now()
  );
  create index on freeflow_bookings (created_at);
  create index on freeflow_bookings (billing_period);
  -- RLS: enable, service_role full access, NO public select (PII).
  alter table freeflow_bookings enable row level security;
  -- (add the same updated_at trigger this repo uses elsewhere)

Also add a monthly statement table for Flow B (see TASK 5):

  create table if not exists freeflow_billing_statements (
    id             uuid primary key default gen_random_uuid(),
    tenant_slug    text not null default 'freeflow_fitness_stl',
    period         text not null,           -- 'YYYY-MM'
    base_fee_cents int  not null default 5000,   -- $50/mo
    free_quota     int  not null default 5,
    total_bookings int  not null default 0,
    billable_bookings int not null default 0,     -- max(0, total - free_quota)
    overage_cents  int  not null default 0,       -- billable * $10
    total_cents    int  not null default 0,       -- base + overage
    status         text not null default 'open'   -- open | finalized | invoiced | paid
                   check (status in ('open','finalized','invoiced','paid')),
    finalized_at   timestamptz,
    created_at     timestamptz not null default now(),
    unique (tenant_slug, period)
  );

Apply it with this repo's normal migration workflow.

────────────────────────────────────────────────────────────────────────
TASK 2 — Booking intake endpoint: app/api/freeflow/bookings/route.ts
────────────────────────────────────────────────────────────────────────
runtime = 'nodejs'. POST only. This is the endpoint the funnel calls.

Auth: require header `x-goelev8-secret` === process.env.GOELEV8_WEBHOOK_SECRET
(reuse whatever this repo already uses for portal webhooks). 401 otherwise.

Request body (JSON) the funnel sends:
  {
    tenant_slug, portal_pipeline, portal_stage, lead_source, submitted_at,
    page_url, site_url,
    service_type: 'party' | 'private_lesson',
    package?: 'fab-flow'|'ultimate-flow'|'private-group'|'body-painting',
    package_name?, deposit_cents: number | null,
    preferred_date?, preferred_time?, guest_count?, occasion?, dance_style?,
    preferred_times?, goals?, experience_level?,
    first_name, last_name, email, phone, notes?, sms_consent: true
  }

Steps (mirror app/api/bookings/route.ts ordering):
  1. Validate required fields (names, valid email, phone >= 10 digits, sms_consent true).
  2. SECURITY: do NOT trust deposit_cents from the body. Re-derive it server-side
     from a package map in this route:
        fab-flow=15000, ultimate-flow=20000, private-group=11250, body-painting=null.
     private_lesson => always null.  (The funnel already re-derives too; this is defense in depth.)
  3. Normalize phone to E.164 (+1XXXXXXXXXX). Reuse this repo's formatE164 helper if present.
  4. Insert a freeflow_bookings row (service-role client) with payment_status =
     (depositCents ? 'deposit_pending' : 'none'), booking_status='new_request'.
  5. If depositCents is not null -> create a Stripe Checkout Session:
        mode: 'payment'                      // one-time deposit, NOT subscription
        line_items: [{ quantity:1, price_data:{ currency:'usd', unit_amount: depositCents,
          product_data:{ name: `${package_name} — Deposit`,
            description: 'Deposit to reserve your Free Flow Fitness party. Balance due at your party.' }}}]
        customer_email: email
        metadata: { source:'freeflow', freeflow_booking_id: <row id>, tenant_slug, package_id }
        success_url: `${site_url}/?booking=success&session_id={CHECKOUT_SESSION_ID}`
        cancel_url:  `${site_url}/?booking=cancelled`
     Save session.id to the row's stripe_session_id. Return { checkoutUrl: session.url, bookingId }.
     If depositCents is null (Body Painting / private lesson) -> no Stripe. Return { bookingId } (no checkoutUrl).
  6. Send the confirmation SMS INLINE and await it (must land <60s) using the raw-REST
     Twilio fetch pattern from app/api/demo/send-sms/route.ts. From-number: TWILIO_MASTER_NUMBER
     (same as booking confirmations). Respect isOptedOut() and append the STOP notice via
     withOptOutNotice(). Pick the template by flow (see "SMS COPY" below). On success set
     confirmation_sms_sent=true. Never let an SMS failure 500 the request — log and continue.
  7. Increment Flow B usage (TASK 5): call countBookingForBilling(bookingRow).
  8. Mirror the lead to the existing portal lead pipeline the same way
     app/api/bookings/route.ts does (so it shows in the GoElev8 dashboard).
  9. Return 200 JSON. On hard failure return { ok:false, error } with a 4xx/5xx.

────────────────────────────────────────────────────────────────────────
TASK 3 — Stripe webhook: app/api/freeflow/stripe-webhook/route.ts
────────────────────────────────────────────────────────────────────────
Copy the signature-verify + always-200 + idempotent structure from
app/api/webhooks/stripe/route.ts. Use a dedicated STRIPE_FREEFLOW_WEBHOOK_SECRET
(so it doesn't collide with the main GoElev8 webhook). Handle:
  - checkout.session.completed where metadata.source === 'freeflow':
      look up freeflow_bookings by stripe_session_id (or metadata.freeflow_booking_id),
      set payment_status='deposit_paid', booking_status='confirmed' (idempotent).
      Send the "deposit paid" SMS (see SMS COPY). 
Register this URL in the Stripe dashboard as a separate endpoint.

────────────────────────────────────────────────────────────────────────
TASK 4 — Vapi assistant + dedicated phone number
────────────────────────────────────────────────────────────────────────
Clone scripts/setup-vapi-lev.ts -> scripts/setup-vapi-freeflow.ts. Same structure
(POST https://api.vapi.ai/assistant with Bearer VAPI_API_KEY, list /phone-number,
PATCH the number to assign the assistant). This is a NEW, SEPARATE assistant — do
not touch Lev or any other client's assistant. Use the SYSTEM PROMPT + firstMessage
below. Voice: keep 11labs, choose a warm female voice id. Model: anthropic
claude-sonnet (match the version used in setup-vapi-lev.ts). Provision/assign a
DEDICATED phone number for Free Flow (buy one via Vapi/Twilio the same way other
clients' numbers are provisioned) — do not reuse another client's number.

Store the returned assistant id and phone number on the tenant's clients row
(the repo already has a clients.vapi_assistant_id column per the FLEX pattern).
Add a webhook receiver app/api/vapi/freeflow-webhook/route.ts modeled on
app/api/vapi/lev-webhook/route.ts that upserts end-of-call reports into vapi_calls
(tag them with tenant_slug='freeflow_fitness_stl'). After deploy, set the
assistant's server webhook URL to it (mirror scripts/update-vapi-webhook.ts).

The assistant MUST be able to:
  - Explain the 4 party packages + pricing + deposits when asked.
  - Ask whether the caller wants to book a PARTY or a PRIVATE LESSON, then collect
    the right details:
      party:  package, preferred date, headcount, occasion, name, callback number, email
      lesson: name, callback number, email, goals, experience level, preferred times
  - For a party with a known deposit, tell them we'll text a secure link to pay the
    deposit and lock the date (it can POST the collected details to
    /api/freeflow/bookings using GOELEV8_WEBHOOK_SECRET so the SMS + Stripe link fire
    the same way as the web form).
  - Hand off to a human / take a message for anything outside booking — e.g.
    class-level requirements, specific choreography questions, medical/injury
    questions. Do NOT improvise studio policy.

Env this task needs: VAPI_API_KEY, plus a new VAPI_FREEFLOW_ASSISTANT_ID and
VAPI_FREEFLOW_PHONE_NUMBER_ID (set after provisioning), VAPI_WEBHOOK_SECRET.

────────────────────────────────────────────────────────────────────────
TASK 5 — Flow B: platform metering + monthly statement (studio -> GoElev8)
────────────────────────────────────────────────────────────────────────
This bills the STUDIO, separate from customer deposits. Model:
  $50/mo base + first 5 bookings/month free + $10 per booking after that.

Implement lib/freeflow-billing.ts:
  - countBookingForBilling(booking): if !billing_counted, set billing_counted=true and
    billing_period=<current YYYY-MM in America/Chicago>, then upsert the open
    freeflow_billing_statements row for that period: total_bookings += 1,
    billable_bookings = max(0, total_bookings - free_quota),
    overage_cents = billable_bookings * 1000, total_cents = base_fee_cents + overage_cents.
    (Count every accepted booking/inquiry the same way unless you decide only paid
    parties should count — CONFIRM which with Aaron; default = count all submissions.)
  - finalizeMonth(period): mark the period statement 'finalized', freeze totals.

Add a cron (vercel.json, guarded by CRON_SECRET) app/api/cron/freeflow-billing/route.ts
that on the 1st of each month finalizes the prior period and (optionally) creates a
Stripe invoice to the studio for base + overage, then emails/SMS Aaron the statement.
Reuse this repo's Resend email + Twilio patterns for the statement delivery.

Expose a read endpoint app/api/freeflow/statement/route.ts (auth: INTERNAL_API_KEY or
dashboard session) returning the current + past statements for the studio dashboard.

────────────────────────────────────────────────────────────────────────
SMS COPY (studio voice: confident, warm, a little playful) — PENDING AARON'S FINAL OK
────────────────────────────────────────────────────────────────────────
Use {first} for first name, {package} for package name, {deposit} for the formatted
deposit. Always append the STOP notice via withOptOutNotice().

  party_request_received (fires in TASK 2, on submit, <60s):
    "Hey {first}! 💥 Your {package} request at Free Flow Fitness is in. Next up:
     your {deposit} deposit to lock the date — check your texts/email for the link.
     Then come shake your favorite ASSet."

  party_deposit_paid (fires in TASK 3, on checkout.session.completed):
    "{first}, your {package} is LOCKED 🔥 Deposit received. We'll reach out to
     finalize your date + crew. Get ready to flow."

  party_inquiry_received (Body Painting — no deposit):
    "Hey {first}! Got your Body Painting request at Free Flow Fitness 🎨 We'll text
     you to confirm your date + details. Get ready to make a mess (the fun kind)."

  private_lesson_received (TASK 2, private_lesson):
    "Hey {first}! Got your private lesson request at Free Flow Fitness. An instructor
     will reach out to set your time + goals — no group, no pressure, all you."

────────────────────────────────────────────────────────────────────────
VAPI SYSTEM PROMPT (draft — Free Flow "front desk" assistant)
────────────────────────────────────────────────────────────────────────
"You are the friendly front-desk voice for Free Flow Fitness, a pole & dance
fitness studio in Bridgeton, MO. You're warm, confident, and a little playful —
never clinical or stiff. Everyone is welcome, no matter their shape, size, race,
gender identity, or athletic ability; make people feel at ease.

You can help with two things: booking a PARTY or booking a PRIVATE LESSON. Early
in the call, find out which they want.

Party packages (say prices naturally, don't read like a spreadsheet):
- Fab Flow Party — $300, 90 min (60 dancing, 30 mixing & mingling), up to 7 people
  ($25 each additional up to 15). $150 deposit holds the date. Dance choice: Pole,
  Chair, or Twerk.
- Ultimate Flow Party — $400, 2 hours (90 dancing, 30 mixing & mingling), up to 7
  ($25 each up to 20). $200 deposit. Dance choice: Pole, Chair, Burlesque, Sexy
  Floorwork, or Twerk. Refreshments on request.
- Private Group Class — $225, 60 min Level-1-style class, up to 7 ($25 each up to
  14). $112.50 deposit. Just their group, no strangers.
- Body Painting — $300, 2 hours, up to 4 ($70 each up to 10). Canvas, paints &
  brushes included; refreshments +$20. This one is reserve-by-request — no deposit
  taken on the call.
Add-ons exist (theme decorations +$50, raunchy bingo, amateur photo shoots, BYOB) —
mention if asked.

For a PARTY: collect package, preferred date, headcount, occasion, their name,
a good callback number, and email. If the package has a deposit, tell them you'll
text a secure link to pay the deposit and lock the date.

For a PRIVATE LESSON: pricing isn't finalized yet, so do NOT quote a price. Collect
their name, callback number, email, goals, experience level, and preferred times,
and let them know an instructor will follow up to set it up.

Hand off to a human or take a detailed message for anything outside booking:
class-level requirements or prerequisites, specific choreography questions, injury
or medical questions, or anything you're unsure about. Never make up studio policy,
schedules, or prices you weren't given.

Studio: 11726 St Charles Rock Rd Ste A, Bridgeton, MO 63044. Phone 314-625-2323.
Keep it fun and get them booked."

firstMessage:
"Hey, thanks for calling Free Flow Fitness! Are you looking to throw a party, or
book a private lesson?"

────────────────────────────────────────────────────────────────────────
ENV VARS this backend needs (add to .env.example + Vercel)
────────────────────────────────────────────────────────────────────────
GOELEV8_WEBHOOK_SECRET            (shared with the funnel; funnel sends it as x-goelev8-secret)
STRIPE_SECRET_KEY                 (test key until go-live; live key flips test->live)
STRIPE_FREEFLOW_WEBHOOK_SECRET    (dedicated endpoint secret)
TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_MASTER_NUMBER
VAPI_API_KEY / VAPI_FREEFLOW_ASSISTANT_ID / VAPI_FREEFLOW_PHONE_NUMBER_ID / VAPI_WEBHOOK_SECRET
NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY   (existing)
CRON_SECRET / INTERNAL_API_KEY / RESEND_API_KEY        (existing)

────────────────────────────────────────────────────────────────────────
GUARDRAILS — do NOT wire live charges until Aaron confirms:
────────────────────────────────────────────────────────────────────────
1. Private-lesson price is NOT finalized — keep private_lesson deposit = null (inquiry only).
2. Body Painting takes NO customer deposit right now (inquiry only) until a deposit is confirmed.
3. Keep STRIPE_SECRET_KEY on the TEST key until Aaron says go live.
4. Confirm whether Flow B metering counts ALL submissions or only PAID parties (default: all).
Register /freeflow API routes as public in middleware.ts (isPublicRoute) if they'd
otherwise fall behind the dashboard auth gate. Add the copyright header this repo
uses on new .ts files.
````
