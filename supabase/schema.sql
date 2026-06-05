-- ============================================================================
-- Nafsam private chat — Supabase schema
-- Run this in your Supabase project: Dashboard -> SQL Editor -> New query ->
-- paste the whole file -> Run.
--
-- It creates:
--   * public.chat_identity()    (maps the signed-in email -> 'star' | 'ilham')
--   * public.messages           (chat history, with row-level security)
--   * a BEFORE INSERT trigger   (forces sender_id / sender_name from the account
--                                so identity can NOT be spoofed by the client)
--   * RLS policies              (ONLY the two known accounts can read/write)
--   * realtime publication      (live message delivery)
--   * storage bucket chat-images + storage policies (image messages)
--
-- AFTER running this, create the two login accounts (see CHAT_SETUP.md):
--   Authentication -> Users -> Add user  (keep "Auto Confirm User" ON)
--     star@nafsam.app   password: nafsam-ska
--     ilham@nafsam.app  password: nafsam-<ilham word>
--
-- IMPORTANT: turn OFF public sign-ups for this project
--   (Authentication -> Providers -> Email -> "Allow new users to sign up" OFF).
--   The whole privacy model assumes only these two accounts ever exist; the
--   policies below additionally fail closed for any other email.
-- ============================================================================

-- gen_random_uuid()
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Identity helper: the ONLY two accounts that may use the chat. Any other
-- authenticated user resolves to NULL and is denied by every policy below.
-- ---------------------------------------------------------------------------
create or replace function public.chat_identity()
returns text
language sql
stable
as $$
  select case lower(coalesce(auth.jwt() ->> 'email', ''))
    when 'star@nafsam.app'  then 'star'
    when 'ilham@nafsam.app' then 'ilham'
    else null
  end
$$;

-- ---------------------------------------------------------------------------
-- Messages table
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  sender_id   uuid not null references auth.users (id) on delete cascade,
  sender_name text not null check (sender_name in ('star', 'ilham')),
  body        text,
  image_path  text,
  created_at  timestamptz not null default now(),
  deleted     boolean not null default false,
  -- a message must carry either text or an image
  constraint messages_has_content check (body is not null or image_path is not null or deleted)
);

create index if not exists messages_created_at_idx on public.messages (created_at);

alter table public.messages enable row level security;

-- Base table privileges. RLS decides WHICH rows a user may touch, but the role
-- still needs table-level privileges to touch the table at all. Supabase does
-- not reliably auto-grant these for tables created in the SQL editor, so grant
-- them explicitly (otherwise every query fails with "permission denied").
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.messages to authenticated;

-- Force sender_id + sender_name to come from the authenticated account, never
-- from the client payload. This makes message identity un-forgeable: a client
-- cannot insert a row claiming to be the other person.
create or replace function public.chat_set_sender()
returns trigger
language plpgsql
as $$
declare
  ident text := public.chat_identity();
begin
  if ident is null then
    raise exception 'not a chat participant';
  end if;
  new.sender_id := auth.uid();
  new.sender_name := ident;
  return new;
end
$$;

drop trigger if exists chat_set_sender_trg on public.messages;
create trigger chat_set_sender_trg
  before insert on public.messages
  for each row execute function public.chat_set_sender();

-- Only the two known accounts may read the conversation.
drop policy if exists "chat_select" on public.messages;
create policy "chat_select" on public.messages
  for select to authenticated
  using (public.chat_identity() is not null);

-- Only the two known accounts may insert; the trigger stamps the real identity.
drop policy if exists "chat_insert_own" on public.messages;
create policy "chat_insert_own" on public.messages
  for insert to authenticated
  with check (public.chat_identity() is not null and sender_id = auth.uid());

-- A user may only edit (soft-delete) their own messages.
drop policy if exists "chat_update_own" on public.messages;
create policy "chat_update_own" on public.messages
  for update to authenticated
  using (public.chat_identity() is not null and sender_id = auth.uid())
  with check (sender_id = auth.uid());

-- A user may hard-delete their own messages (we use soft-delete by default).
drop policy if exists "chat_delete_own" on public.messages;
create policy "chat_delete_own" on public.messages
  for delete to authenticated
  using (public.chat_identity() is not null and sender_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Realtime — broadcast row changes on public.messages
-- ---------------------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception
    when duplicate_object then null; -- already added
  end;
end $$;

-- ---------------------------------------------------------------------------
-- Storage bucket for image messages (private)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('chat-images', 'chat-images', false)
on conflict (id) do nothing;

-- Only the two known accounts can read images (to mint short-lived signed URLs).
drop policy if exists "chat_images_read" on storage.objects;
create policy "chat_images_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'chat-images' and public.chat_identity() is not null);

-- Only the two known accounts can upload, and only into their own identity
-- folder (path is "<identity>/<file>"), so neither can spoof the other's folder.
drop policy if exists "chat_images_insert" on storage.objects;
create policy "chat_images_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'chat-images'
    and public.chat_identity() is not null
    and (storage.foldername(name))[1] = public.chat_identity()
  );

-- A user may delete only the images they uploaded.
drop policy if exists "chat_images_delete_own" on storage.objects;
create policy "chat_images_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'chat-images' and owner = auth.uid());
