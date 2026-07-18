-- ============================================================================
-- DIOGO.DEV — esquema da base de dados
-- Cola este ficheiro inteiro no SQL Editor do Supabase (Run) — uma vez só.
-- ============================================================================

-- ---------- PROJETOS ----------
create table public.projects (
  id         text primary key,
  title      text not null,
  slug       text unique not null,
  year       text not null,
  role       jsonb not null,            -- string ou {pt, en}
  summary    jsonb not null,
  tagline    jsonb not null,
  tags       text[] not null default '{}',
  metrics    jsonb not null default '[]',
  accent     text not null default '#E5E5E7',
  featured   text not null default 'small',   -- tall | wide | small
  status     text not null default 'hidden',  -- published | hidden
  github     text,
  demo       text,
  course     jsonb not null default '""',
  team       jsonb,
  story      jsonb,
  build      jsonb,
  position   int not null default 0,          -- ordem na grelha
  updated_at timestamptz not null default now()
);

-- RLS (Row Level Security): a chave pública "anon" só pode fazer o que
-- estas políticas permitirem — é o que torna seguro tê-la no site.
alter table public.projects enable row level security;

-- qualquer visitante VÊ projetos publicados; tu (autenticado) vês todos
create policy "ler projetos" on public.projects
  for select using (status = 'published' or auth.role() = 'authenticated');

-- só quem tem login (tu) pode criar/alterar/apagar
create policy "criar projetos" on public.projects
  for insert with check (auth.role() = 'authenticated');
create policy "editar projetos" on public.projects
  for update using (auth.role() = 'authenticated');
create policy "apagar projetos" on public.projects
  for delete using (auth.role() = 'authenticated');

-- ---------- MENSAGENS ----------
create table public.messages (
  id         bigint generated always as identity primary key,
  name       text not null,
  email      text not null,
  subject    text not null default 'geral',
  message    text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- qualquer visitante pode ENVIAR uma mensagem (o formulário de contacto)…
create policy "enviar mensagens" on public.messages
  for insert with check (true);

-- …mas só tu podes lê-las, marcá-las como lidas ou apagá-las
create policy "ler mensagens" on public.messages
  for select using (auth.role() = 'authenticated');
create policy "atualizar mensagens" on public.messages
  for update using (auth.role() = 'authenticated');
create policy "apagar mensagens" on public.messages
  for delete using (auth.role() = 'authenticated');
