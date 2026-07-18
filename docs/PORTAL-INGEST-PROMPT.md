# Claude Code prompt — surface Free Flow funnel submissions in the portal (run INSIDE goelev8.ai-portal)

> Paste the fenced block into a Claude Code session opened in your
> **goelev8.ai-portal** repo. It tells the portal exactly where the funnel's
> submitted info comes from and wires the multi-tenant dashboard to READ it.
>
> Context for you (already true in the repo, no need to rebuild):
> - Intake endpoint exists: `api/freeflow/bookings.js` (`POST /api/freeflow/bookings`).
> - Data lands in `freeflow_bookings` (migration `0034_freeflow_fitness.sql`).
> - Tenant already seeded in `clients` as slug `freeflow-fitness-stl`, with
>   `portal_tabs` = overview/leads/bookings/messaging/analytics/settings.
> - GAP: no code SELECTs `freeflow_bookings` — the bookings/leads tabs don't
>   display the submitted info yet. That's what this prompt fixes.

---

````text
You are in the goelev8.ai-portal repo. The separate free-fitness-flow funnel
submits party bookings and private-lesson inquiries to this portal. Everything
to RECEIVE that data already exists — do not rebuild it. Your job is to make the
submitted info VISIBLE in the multi-tenant portal dashboard for the Free Flow
tenant. First read these to ground yourself:

- api/freeflow/bookings.js                 (intake — writes freeflow_bookings)
- supabase/migrations/0034_freeflow_fitness.sql (table + RLS)
- api/admin.js (search "freeflow")          (tenant seed, portal_tabs, portal_api_key)
- api/freeflow/statement.js                 (existing read pattern for billing)
- however other tenants' bookings/leads tabs read their data (copy that pattern)

WHERE THE INFO COMES FROM (source of truth = the funnel repo free-fitness-flow,
file lib/portal.ts). The funnel does a server-to-server POST:

  POST  {PORTAL_API_URL}/api/freeflow/bookings
  header  x-goelev8-secret: <GOELEV8_WEBHOOK_SECRET>   // must match this repo's env
  body (JSON):
    service_type: 'party' | 'private_lesson'
    package: 'fab-flow'|'ultimate-flow'|'private-group'|'body-painting'   (party only)
    package_name, deposit_cents (ignored — you re-derive), 
    first_name, last_name, email, phone, sms_consent: true,
    preferred_date, preferred_time, guest_count, occasion, dance_style,     (party)
    preferred_times, goals, experience_level,                              (lesson)
    notes, lead_source: 'freeflow_funnel', site_url, page_url, submitted_at
  response: { ok, bookingId, checkoutUrl }   // checkoutUrl present only for deposits

WHERE IT LANDS: the public.freeflow_bookings table (one row per submission),
tenant_slug = 'freeflow_fitness_stl'. NOTE the slug duality (documented in the
0034 migration): the funnel/table use the UNDERSCORED 'freeflow_fitness_stl';
this repo's clients.slug is the DASHED 'freeflow-fitness-stl'. Both are the same
tenant — handle the mapping in reads.

TASKS

1. READ ENDPOINT / DASHBOARD WIRING (the core ask).
   Make the submitted bookings + inquiries show up in the portal for the
   freeflow-fitness-stl tenant, matching how other tenants' bookings/leads tabs
   already load. Two acceptable implementations — pick whichever matches this
   repo's convention:
     a) If the dashboard queries Supabase directly with the tenant's RLS'd
        session: confirm the freeflow_bookings RLS tenant policy already lets the
        Free Flow client_user read it (it does — 0034 `freeflow_bookings_tenant_all`),
        and point the Bookings + Leads + Overview tabs at freeflow_bookings for
        this tenant. No new endpoint needed.
     b) If tabs load via serverless GET endpoints: add
        `GET /api/freeflow/bookings` (list) — same-file method branch or a new
        route — returning rows for the tenant. Auth: allow Master Admin
        (ab@goelev8.ai / platform_admins) AND the Free Flow tenant (via
        client_users → clients.slug='freeflow-fitness-stl'), mirroring
        api/freeflow/statement.js. Support filters: service_type, payment_status,
        booking_status, date range; order by created_at desc; paginate.
   Map fields to the existing tab UI:
     - Bookings tab: service_type, package_name, preferred_date/time, guest_count,
       occasion, dance_style, payment_status, deposit_cents, booking_status.
     - Leads tab: first_name, last_name, email, phone, sms_consent, lead_source,
       created_at; private_lesson rows show goals / experience_level / preferred_times.
     - Overview tab: counts (new_request / deposit_paid / this-month) + the current
       freeflow_billing_statements period (base + overage + total) from
       api/freeflow/statement.js.

2. RECORD THE FUNNEL SOURCE on the tenant so the portal "knows where it comes
   from": store the funnel's production origin on the Free Flow clients row
   (e.g. a `funnel_url` / settings JSON field) = <FUNNEL_PRODUCTION_URL>
   (fill in once the funnel is deployed). If any funnel call is ever made from the
   browser rather than server-to-server, add that origin to CORS allow-list;
   today it's server-to-server so CORS is not required.

3. SECRET/ENV PARITY (so intake actually authenticates):
   - GOELEV8_WEBHOOK_SECRET must be set here AND be the identical value the funnel
     sends. This is the single thing that makes the connection live.
   - Confirm PORTAL_BASE_URL is set (used by the intake's Twilio statusCallback).
   - Do NOT print secret values; just confirm presence/parity.

4. VERIFY end-to-end (no live charges): with a test GOELEV8_WEBHOOK_SECRET, POST a
   sample party body to /api/freeflow/bookings, confirm a freeflow_bookings row
   appears AND now shows in the Bookings/Leads tab for freeflow-fitness-stl.

Keep the copyright header this repo uses on any new files. Do not modify the
intake, stripe-webhook, billing, or migration logic — this is read/display only.
````
