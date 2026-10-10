-- KinetoFlow — protocoale = șabloane de exerciții (fără structură pe săptămâni)
-- Rulează în Supabase → SQL Editor.

create table if not exists public.training_protocols (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  notes text,
  region text,
  difficulty text,
  clinic_name text not null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migrare de la versiunea cu duration_weeks
alter table public.training_protocols drop column if exists duration_weeks;

comment on table public.training_protocols is
  'Șabloane de exerciții reutilizabile per cabinet (clinic_name). Fără structură pe săptămâni.';

create index if not exists training_protocols_clinic_name_idx
  on public.training_protocols (clinic_name);

create index if not exists training_protocols_created_at_idx
  on public.training_protocols (created_at desc);

alter table public.training_protocols enable row level security;
alter table public.training_protocols force row level security;

revoke all on public.training_protocols from anon, public;
grant select, insert, update, delete on public.training_protocols to authenticated;
grant select, insert, update, delete on public.training_protocols to service_role;

drop policy if exists training_protocols_service_role on public.training_protocols;
create policy training_protocols_service_role
  on public.training_protocols
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists training_protocols_clinic_select on public.training_protocols;
create policy training_protocols_clinic_select
  on public.training_protocols
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.clinic_profiles me
      where me.user_id = auth.uid()
        and lower(btrim(me.clinic_name)) = lower(btrim(training_protocols.clinic_name))
    )
  );

drop policy if exists training_protocols_clinic_insert on public.training_protocols;
create policy training_protocols_clinic_insert
  on public.training_protocols
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.clinic_profiles me
      where me.user_id = auth.uid()
        and lower(btrim(me.clinic_name)) = lower(btrim(training_protocols.clinic_name))
    )
  );

drop policy if exists training_protocols_clinic_update on public.training_protocols;
create policy training_protocols_clinic_update
  on public.training_protocols
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.clinic_profiles me
      where me.user_id = auth.uid()
        and lower(btrim(me.clinic_name)) = lower(btrim(training_protocols.clinic_name))
    )
  )
  with check (
    exists (
      select 1
      from public.clinic_profiles me
      where me.user_id = auth.uid()
        and lower(btrim(me.clinic_name)) = lower(btrim(training_protocols.clinic_name))
    )
  );

drop policy if exists training_protocols_clinic_delete on public.training_protocols;
create policy training_protocols_clinic_delete
  on public.training_protocols
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.clinic_profiles me
      where me.user_id = auth.uid()
        and lower(btrim(me.clinic_name)) = lower(btrim(training_protocols.clinic_name))
    )
  );

-- Exercițiile din șablon (snapshot + id din bibliotecă / catalog)
create table if not exists public.training_protocol_exercises (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references public.training_protocols (id) on delete cascade,
  library_exercise_id text,
  title text not null,
  description text,
  video_url text,
  sets integer,
  reps integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.training_protocol_exercises is
  'Exerciții dintr-un protocol-șablon. library_exercise_id poate fi UUID din exercise_library sau id din catalogul static.';

create index if not exists training_protocol_exercises_protocol_idx
  on public.training_protocol_exercises (protocol_id, sort_order);

alter table public.training_protocol_exercises enable row level security;
alter table public.training_protocol_exercises force row level security;

revoke all on public.training_protocol_exercises from anon, public;
grant select, insert, update, delete on public.training_protocol_exercises to authenticated;
grant select, insert, update, delete on public.training_protocol_exercises to service_role;

drop policy if exists training_protocol_exercises_service_role on public.training_protocol_exercises;
create policy training_protocol_exercises_service_role
  on public.training_protocol_exercises
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists training_protocol_exercises_clinic_all on public.training_protocol_exercises;
create policy training_protocol_exercises_clinic_all
  on public.training_protocol_exercises
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.training_protocols p
      join public.clinic_profiles me on me.user_id = auth.uid()
      where p.id = training_protocol_exercises.protocol_id
        and lower(btrim(me.clinic_name)) = lower(btrim(p.clinic_name))
    )
  )
  with check (
    exists (
      select 1
      from public.training_protocols p
      join public.clinic_profiles me on me.user_id = auth.uid()
      where p.id = training_protocol_exercises.protocol_id
        and lower(btrim(me.clinic_name)) = lower(btrim(p.clinic_name))
    )
  );

notify pgrst, 'reload schema';
