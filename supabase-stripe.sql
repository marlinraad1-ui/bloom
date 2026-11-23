-- Bloom VIP payments with Stripe
-- Who is which Stripe customer. Nobody can read or change this from the app; only the server function can.
create table if not exists public.vip_billing (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer text not null unique,
  status text,
  updated_at timestamptz default now()
);
alter table public.vip_billing enable row level security;
-- (no policies on purpose: only the service role used by the "vip" edge function can touch it)
