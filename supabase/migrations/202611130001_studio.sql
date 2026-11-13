begin;
create extension if not exists btree_gist;
create table public.profiles (
 id uuid primary key references auth.users on delete cascade,
 full_name text not null check (length(trim(full_name)) between 2 and 120),
 phone text check (length(phone)<=50), role text not null default 'client' check(role in ('client','trainer','admin'))
);
create table public.trainers (id uuid primary key default gen_random_uuid(), profile_id uuid unique references public.profiles, name text not null check(length(trim(name)) between 2 and 120), bio text not null default '', active boolean not null default true);
create table public.working_hours (id uuid primary key default gen_random_uuid(), trainer_id uuid not null references public.trainers, weekday integer not null check(weekday between 1 and 7), start_time time not null, end_time time not null, check(start_time<end_time), exclude using gist (trainer_id with =, weekday with =, (int4range(extract(epoch from start_time)::int,extract(epoch from end_time)::int,'[)')) with &&));
create table public.time_off (id uuid primary key default gen_random_uuid(), trainer_id uuid not null references public.trainers, starts_at timestamptz not null, ends_at timestamptz not null, reason text not null default 'Odsustvo', check(ends_at>starts_at));
create table public.appointments (
 id uuid primary key default gen_random_uuid(), trainer_id uuid not null references public.trainers,
 client_id uuid references public.profiles, guest_name text, guest_contact text,
 starts_at timestamptz not null, ends_at timestamptz not null,
 status text not null default 'booked' check(status in ('booked','cancelled','completed','no_show')),
 created_at timestamptz not null default now(),
 check(ends_at=starts_at+interval '60 minutes'),
 check((client_id is not null and guest_name is null and guest_contact is null) or (client_id is null and length(trim(guest_name)) between 2 and 120)),
 exclude using gist(trainer_id with =,tstzrange(starts_at,ends_at,'[)') with &&) where(status<>'cancelled'),
 exclude using gist(client_id with =,tstzrange(starts_at,ends_at,'[)') with &&) where(status<>'cancelled' and client_id is not null)
);
create index on public.appointments(starts_at);
create index on public.appointments(client_id,starts_at);
create index on public.time_off(trainer_id,starts_at);
create function public.current_role() returns text language sql stable security definer set search_path='' as $$ select role from public.profiles where id=auth.uid() $$;
create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$ select coalesce(public.current_role()='admin',false) $$;
create function public.owns_trainer(t uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.trainers where id=t and profile_id=auth.uid()) $$;
create function public.create_profile() returns trigger language plpgsql security definer set search_path='' as $$ begin insert into public.profiles(id,full_name,phone) values(new.id,coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),'Novi korisnik'),nullif(new.raw_user_meta_data->>'phone','')); return new; end $$;
create trigger auth_profile after insert on auth.users for each row execute function public.create_profile();
-- One transactional lock serializes availability changes with booking writes.
-- A global studio lock is intentional for this small first version.
create function public.lock_studio() returns void language sql volatile set search_path='' as $$ select pg_advisory_xact_lock(78234109) $$;
create function public.slot_valid(t uuid,s timestamptz) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.trainers where id=t and active)
 and exists(select 1 from public.working_hours w where w.trainer_id=t
 and w.weekday=extract(isodow from s at time zone 'Europe/Belgrade')
 and s >= ((s at time zone 'Europe/Belgrade')::date+w.start_time) at time zone 'Europe/Belgrade'
 and s+interval '60 minutes' <= ((s at time zone 'Europe/Belgrade')::date+w.end_time) at time zone 'Europe/Belgrade'
 and mod(extract(epoch from (s-(((s at time zone 'Europe/Belgrade')::date+w.start_time) at time zone 'Europe/Belgrade')))::numeric,3600)=0)
 and not exists(select 1 from public.time_off o where o.trainer_id=t and tstzrange(o.starts_at,o.ends_at,'[)') && tstzrange(s,s+interval '60 minutes','[)'))
 $$;
create function public.guard_appointment() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform public.lock_studio();
 if TG_OP='UPDATE' then
  if (new.trainer_id,new.client_id,new.guest_name,new.guest_contact,new.starts_at,new.ends_at) is distinct from (old.trainer_id,old.client_id,old.guest_name,old.guest_contact,old.starts_at,old.ends_at) then raise exception 'RULE:Za promenu termina otkažite postojeći i zakažite novi.'; end if;
  if old.status<>'booked' then raise exception 'RULE:Ovaj termin više nije aktivan.'; end if;
  if not public.is_admin() and (old.client_id is distinct from auth.uid() or new.status<>'cancelled') then raise exception 'RULE:Nemate dozvolu.'; end if;
  if new.status='cancelled' and old.starts_at<=now() then raise exception 'RULE:Otkazivanje je moguće samo pre početka.'; end if;
  if new.status in ('completed','no_show') and old.ends_at>now() then raise exception 'RULE:Sačekajte završetak termina.'; end if;
 else
  if new.status<>'booked' or auth.uid() is null or (not public.is_admin() and (new.client_id is distinct from auth.uid() or new.guest_name is not null)) then raise exception 'RULE:Nemate dozvolu.'; end if;
  if new.starts_at<=now() or not public.slot_valid(new.trainer_id,new.starts_at) then raise exception 'RULE:Termin nije dostupan. Osvežite dostupnost.'; end if;
 end if;
 return new;
