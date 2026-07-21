-- ============================================================================
-- Nafsam private chat — Supabase schema
-- Run this in your Supabase project: Dashboard -> SQL Editor -> New query ->
-- paste the whole file -> Run.
--
-- It creates:
--   * public.chat_identity()    (maps the signed-in email -> 'star' | 'ilham')
--   * public.messages           (chat history, with row-level security)
--   * public.read_state         (durable per-user read pointer for "seen")
--   * a BEFORE INSERT trigger   (forces sender_id / sender_name from the account
--                                so identity can NOT be spoofed by the client)
--   * RLS policies              (ONLY the two known accounts can read/write)
--   * realtime publication      (live message + read-state delivery)
--   * storage bucket chat-images + storage policies (image messages)
--
-- This file is idempotent: safe to re-run after an upgrade. If you already had
-- an earlier version deployed, just paste and Run again to add public.read_state.
--
-- AFTER running this, create the two login accounts (see CHAT_SETUP.md):
--   Authentication -> Users -> Add user  (keep "Auto Confirm User" ON)
--     star@nafsam.app   password: nafsam-ska
--     ilham@nafsam.app  password: nafsam-ilham
--   (Chat passwords are fixed per identity, NOT derived from the login word, so
--    any of Ilham's valid site words opens the chat. See CHAT_SETUP.md.)
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
-- Read state — a durable per-user read pointer so "seen" survives offline /
-- reload / a fresh device. Presence broadcasts the live read marker, but it is
-- ephemeral: if the peer reads while you are offline and you both then go
-- offline, the presence signal is gone. This table persists the last-read
-- timestamp per identity (one row each) so the sender always learns their
-- message was seen, even on a brand-new device. The client merges this with the
-- live presence value (takes the max), so the realtime path is unchanged.
-- ---------------------------------------------------------------------------
create table if not exists public.read_state (
  identity     text primary key check (identity in ('star', 'ilham')),
  last_read_at timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.read_state enable row level security;

grant select, insert, update on public.read_state to authenticated;

-- Force the row's identity to come from the authenticated account (never the
-- client payload) and keep updated_at fresh. Mirrors chat_set_sender so neither
-- account can write the other's read pointer.
create or replace function public.read_state_set_identity()
returns trigger
language plpgsql
as $$
declare
  ident text := public.chat_identity();
begin
  if ident is null then
    raise exception 'not a chat participant';
  end if;
  new.identity := ident;
  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists read_state_set_identity_trg on public.read_state;
create trigger read_state_set_identity_trg
  before insert or update on public.read_state
  for each row execute function public.read_state_set_identity();

-- Both known accounts may read each other's pointer (that is the whole point).
drop policy if exists "read_state_select" on public.read_state;
create policy "read_state_select" on public.read_state
  for select to authenticated
  using (public.chat_identity() is not null);

-- A user may only create their own pointer row (the trigger stamps identity).
drop policy if exists "read_state_insert_own" on public.read_state;
create policy "read_state_insert_own" on public.read_state
  for insert to authenticated
  with check (identity = public.chat_identity());

-- A user may only update their own pointer row, never the peer's.
drop policy if exists "read_state_update_own" on public.read_state;
create policy "read_state_update_own" on public.read_state
  for update to authenticated
  using (identity = public.chat_identity())
  with check (identity = public.chat_identity());

-- ---------------------------------------------------------------------------
-- Realtime — broadcast row changes on public.messages and public.read_state
-- ---------------------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception
    when duplicate_object then null; -- already added
  end;
  begin
    alter publication supabase_realtime add table public.read_state;
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

-- ============================================================================
-- Activity log — the "monitoring room" (غرفة المراقبة)
-- ----------------------------------------------------------------------------
-- Records what viewers do inside the Nafsam archive (login, page views, video /
-- photo opens, heartbeats, leaves) so the OWNER can review activity live and
-- day-by-day from the separate /monitor/ app.
--
-- Privacy model (IMPORTANT):
--   * INSERT: the two archive accounts (star, ilham) write their own events.
--     A BEFORE INSERT trigger stamps `identity` from the signed-in account, so
--     the client can NOT forge who did what.
--   * SELECT: ONLY a dedicated reader account, monitor@nafsam.app, may read the
--     log. Its password is TYPED by the owner in the /monitor/ app and is never
--     shipped in any frontend bundle — unlike the chat passwords. This is why
--     we do NOT reuse the star account to read logs (star's password is public
--     in the telegram-call bundle, so anyone could read the log with it).
--   * The log is append-only: there are no UPDATE/DELETE policies, so no
--     authenticated role can rewrite or erase history through the API.
--
-- AFTER running this file, create the reader account in the Supabase dashboard:
--   Authentication -> Users -> Add user  (keep "Auto Confirm User" ON)
--     monitor@nafsam.app   password: the MONITOR_PASSWORD constant in
--     artifacts/monitor/src/lib/supabase.ts (high-entropy; deliberately NOT
--     the public `nafsam-<x>` pattern, which anyone could guess online).
--   The /monitor/ login screen accepts the star words and maps them to that
--   fixed password. The monitor app is workspace-only and never part of the
--   public deploys, so the mapping is not shipped to visitors. A different
--   private password typed as-is also works instead of the word login.
-- ============================================================================

-- Reader gate: only the monitor account may read the activity log.
create or replace function public.activity_reader()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'monitor@nafsam.app'
$$;

create table if not exists public.activity_events (
  id         uuid primary key default gen_random_uuid(),
  identity   text not null check (identity in ('star', 'ilham')),
  kind       text not null,
  label      text,
  meta       jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_events_created_at_idx
  on public.activity_events (created_at);
create index if not exists activity_events_identity_created_idx
  on public.activity_events (identity, created_at);

alter table public.activity_events enable row level security;

-- Base privileges. Append-only: no update/delete granted, so history is durable.
grant usage on schema public to authenticated;
grant select, insert on public.activity_events to authenticated;

-- Force identity to come from the signed-in account, never the client payload.
create or replace function public.activity_set_identity()
returns trigger
language plpgsql
as $$
declare
  ident text := public.chat_identity();
begin
  if ident is null then
    raise exception 'not an archive participant';
  end if;
  new.identity := ident;
  return new;
end
$$;

drop trigger if exists activity_set_identity_trg on public.activity_events;
create trigger activity_set_identity_trg
  before insert on public.activity_events
  for each row execute function public.activity_set_identity();

-- Only the monitor reader account may read the log.
drop policy if exists "activity_select_reader" on public.activity_events;
create policy "activity_select_reader" on public.activity_events
  for select to authenticated
  using (public.activity_reader());

-- The two archive accounts may append their own events (trigger stamps identity).
drop policy if exists "activity_insert_own" on public.activity_events;
create policy "activity_insert_own" on public.activity_events
  for insert to authenticated
  with check (public.chat_identity() is not null);

-- Live delivery to the monitoring room (realtime respects RLS, so only the
-- monitor account actually receives rows).
do $$
begin
  begin
    alter publication supabase_realtime add table public.activity_events;
  exception
    when duplicate_object then null; -- already added
  end;
end $$;
