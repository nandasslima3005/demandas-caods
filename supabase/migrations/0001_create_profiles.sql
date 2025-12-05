create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text,
  orgao text,
  role text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy profiles_select_authenticated
  on public.profiles for select
  to authenticated
  using (true);

create policy profiles_insert_authenticated
  on public.profiles for insert
  to authenticated
  with check (true);

create policy profiles_update_self
  on public.profiles for update
  to authenticated
  using (true)
  with check (true);

create index if not exists profiles_email_idx on public.profiles(email);
