-- KinetoFlow — terapeut asignat pe pacient (solo / la comun / per terapeut)
-- Rulează în Supabase: SQL Editor → New query → Run

alter table public.patients
  add column if not exists assigned_therapist_id uuid;

update public.patients
set assigned_therapist_id = coalesce(assigned_therapist_id, therapist_id, user_id)
where assigned_therapist_id is null;

update public.patients p
set assigned_therapist_id = null
where p.assigned_therapist_id is not null
  and not exists (
    select 1
    from public.clinic_profiles cp
    where cp.user_id = p.assigned_therapist_id
  )
  and not exists (
    select 1
    from auth.users u
    where u.id = p.assigned_therapist_id
  );

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'patients_assigned_therapist_id_fkey'
  ) then
    begin
      alter table public.patients
        add constraint patients_assigned_therapist_id_fkey
        foreign key (assigned_therapist_id)
        references public.clinic_profiles (user_id)
        on delete set null;
    exception
      when undefined_table then
        null;
      when invalid_foreign_key then
        alter table public.patients
          add constraint patients_assigned_therapist_id_fkey
          foreign key (assigned_therapist_id)
          references auth.users (id)
          on delete set null;
    end;
  end if;
end $$;

create index if not exists patients_assigned_therapist_id_idx
  on public.patients (assigned_therapist_id);

create index if not exists patients_clinic_assigned_idx
  on public.patients (clinic_id, assigned_therapist_id);

create or replace function public.patients_enforce_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    if tg_op = 'INSERT' then
      new.clinic_id := public.current_clinic_id();
      new.user_id := coalesce(new.user_id, auth.uid());
      new.therapist_id := coalesce(new.therapist_id, auth.uid());
      new.assigned_therapist_id := coalesce(new.assigned_therapist_id, auth.uid());
    elsif tg_op = 'UPDATE' then
      new.clinic_id := old.clinic_id;
      new.user_id := old.user_id;
      new.therapist_id := old.therapist_id;
    end if;
  else
    if new.clinic_id is null then
      new.clinic_id := coalesce(new.user_id, new.therapist_id);
    end if;
    if tg_op = 'INSERT' then
      new.assigned_therapist_id := coalesce(new.assigned_therapist_id, new.therapist_id, new.user_id);
    end if;
  end if;
  return new;
end;
$$;
