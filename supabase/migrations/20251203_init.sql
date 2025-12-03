-- Enums
create type priority_enum as enum ('baixa', 'media', 'alta', 'urgente');
create type status_enum as enum ('pendente', 'em_analise', 'em_andamento', 'aguardando_resposta', 'concluido');

-- Profiles
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  phone text,
  orgao text,
  role text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Requests
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  orgaoSolicitante text not null,
  tipoSolicitacao text not null,
  dataSolicitacao date not null,
  numeroSEI text not null,
  numeroSIMP text,
  assunto text not null,
  descricao text not null,
  encaminhamento text,
  prioridade priority_enum not null,
  status status_enum not null,
  posicaoFila integer,
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  createdBy uuid references public.profiles(id)
);

-- Attachments
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  requestId uuid not null references public.requests(id) on delete cascade,
  name text not null,
  type text not null,
  size integer not null,
  url text not null,
  uploadedAt timestamptz not null default now()
);

-- Timeline Events
create table if not exists public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  requestId uuid not null references public.requests(id) on delete cascade,
  date timestamptz not null,
  title text not null,
  description text,
  status status_enum not null,
  user text
);

-- Basic RLS
alter table public.profiles enable row level security;
alter table public.requests enable row level security;
alter table public.attachments enable row level security;
alter table public.timeline_events enable row level security;

-- Policies (permissive for anon key; adjust in production)
create policy "profiles_read_all" on public.profiles for select using (true);
create policy "profiles_write_all" on public.profiles for insert with check (true);
create policy "profiles_update_all" on public.profiles for update using (true);

create policy "requests_read_all" on public.requests for select using (true);
create policy "requests_write_all" on public.requests for insert with check (true);
create policy "requests_update_all" on public.requests for update using (true);
create policy "requests_delete_all" on public.requests for delete using (true);

create policy "attachments_read_all" on public.attachments for select using (true);
create policy "attachments_write_all" on public.attachments for insert with check (true);
create policy "attachments_delete_all" on public.attachments for delete using (true);

create policy "timeline_read_all" on public.timeline_events for select using (true);
create policy "timeline_write_all" on public.timeline_events for insert with check (true);
create policy "timeline_delete_all" on public.timeline_events for delete using (true);

