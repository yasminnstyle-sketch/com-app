-- Compacto — схема базы данных
-- Выполни этот файл целиком в Supabase: SQL Editor → New query → вставь → Run

create extension if not exists "pgcrypto";

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client text,
  status text not null default 'Новый',
  created_at timestamptz not null default now()
);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  category text,
  supplier text,
  unit text,
  price numeric,
  qty text,
  priority boolean not null default false,
  status text not null default 'Нужно',
  created_at timestamptz not null default now()
);

create table if not exists cash (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  date date not null default current_date,
  person text not null,
  purpose text,
  amount numeric not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  type text not null, -- 'Начислено' | 'Оплачено'
  amount numeric not null,
  date date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

-- Доступ: это внутренний инструмент без логина, поэтому даём анонимному
-- ключу читать и писать во все таблицы. Ссылку на сайт никому постороннему
-- не давай — у кого есть ссылка, тот может видеть и менять данные.
alter table projects enable row level security;
alter table items enable row level security;
alter table cash enable row level security;
alter table suppliers enable row level security;
alter table payments enable row level security;

create policy "allow all projects" on projects for all using (true) with check (true);
create policy "allow all items" on items for all using (true) with check (true);
create policy "allow all cash" on cash for all using (true) with check (true);
create policy "allow all suppliers" on suppliers for all using (true) with check (true);
create policy "allow all payments" on payments for all using (true) with check (true);
