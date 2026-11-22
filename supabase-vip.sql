-- Bloom VIP: membership date + profile customizer
-- Run once in Supabase > SQL Editor (after supabase-dev.sql)

alter table public.profiles add column if not exists vip_until timestamptz;
alter table public.profiles add column if not exists banner text;       -- preset key like 'aurora' or a photo/GIF/video URL
alter table public.profiles add column if not exists name_fx text;      -- name effect for VIPs
alter table public.profiles add column if not exists ring text;         -- avatar ring for VIPs

-- users can't give themselves VIP or developer status
create or replace function public.profiles_guard() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then new.is_dev := false; new.vip_until := null;
    else new.is_dev := old.is_dev; new.vip_until := old.vip_until; end if;
    if not new.is_dev and (lower(new.name) ~ '(dev|stasia|admin|bloom team|moderator)') then
      raise exception 'reserved_name' using errcode = 'P0001';
    end if;
  end if;
  new.name := btrim(new.name);
  return new;
end $$;

-- is this user VIP right now? (the developer always is)
create or replace function public.is_vip(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_dev or coalesce(vip_until > now(), false) from public.profiles where id = uid), false)
$$;

-- give someone VIP by hand (example, run as the database owner):
-- update public.profiles set vip_until = now() + interval '1 year' where lower(name) = lower('THEIR_NAME');

-- the AI food calculator asks "am I VIP?" with the user's own login
create or replace function public.is_vip_me() returns boolean
language sql stable security definer set search_path = public as $$ select public.is_vip(auth.uid()) $$;
grant execute on function public.is_vip_me() to authenticated, anon;

-- live banners: allow GIFs and short videos (up to 8 MB)
update storage.buckets set file_size_limit = 8388608,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
where id = 'photos';

-- VIP-only profile style is cleared when someone isn't VIP
create or replace function public.profiles_guard() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then new.is_dev := false; new.vip_until := null;
    else new.is_dev := old.is_dev; new.vip_until := old.vip_until; end if;
    if not new.is_dev and (lower(new.name) ~ '(dev|stasia|admin|bloom team|moderator)') then
      raise exception 'reserved_name' using errcode = 'P0001';
    end if;
    if not (new.is_dev or coalesce(new.vip_until > now(), false)) then
      new.banner := null; new.name_fx := null; new.ring := null;
    end if;
  end if;
  new.name := btrim(new.name);
  return new;
end $$;

-- FIX: saving a profile is an "upsert", which runs the INSERT check first.
-- Read the stored dev/VIP flags instead of trusting what the app sends.
create or replace function public.flag_dev(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$ select coalesce((select is_dev from public.profiles where id = uid), false) $$;
create or replace function public.flag_vip_until(uid uuid) returns timestamptz
language sql stable security definer set search_path = public as $$ select vip_until from public.profiles where id = uid $$;

create or replace function public.profiles_guard() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.is_dev := public.flag_dev(new.id);
    new.vip_until := public.flag_vip_until(new.id);
    if not new.is_dev and (lower(new.name) ~ '(dev|stasia|admin|bloom team|moderator)') then
      raise exception 'reserved_name' using errcode = 'P0001';
    end if;
    if not (new.is_dev or coalesce(new.vip_until > now(), false)) then
      new.banner := null; new.name_fx := null; new.ring := null;
    end if;
  end if;
  new.name := btrim(new.name);
  return new;
end $$;