end $$;
create trigger appointment_rules before insert or update on public.appointments for each row execute function public.guard_appointment();
create function public.guard_availability() returns trigger language plpgsql security definer set search_path='' as $$ begin
 perform public.lock_studio();
 return null;
end $$;
create trigger working_lock before insert or update or delete on public.working_hours for each statement execute function public.guard_availability();
create trigger off_lock before insert or update or delete on public.time_off for each statement execute function public.guard_availability();
create trigger trainer_lock before update or delete on public.trainers for each statement execute function public.guard_availability();
create function public.check_availability_conflicts() returns trigger language plpgsql security definer set search_path='' as $$ declare conflict text; begin
 select t.name || ', ' || to_char(a.starts_at at time zone 'Europe/Belgrade','DD.MM.YYYY. HH24:MI') into conflict from public.appointments a join public.trainers t on t.id=a.trainer_id where a.status='booked' and a.ends_at>now() and not public.slot_valid(a.trainer_id,a.starts_at) order by a.starts_at limit 1;
 if conflict is not null then raise exception 'RULE:Konflikt: %. Prvo razrešite postojeće rezervacije u rasporedu.',conflict; end if; return null;
end $$;
create trigger working_conflicts after insert or update or delete on public.working_hours for each statement execute function public.check_availability_conflicts();
create trigger off_conflicts after insert or update or delete on public.time_off for each statement execute function public.check_availability_conflicts();
create trigger trainer_conflicts after update on public.trainers for each statement execute function public.check_availability_conflicts();
create function public.available_slots(p_trainer uuid,p_date date) returns table(starts_at timestamptz) language sql volatile security definer set search_path='' as $$
 select distinct s from public.working_hours w cross join lateral generate_series((p_date+w.start_time) at time zone 'Europe/Belgrade', ((p_date+w.end_time) at time zone 'Europe/Belgrade')-interval '60 minutes',interval '60 minutes') s
 where w.trainer_id=p_trainer and w.weekday=extract(isodow from p_date) and p_date between (now() at time zone 'Europe/Belgrade')::date and (now() at time zone 'Europe/Belgrade')::date+365 and s>now() and public.slot_valid(p_trainer,s)
 and not exists(select 1 from public.appointments a where a.status<>'cancelled' and (a.trainer_id=p_trainer or a.client_id=auth.uid()) and tstzrange(a.starts_at,a.ends_at,'[)') && tstzrange(s,s+interval '60 minutes','[)')) order by s
$$;
create function public.book_appointment(p_trainer uuid,p_start timestamptz,p_client uuid default null,p_guest text default null,p_contact text default null) returns uuid language plpgsql security invoker set search_path='' as $$ declare result uuid; begin
 perform public.lock_studio();
 insert into public.appointments(trainer_id,client_id,guest_name,guest_contact,starts_at,ends_at) values(p_trainer,case when public.is_admin() then p_client else auth.uid() end,p_guest,p_contact,p_start,p_start+interval '60 minutes') returning id into result; return result;
end $$;
alter table public.profiles enable row level security;
alter table public.trainers enable row level security;
alter table public.working_hours enable row level security;
alter table public.time_off enable row level security;
alter table public.appointments enable row level security;
create policy profile_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin() or exists(select 1 from public.appointments a where a.client_id=profiles.id and public.owns_trainer(a.trainer_id)));
create policy profile_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy trainer_read on public.trainers for select using(active or public.is_admin() or public.owns_trainer(id));
create policy trainer_admin on public.trainers for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy working_read on public.working_hours for select using(true);
create policy working_admin on public.working_hours for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy off_read on public.time_off for select to authenticated using(public.is_admin() or public.owns_trainer(trainer_id));
create policy off_admin on public.time_off for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy appointment_read on public.appointments for select to authenticated using(client_id=auth.uid() or public.is_admin() or public.owns_trainer(trainer_id));
create policy appointment_insert on public.appointments for insert to authenticated with check(public.is_admin() or (client_id=auth.uid() and guest_name is null and status='booked'));
create policy appointment_update on public.appointments for update to authenticated using(public.is_admin() or client_id=auth.uid()) with check(public.is_admin() or client_id=auth.uid());
revoke all on public.profiles,public.trainers,public.working_hours,public.time_off,public.appointments from anon,authenticated;
grant select on public.trainers,public.working_hours to anon,authenticated;
grant select on public.profiles,public.time_off,public.appointments to authenticated;
grant update(full_name,phone) on public.profiles to authenticated;
grant insert,update,delete on public.trainers,public.working_hours,public.time_off to authenticated;
grant insert on public.appointments to authenticated;
grant update(status) on public.appointments to authenticated;
revoke execute on function
 public.current_role(),public.is_admin(),public.owns_trainer(uuid),public.create_profile(),
 public.lock_studio(),public.slot_valid(uuid,timestamptz),public.guard_appointment(),
 public.guard_availability(),public.check_availability_conflicts(),
 public.available_slots(uuid,date),public.book_appointment(uuid,timestamptz,uuid,text,text)
 from public,anon,authenticated;
grant execute on function public.current_role(),public.is_admin(),public.owns_trainer(uuid),public.lock_studio() to authenticated;
grant execute on function public.available_slots(uuid,date) to anon,authenticated;
grant execute on function public.current_role(),public.is_admin(),public.owns_trainer(uuid) to anon;
grant execute on function public.book_appointment(uuid,timestamptz,uuid,text,text) to authenticated;
commit;
