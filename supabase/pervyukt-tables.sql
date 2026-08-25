-- NOT YET APPLIED. Run this once in Supabase → SQL Editor → paste → Run.
--
-- ---------------------------------------------------------------------------
-- Adds the Pervyukt pair of tables alongside the Peshagi ones, in the same
-- shape and with the same lockdown that revoke-anon-insert.sql established:
--
--   pervyukt_signups   — one email per row (the hero "notify me" form)
--   pervyukt_contacts  — the full get-in-touch form
--
-- Same Supabase project as Peshagi, different app. This site is its own Vercel
-- deployment with its own app/api/submit/route.ts holding the service_role
-- key, so nothing here is shared with the Peshagi endpoint except the database
-- itself — these two tables are ours alone.
--
-- The Peshagi contacts/signups tables were created through the dashboard, so
-- their DDL was never written down. These two mirror those columns and are
-- defined here explicitly; copy from this file if those are ever rebuilt.
--
-- Every statement is idempotent — re-running is harmless.

-- 1. Signups. `email unique` is load-bearing: the route handler swallows the
--    resulting 23505 so a repeat signup reads as success to the visitor
--    instead of an error. Drop the constraint and duplicates start piling up.
create table if not exists public.pervyukt_signups (
  id         bigint generated always as identity primary key,
  email      text        not null unique,
  created_at timestamptz not null default now()
);

-- 2. Contacts. Columns mirror what the handler inserts; the server already
--    trims and length-caps every value, so the text columns stay unbounded
--    rather than duplicating those limits in two places.
create table if not exists public.pervyukt_contacts (
  id         bigint generated always as identity primary key,
  name       text        not null,
  email      text        not null,
  mobile     text,
  purpose    text,
  message    text,
  created_at timestamptz not null default now()
);

-- 3. RLS on, with no policies. service_role bypasses RLS, so /api/submit keeps
--    working; everyone else gets nothing. This is the state the Peshagi tables
--    were dragged back to after the anon key was found writing spam straight
--    into /rest/v1/contacts — start here rather than repeating that.
alter table public.pervyukt_signups  enable row level security;
alter table public.pervyukt_contacts enable row level security;

-- 4. Belt and braces: no table grants either, so a permissive policy added by
--    accident later still doesn't open a write path.
revoke all on public.pervyukt_signups  from anon, authenticated;
revoke all on public.pervyukt_contacts from anon, authenticated;

-- 5. Verify. Both queries should come back empty.
select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('pervyukt_contacts', 'pervyukt_signups');

select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('pervyukt_contacts', 'pervyukt_signups')
  and grantee in ('anon', 'authenticated');
