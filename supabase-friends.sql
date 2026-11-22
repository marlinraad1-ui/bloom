-- Bloom friends + private chat: run once in Supabase > SQL Editor (after supabase-profiles.sql)

create table if not exists public.friendships (
  id bigint generated always as identity primary key,
  requester uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  addressee uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  check (requester <> addressee)
);
create unique index if not exists friendships_pair_idx on public.friendships (least(requester, addressee), greatest(requester, addressee));

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  sender uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  receiver uuid not null references public.profiles (id) on delete cascade,
  body text check (char_length(body) <= 2000),
  photo_url text,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (body is not null or photo_url is not null)
);
create index if not exists messages_pair_idx on public.messages (sender, receiver, created_at desc);
create index if not exists messages_receiver_idx on public.messages (receiver, read_at);

alter table public.friendships enable row level security;
alter table public.messages enable row level security;

-- are these two people friends?
create or replace function public.are_friends(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.friendships f where f.status = 'accepted'
    and ((f.requester = a and f.addressee = b) or (f.requester = b and f.addressee = a)));
$$;

drop policy if exists "see my friendships" on public.friendships;
drop policy if exists "send friend request" on public.friendships;
drop policy if exists "accept friend request" on public.friendships;
drop policy if exists "remove friendship" on public.friendships;
create policy "see my friendships" on public.friendships for select to authenticated using (auth.uid() in (requester, addressee));
create policy "send friend request" on public.friendships for insert to authenticated with check (requester = auth.uid() and status = 'pending');
create policy "accept friend request" on public.friendships for update to authenticated using (addressee = auth.uid()) with check (addressee = auth.uid());
create policy "remove friendship" on public.friendships for delete to authenticated using (auth.uid() in (requester, addressee));

drop policy if exists "see my messages" on public.messages;
drop policy if exists "message friends" on public.messages;
drop policy if exists "mark read" on public.messages;
drop policy if exists "delete my messages" on public.messages;
create policy "see my messages" on public.messages for select to authenticated using (auth.uid() in (sender, receiver));
create policy "message friends" on public.messages for insert to authenticated with check (sender = auth.uid() and public.are_friends(sender, receiver));
create policy "mark read" on public.messages for update to authenticated using (receiver = auth.uid()) with check (receiver = auth.uid());
create policy "delete my messages" on public.messages for delete to authenticated using (sender = auth.uid());

-- live updates for chat and friend requests
do $$ begin
  begin alter publication supabase_realtime add table public.messages; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.friendships; exception when duplicate_object then null; end;
end $$;
