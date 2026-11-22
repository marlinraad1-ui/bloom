-- Bloom: unique names, the developer account, auto-follow the developer
-- Run once in Supabase > SQL Editor (after supabase-friends.sql)

alter table public.profiles add column if not exists is_dev boolean not null default false;

-- names are unique, ignoring upper/lower case
create unique index if not exists profiles_name_unique on public.profiles (lower(name));

-- normal users can't make themselves the developer, and can't use reserved names
create or replace function public.profiles_guard() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then new.is_dev := false; else new.is_dev := old.is_dev; end if;
    if not new.is_dev and (lower(new.name) ~ '(dev|stasia|admin|bloom team|moderator)') then
      raise exception 'reserved_name' using errcode = 'P0001';
    end if;
  end if;
  new.name := btrim(new.name);
  return new;
end $$;
drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before insert or update on public.profiles for each row execute function public.profiles_guard();

-- everyone automatically follows (is friends with) the developer
create or replace function public.follow_dev() returns trigger
language plpgsql security definer set search_path = public as $$
declare dev uuid;
begin
  select id into dev from public.profiles where is_dev limit 1;
  if dev is not null and dev <> new.id then
    insert into public.friendships (requester, addressee, status) values (dev, new.id, 'accepted')
    on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists follow_dev on public.profiles;
create trigger follow_dev after insert on public.profiles for each row execute function public.follow_dev();

-- nobody can remove the friendship with the developer
drop policy if exists "remove friendship" on public.friendships;
create policy "remove friendship" on public.friendships for delete to authenticated using (
  auth.uid() in (requester, addressee)
  and not exists (select 1 from public.profiles p where p.is_dev and p.id in (requester, addressee))
);
