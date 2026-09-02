-- CampusSync initial schema
create extension if not exists "pgcrypto";

do $$ begin
  create type public.event_category as enum (
    'class', 'assignment', 'exam', 'social', 'club', 'personal'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.event_source as enum (
    'manual', 'ai_image', 'ai_text', 'google_sync'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text,
  avatar_url text,
  google_refresh_token text,
  google_calendar_id text,
  google_sync_enabled boolean not null default false,
  theme_preference text not null default 'minimal',
  streak_count integer not null default 0,
  last_checkin_date date,
  timezone text,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  category public.event_category not null default 'personal',
  start_time timestamptz not null,
  end_time timestamptz,
  all_day boolean not null default false,
  location text,
  recurrence_rule text,
  source public.event_source not null default 'manual',
  google_event_id text,
  confidence_score real,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_user_start_idx
  on public.events (user_id, start_time);

create unique index if not exists events_google_id_idx
  on public.events (user_id, google_event_id)
  where google_event_id is not null;

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  file_url text,
  raw_text_extracted text,
  created_at timestamptz not null default now()
);

create table if not exists public.upload_events (
  upload_id uuid not null references public.uploads (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  primary key (upload_id, event_id)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_updated_at on public.events;
create trigger events_updated_at
  before update on public.events
  for each row execute procedure public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.uploads enable row level security;
alter table public.upload_events enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "events_all_own" on public.events;
create policy "events_all_own" on public.events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "uploads_all_own" on public.uploads;
create policy "uploads_all_own" on public.uploads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "upload_events_all_own" on public.upload_events;
create policy "upload_events_all_own" on public.upload_events
  for all using (
    exists (
      select 1 from public.uploads u
      where u.id = upload_id and u.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.uploads u
      where u.id = upload_id and u.user_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', false)
on conflict (id) do nothing;

drop policy if exists "screenshots_select_own" on storage.objects;
create policy "screenshots_select_own" on storage.objects
  for select using (
    bucket_id = 'screenshots'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "screenshots_insert_own" on storage.objects;
create policy "screenshots_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'screenshots'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "screenshots_delete_own" on storage.objects;
create policy "screenshots_delete_own" on storage.objects
  for delete using (
    bucket_id = 'screenshots'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
