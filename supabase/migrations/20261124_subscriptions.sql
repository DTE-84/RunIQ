-- Run once in the Supabase SQL editor. Safe to re-run.
-- Creates the subscriptions table and the function the Stripe webhook uses to write to it.

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free',
  status text not null default 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

-- In case the table already existed with fewer columns
alter table public.subscriptions add column if not exists tier text not null default 'free';
alter table public.subscriptions add column if not exists status text not null default 'active';
alter table public.subscriptions add column if not exists stripe_customer_id text;
alter table public.subscriptions add column if not exists stripe_subscription_id text;
alter table public.subscriptions add column if not exists current_period_end timestamptz;
alter table public.subscriptions add column if not exists cancel_at_period_end boolean not null default false;
alter table public.subscriptions add column if not exists updated_at timestamptz not null default now();
create unique index if not exists subscriptions_user_id_key on public.subscriptions (user_id);

-- Users can read only their own row. Only the server (service role) writes.
alter table public.subscriptions enable row level security;
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions for select to authenticated using (auth.uid() = user_id);

drop function if exists public.update_user_subscription(uuid, text, text, text, text, timestamptz, boolean);
create function public.update_user_subscription(
  p_user_id uuid,
  p_tier text,
  p_status text,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_current_period_end timestamptz,
  p_cancel_at_period_end boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions
    (user_id, tier, status, stripe_customer_id, stripe_subscription_id, current_period_end, cancel_at_period_end, updated_at)
  values
    (p_user_id, p_tier, p_status, p_stripe_customer_id, p_stripe_subscription_id, p_current_period_end, p_cancel_at_period_end, now())
  on conflict (user_id) do update set
    tier = excluded.tier,
    status = excluded.status,
    stripe_customer_id = excluded.stripe_customer_id,
    stripe_subscription_id = excluded.stripe_subscription_id,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    updated_at = now();
end;
$$;

revoke execute on function public.update_user_subscription(uuid, text, text, text, text, timestamptz, boolean) from public, anon, authenticated;
grant execute on function public.update_user_subscription(uuid, text, text, text, text, timestamptz, boolean) to service_role;

-- Give yourself free premium (replace the email, then run this part):
-- select public.update_user_subscription(
--   (select id from auth.users where email = 'YOUR_EMAIL_HERE'),
--   'annual', 'active', 'comp', 'comp', '2099-01-01T00:00:00Z', false
-- );
