-- 1) Table des événements
create table if not exists public.events (
  id                text primary key,
  title             text not null,
  description       text,
  startDate         timestamptz not null,
  endDate           timestamptz not null,
  location          text,
  color             text not null,
  isAllDay          boolean not null default false,
  reminder          jsonb,
  recurrence        jsonb,
  participants      jsonb,
  createdBy         uuid not null references auth.users(id) on delete cascade,
  createdAt         timestamptz not null default now(),
  updatedAt         timestamptz not null default now(),
  isPrivate         boolean not null default false,
  tags              text[] not null default '{}'::text[],
  attachments       text[] default '{}'::text[],
  categoryId        text not null,
  categoryName      text not null,
  categoryColor     text not null,
  categoryIcon      text not null,
  weatherJson       jsonb
);

-- Index utiles
create index if not exists events_createdby_idx on public.events (createdBy);
create index if not exists events_startdate_idx on public.events (startDate);

-- 2) RLS (Row Level Security)
alter table public.events enable row level security;

-- 3) Policies (propriétaire uniquement)
-- Lire ses propres événements
create policy "events_select_own"
on public.events for select
to authenticated
using (createdBy = auth.uid());

-- Insérer (doit appartenir à l’utilisateur)
create policy "events_insert_own"
on public.events for insert
to authenticated
with check (createdBy = auth.uid());

-- Mettre à jour (doit appartenir à l’utilisateur)
create policy "events_update_own"
on public.events for update
to authenticated
using (createdBy = auth.uid())
with check (createdBy = auth.uid());

-- Supprimer (doit appartenir à l’utilisateur)
create policy "events_delete_own"
on public.events for delete
to authenticated
using (createdBy = auth.uid());

-- 4) Trigger pour updatedAt
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at on public.events;
create trigger trg_set_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

