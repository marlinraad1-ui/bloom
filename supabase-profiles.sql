-- Bloom community profiles: run once in Supabase > SQL Editor (after supabase-setup.sql)
create table if not exists public.profiles (
  id uuid primary key default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  avatar text not null default '🌸' check (char_length(avatar) <= 16),
  photo_url text,
  bio text check (char_length(bio) <= 200),
  show_weight boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "read profiles" on public.profiles;
drop policy if exists "add own profile" on public.profiles;
drop policy if exists "edit own profile" on public.profiles;
create policy "read profiles" on public.profiles for select using (true);
create policy "add own profile" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "edit own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- link posts and comments to profiles so the app can show the latest name and picture
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'posts_profile_fk') then
    alter table public.posts add constraint posts_profile_fk foreign key (user_id) references public.profiles (id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'comments_profile_fk') then
    alter table public.comments add constraint comments_profile_fk foreign key (user_id) references public.profiles (id) on delete cascade;
  end if;
end $$;
