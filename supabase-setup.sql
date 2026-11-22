-- Bloom community: run this once in Supabase > SQL Editor

-- POSTS
create table if not exists public.posts (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  avatar text not null default '🌸' check (char_length(avatar) <= 16),
  body text check (char_length(body) <= 1000),
  photo_url text,
  stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- LIKES
create table if not exists public.likes (
  post_id bigint not null references public.posts on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- COMMENTS
create table if not exists public.comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  avatar text not null default '🌸' check (char_length(avatar) <= 16),
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists comments_post_idx on public.comments (post_id, created_at);

-- SECURITY: everyone can read, you can only write/delete your own stuff
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;

drop policy if exists "read posts" on public.posts;
drop policy if exists "add own post" on public.posts;
drop policy if exists "delete own post" on public.posts;
create policy "read posts" on public.posts for select using (true);
create policy "add own post" on public.posts for insert to authenticated with check (user_id = auth.uid());
create policy "delete own post" on public.posts for delete to authenticated using (user_id = auth.uid());

drop policy if exists "read likes" on public.likes;
drop policy if exists "add own like" on public.likes;
drop policy if exists "remove own like" on public.likes;
create policy "read likes" on public.likes for select using (true);
create policy "add own like" on public.likes for insert to authenticated with check (user_id = auth.uid());
create policy "remove own like" on public.likes for delete to authenticated using (user_id = auth.uid());

drop policy if exists "read comments" on public.comments;
drop policy if exists "add own comment" on public.comments;
drop policy if exists "delete own comment" on public.comments;
create policy "read comments" on public.comments for select using (true);
create policy "add own comment" on public.comments for insert to authenticated with check (user_id = auth.uid());
create policy "delete own comment" on public.comments for delete to authenticated using (user_id = auth.uid());

-- PHOTO STORAGE (public bucket, each user uploads into their own folder)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "upload own photos" on storage.objects;
drop policy if exists "delete own photos" on storage.objects;
drop policy if exists "see own photos" on storage.objects;
create policy "see own photos" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "upload own photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own photos" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
