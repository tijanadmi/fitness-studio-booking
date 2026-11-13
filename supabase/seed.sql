-- Development only. No real people or qualifications.
insert into public.trainers(id,name,bio) values
('10000000-0000-0000-0000-000000000001','Instruktorka 1','Privremeni profil. Predstavljanje instruktorke biće dodato.'),
('10000000-0000-0000-0000-000000000002','Instruktorka 2','Privremeni profil. Predstavljanje instruktorke biće dodato.') on conflict(id) do nothing;
insert into public.working_hours(trainer_id,weekday,start_time,end_time)
select t.id,d, s::time,e::time from public.trainers t cross join generate_series(1,5) d cross join (values ('08:00','12:00'),('13:00','17:00')) h(s,e)
where not exists(select 1 from public.working_hours w where w.trainer_id=t.id and w.weekday=d and w.start_time=s::time);
