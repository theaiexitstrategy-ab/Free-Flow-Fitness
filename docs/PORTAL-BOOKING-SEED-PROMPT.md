# Claude Code prompt — seed Free Flow's class calendar (run INSIDE goelev8.ai-portal)

> Phase 1 of the GloFox replacement: give Free Flow Fitness a real class calendar
> on the portal's **System A** (booking_services + availability_templates + capacity).
> The funnel (free-fitness-flow) renders the calendar and reads/writes this data.
>
> This is a DATA-SEED task (no new product tables). The class-pass / membership /
> credit commerce is a later phase — do NOT build it here.

---

````text
You are in the goelev8.ai-portal repo. Seed Free Flow Fitness as a booking tenant
on the existing "System A" class-calendar model so its funnel can show a live
class schedule with capacity (max 7 per pole). Free Flow already exists as
clients.slug = 'freeflow-fitness-stl'. Do NOT touch the existing freeflow_bookings
(party/private intake) tables — this is a separate surface.

Read first to confirm the live schema + conventions:
- supabase/migrations/0018_booking_services_schema_unification.sql  (booking_services, availability_templates)
- supabase/migrations/0017_booking_tables.sql                       (booking_calendars)
- api/portal/bookings/services.js  and  api/portal/bookings/availability.js  (management API shapes)
- how flex-facility was seeded (migrations 0017/0018 seed data) — copy that pattern

TASK 1 — booking_calendars row for Free Flow
Insert one row (idempotent) for the tenant:
  business_id  = (select id from clients where slug='freeflow-fitness-stl')
  slug         = 'freeflow-fitness-stl'
  title        = 'Free Flow Fitness Classes'
  timezone     = 'America/Chicago'
  booking_window_days = 30
  min_notice_hours    = 2            -- the "register 2h before" policy
  custom_domain = 'free-flow-fitness.vercel.app'  (or the real domain later)
  is_active    = true

TASK 2 — booking_services (one per class type; capacity = max_per_slot = 7)
Insert these (client_id = the freeflow-fitness-stl client id), all max_per_slot = 7,
is_active = true. Keys must match the funnel's lib/schedule.ts keys:
  key                 name
  level-1-pole        Level 1 Pole
  level-234-pole      Level 1.5 / 2 / 3 Pole
  hello-pole          Hello, Pole!
  twerk-u             Twerk U
  alter-ego           Alter Ego / Choreography
  flex-conditioning   Flexibility & Conditioning
Also add a 1-on-1 provider row for Phase 2 (max_per_slot = 1, is_active = false for now):
  private-1on1        Private 1-on-1 Session      (max_per_slot 1)

TASK 3 — availability_templates (the weekly schedule)
⚠️ The times below are PLACEHOLDERS matching the funnel's demo. REPLACE with the
real GloFox schedule (Aaron is providing class name + day + time). One row per
weekday-time per service: { client_id, service_id, day_of_week (0=Sun..6=Sat),
start_time, end_time, slot_duration_minutes = 60, is_active = true }.
  Twerk U             — Mon 20:00–21:00     (CONFIRMED)
  Level 1 Pole        — Tue 18:00, Thu 18:00     (placeholder)
  Level 1.5/2/3 Pole  — Tue 19:15, Thu 19:15     (placeholder)
  Hello, Pole!        — Sat 11:00                (placeholder)
  Alter Ego           — Wed 19:00                (placeholder)
  Flexibility & Cond. — Sat 12:30                (placeholder)

Apply as a new timestamped migration in supabase/migrations/ (idempotent inserts),
OR via execute_sql. Verify with a select afterward.

TASK 4 — confirm the funnel's data path
The funnel (free-fitness-flow) will read booking_services + availability_templates
and write reservations into public.bookings using a service-role key — mirroring
the flex-booking-calendar repo's /api/services, /api/slots, /api/bookings. Confirm:
  - public.bookings accepts: client_id, lead_name, lead_phone, lead_email,
    service_type/service key, starts_at (UTC), status 'Confirmed', source.
  - capacity is enforced by counting existing public.bookings for a slot vs
    booking_services.max_per_slot (as flex/index.html does).
Report the exact columns the funnel must insert, and whether reservations should
also mirror to the portal lead webhook (POST /api/webhooks/lead, x-goelev8-secret)
like flex does.

TASK 5 — output the funnel env values (do NOT print secret values, just names)
Tell Aaron which env vars to set on the free-fitness-flow Vercel project so its
/api/schedule/* routes can go live:
  PORTAL_SUPABASE_URL                 (= NEXT_PUBLIC_SUPABASE_URL of the portal)
  PORTAL_SUPABASE_SERVICE_ROLE_KEY    (portal service-role key — server-only)
  FREEFLOW_BOOKING_SLUG = freeflow-fitness-stl
(The funnel already sends tenant_slug 'freeflow_fitness_stl' underscored elsewhere;
for booking use the dashed clients.slug 'freeflow-fitness-stl'.)

Keep this repo's copyright header on any new files. Data-seed + read/write wiring
only — no pass/membership/credit commerce in this phase.
````
