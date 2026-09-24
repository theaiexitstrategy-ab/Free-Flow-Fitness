-- Free Flow Fitness party-request intake (replaces the Google Form + Sheet).
-- Lives in the GoElev8.AI Supabase project alongside freeflow_bookings.
-- Written only by the Next.js server with the service-role key; RLS is on
-- with NO policies, so anon/authenticated clients can't read or write it.

create table if not exists public.ffs_intake_submissions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  answers     jsonb not null,             -- keyed by question id from data/intake-form.json
  transcript  jsonb,                      -- chat messages [{role, content}], null for the plain form
  status      text not null default 'new' check (status in ('new', 'contacted', 'done')),
  source      text check (source in ('chat', 'form')),
  name        text,                       -- "First and last name of person requesting the party."
  email       text,                       -- "Email Address"
  phone       text                        -- "Phone number:"
);

create index if not exists ffs_intake_submissions_created_at_idx
  on public.ffs_intake_submissions (created_at desc);

alter table public.ffs_intake_submissions enable row level security;

revoke all on public.ffs_intake_submissions from anon, authenticated;
