-- Bloom: reports, developer moderation and bans (needed for App Store / Google Play user content rules)

-- 1) anyone can report a post, comment, person, chat message or Mochi reply
create table if not exists public.reports (
  id bigint generated always as identity primary key,
  reporter uuid not null default auth.uid() references auth.users on delete cascade,
  kind text not null check (kind in ('post', 'comment', 'user', 'message', 'ai')),
  target text not null,
  reason text,
  details text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
drop policy if exists "send report" on public.reports;
create policy "send report" on public.reports for insert to authenticated with check (reporter = auth.uid());

-- helper: is the person asking the developer?
create or replace function public.i_am_dev() returns boolean
language sql stable security definer set search_path = public as $$ select public.flag_dev(auth.uid()) $$;

drop policy if exists "dev reads reports" on public.reports;
create policy "dev reads reports" on public.reports for select to authenticated using (public.i_am_dev());
drop policy if exists "dev handles reports" on public.reports;
create policy "dev handles reports" on public.reports for update to authenticated using (public.i_am_dev());

-- 2) the developer can remove anyone's post or comment
drop policy if exists "dev deletes posts" on public.posts;
create policy "dev deletes posts" on public.posts for delete to authenticated using (public.i_am_dev());
drop policy if exists "dev deletes comments" on public.comments;
create policy "dev deletes comments" on public.comments for delete to authenticated using (public.i_am_dev());

-- 3) bans: banned people can't post, comment or message
alter table public.profiles add column if not exists banned boolean not null default false;
create or replace function public.flag_banned(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$ select coalesce((select banned from public.profiles where id = uid), false) $$;

create or replace function public.profiles_guard() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.is_dev := public.flag_dev(new.id);
    new.vip_until := public.flag_vip_until(new.id);
    new.banned := public.flag_banned(new.id);
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

-- the developer bans / unbans through this function (normal users can't)
create or replace function public.set_ban(uid uuid, ban boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.flag_dev(auth.uid()) then raise exception 'not_allowed'; end if;
  update public.profiles set banned = ban where id = uid and not is_dev;
end $$;

drop policy if exists "add own post" on public.posts;
create policy "add own post" on public.posts for insert to authenticated with check (user_id = auth.uid() and not public.flag_banned(auth.uid()));
drop policy if exists "add own comment" on public.comments;
create policy "add own comment" on public.comments for insert to authenticated with check (user_id = auth.uid() and not public.flag_banned(auth.uid()));
drop policy if exists "message friends" on public.messages;
create policy "message friends" on public.messages for insert to authenticated with check (sender = auth.uid() and public.are_friends(sender, receiver) and not public.flag_banned(auth.uid()));
