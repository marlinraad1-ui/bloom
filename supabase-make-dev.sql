-- Make one account the Bloom developer. Replace TEMP_NAME with the name the developer picked.
-- Run in Supabase > SQL Editor. Only the database owner can do this.
update public.profiles set is_dev = true, name = 'stasia' where lower(name) = lower('TEMP_NAME');

-- everyone who already joined follows the developer too
insert into public.friendships (requester, addressee, status)
select d.id, p.id, 'accepted' from public.profiles d, public.profiles p
where d.is_dev and p.id <> d.id
on conflict do nothing;
