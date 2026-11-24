-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor).
-- Makes every user's offers private, and adds the tables the API uses for
-- daily usage limits and phone/overlay keys.

-- 1) Offers: each user can only see and change their own rows.
alter table public.offers enable row level security;

drop policy if exists "offers_select_own" on public.offers;
drop policy if exists "offers_insert_own" on public.offers;
drop policy if exists "offers_delete_own" on public.offers;
create policy "offers_select_own" on public.offers for select using (auth.uid() = user_id);
create policy "offers_insert_own" on public.offers for insert with check (auth.uid() = user_id);
create policy "offers_delete_own" on public.offers for delete using (auth.uid() = user_id);

-- Offers saved before this change with no owner: assign them to yourself, then delete the rest.
-- Replace the email, uncomment, and run:
-- update public.offers set user_id = (select id from auth.users where email = '<YOUR_EMAIL>') where user_id is null;
-- delete from public.offers where user_id is null;

-- 2) Daily usage counters (written only by the API with the service role).
create table if not exists public.usage_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  day date not null,
  count int not null default 0,
  primary key (user_id, kind, day)
);
alter table public.usage_counters enable row level security;

create or replace function public.consume_usage(p_user_id uuid, p_kind text, p_day date, p_limit int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into public.usage_counters (user_id, kind, day, count)
  values (p_user_id, p_kind, p_day, 1)
  on conflict (user_id, kind, day)
  do update set count = public.usage_counters.count + 1
  where public.usage_counters.count < p_limit
  returning count into v_count;

  return v_count is not null;
end;
$$;

revoke execute on function public.consume_usage(uuid, text, date, int) from public, anon, authenticated;
grant execute on function public.consume_usage(uuid, text, date, int) to service_role;

-- 3) Phone / overlay keys (one per user; only the hash is stored).
create table if not exists public.device_keys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  key_hash text not null unique,
  created_at timestamptz not null default now()
);
alter table public.device_keys enable row level security;

-- 4) Check for older policies that could still expose offers. This should list only the three above:
-- select policyname, cmd, qual from pg_policies where tablename = 'offers';
