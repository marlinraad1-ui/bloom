-- Bloom "Together": live fasting, weekly leaderboards and group fasts (public to everyone in Bloom)

-- people can hide themselves from the boards and the live list
alter table public.profiles add column if not exists on_boards boolean not null default true;

-- who is fasting right now and until when
create table if not exists public.fast_live (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  started_at timestamptz not null,
  goal_hours int not null,
  kind text not null default 'water',
  updated_at timestamptz not null default now()
);
alter table public.fast_live enable row level security;
drop policy if exists "see live fasts" on public.fast_live;
create policy "see live fasts" on public.fast_live for select to authenticated using (true);
drop policy if exists "my live fast" on public.fast_live;
create policy "my live fast" on public.fast_live for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and not public.flag_banned(auth.uid()));

-- weekly numbers for the leaderboards (week = the Monday it starts)
create table if not exists public.weekly_stats (
  user_id uuid not null references public.profiles (id) on delete cascade,
  week date not null,
  fast_hours numeric not null default 0 check (fast_hours >= 0 and fast_hours <= 168),
  steps int not null default 0 check (steps >= 0 and steps <= 1000000),
  kg_lost numeric check (kg_lost is null or (kg_lost >= -20 and kg_lost <= 15)),
  updated_at timestamptz not null default now(),
  primary key (user_id, week)
);
alter table public.weekly_stats enable row level security;
drop policy if exists "see weekly stats" on public.weekly_stats;
create policy "see weekly stats" on public.weekly_stats for select to authenticated using (true);
drop policy if exists "my weekly stats" on public.weekly_stats;
create policy "my weekly stats" on public.weekly_stats for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and not public.flag_banned(auth.uid()));

-- group fasts
create table if not exists public.fast_groups (
  id bigint generated always as identity primary key,
  owner uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 40),
  emoji text not null default '🔥',
  goal_hours int not null check (goal_hours between 12 and 360),
  starts_at timestamptz not null,
  created_at timestamptz not null default now()
);
create table if not exists public.fast_group_members (
  group_id bigint not null references public.fast_groups (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
alter table public.fast_groups enable row level security;
alter table public.fast_group_members enable row level security;
drop policy if exists "see groups" on public.fast_groups;
create policy "see groups" on public.fast_groups for select to authenticated using (true);
drop policy if exists "make group" on public.fast_groups;
create policy "make group" on public.fast_groups for insert to authenticated with check (owner = auth.uid() and not public.flag_banned(auth.uid()));
drop policy if exists "remove my group" on public.fast_groups;
create policy "remove my group" on public.fast_groups for delete to authenticated using (owner = auth.uid() or public.i_am_dev());
drop policy if exists "see members" on public.fast_group_members;
create policy "see members" on public.fast_group_members for select to authenticated using (true);
drop policy if exists "join group" on public.fast_group_members;
create policy "join group" on public.fast_group_members for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "leave group" on public.fast_group_members;
create policy "leave group" on public.fast_group_members for delete to authenticated using (user_id = auth.uid());
