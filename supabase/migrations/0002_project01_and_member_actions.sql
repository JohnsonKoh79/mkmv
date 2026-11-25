-- Seed Project 01, member actions (enforced in the database), evidence storage, unlock notices.

-- ---------- Seed ----------
insert into project (id, name, descriptor, status) values
  ('00000000-0000-0000-0000-0000000000a1', 'PROJECT 01', '12 sessions. Wednesdays, 5am.', 'ongoing')
on conflict do nothing;

insert into season (id, project_id, label, start_date, window_weeks, sessions_required, timezone) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'Season 1', '2026-12-02', 14, 12, 'Asia/Kuala_Lumpur')
on conflict do nothing;

-- 14 Wednesdays, 2 Dec 2026 to 3 Mar 2027. Notice closes Tuesday 21:00 Malaysia time.
insert into session_date (season_id, date, notice_deadline)
select '00000000-0000-0000-0000-0000000000b1', d::date, (d - interval '3 hours') at time zone 'Asia/Kuala_Lumpur'
from generate_series(timestamp '2026-12-02', timestamp '2027-03-03', interval '7 days') d
on conflict (season_id, date) do nothing;

insert into "group" (id, season_id, seat_limit) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', 12)
on conflict do nothing;

-- Product names and sizes are placeholders. Founders edit them once the printer confirms.
insert into product (id, name, sizes) values
  ('00000000-0000-0000-0000-0000000000d1', 'Socks',   '{S,M,L}'),
  ('00000000-0000-0000-0000-0000000000d2', 'Singlet', '{S,M,L,XL}'),
  ('00000000-0000-0000-0000-0000000000d3', 'Pants',   '{S,M,L,XL}')
on conflict do nothing;

-- Prices stay null until confirmed.
insert into ladder_step (season_id, level_required, product_id, ink, release, price, is_free)
select '00000000-0000-0000-0000-0000000000b1', v.lvl, v.pid::uuid, v.ink::ink, v.rel::release, null, v.free
from (values
  (2,  '00000000-0000-0000-0000-0000000000d1', 'black',   'immediate', false),
  (4,  '00000000-0000-0000-0000-0000000000d2', 'black',   'immediate', false),
  (6,  '00000000-0000-0000-0000-0000000000d3', 'black',   'immediate', false),
  (8,  '00000000-0000-0000-0000-0000000000d1', 'oxblood', 'on_finish', false),
  (10, '00000000-0000-0000-0000-0000000000d3', 'oxblood', 'on_finish', false),
  (12, '00000000-0000-0000-0000-0000000000d2', 'oxblood', 'on_finish', true)
) as v(lvl, pid, ink, rel, free)
where not exists (select 1 from ladder_step where season_id = '00000000-0000-0000-0000-0000000000b1');

-- ---------- Helpers ----------
create or replace function my_player_id() returns uuid language sql stable security definer set search_path = public as
$$ select id from player where auth_user_id = auth.uid() $$;

-- Founders add a player with their email in `contact`; first sign-in links the account.
create or replace function link_player() returns void language plpgsql security definer set search_path = public as $$
begin
  update player set auth_user_id = auth.uid()
  where auth_user_id is null and contact is not null
    and lower(contact) = lower((select email from auth.users where id = auth.uid()));
end $$;

-- "I'm out this week": next Wednesday whose notice deadline (Tue 21:00 MYT) has not passed.
create or replace function give_notice() returns void language plpgsql security definer set search_path = public as $$
declare pid uuid := my_player_id(); sdid uuid;
begin
  if pid is null then raise exception 'no player'; end if;
  select s.id into sdid from session_date s
    join "group" g on g.season_id = s.season_id
    join enrolment e on e.group_id = g.id and e.player_id = pid
    where s.notice_deadline > now() order by s.date limit 1;
  if sdid is null then raise exception 'notice closed'; end if;
  insert into attendance (player_id, session_date_id, type, notice_given, recorded_by)
    values (pid, sdid, 'absent', true, pid) on conflict do nothing;
end $$;

-- Solo session: only on the Wednesday itself (Malaysia date). Counts immediately.
-- One row per player per Wednesday (primary key). A recorded absence can be upgraded to solo.
create or replace function log_solo(evidence text) returns void language plpgsql security definer set search_path = public as $$
declare pid uuid := my_player_id(); sdid uuid;
begin
  if pid is null then raise exception 'no player'; end if;
  select s.id into sdid from session_date s
    join "group" g on g.season_id = s.season_id
    join enrolment e on e.group_id = g.id and e.player_id = pid
    where s.date = (now() at time zone 'Asia/Kuala_Lumpur')::date limit 1;
  if sdid is null then raise exception 'no session today'; end if;
  insert into attendance (player_id, session_date_id, type, notice_given, evidence_url, recorded_by)
    values (pid, sdid, 'solo', false, evidence, pid)
    on conflict (player_id, session_date_id) do update
      set type = 'solo', evidence_url = excluded.evidence_url, recorded_by = pid
      where attendance.type = 'absent';
  if not found then raise exception 'already recorded'; end if;
end $$;

grant execute on function my_player_id(), link_player(), give_notice(), log_solo(text) to authenticated;

-- Players can no longer write attendance directly; they go through the functions above.
drop policy if exists self_att_solo on attendance;

-- Players read their own enrolment and group.
create policy self_enrol on enrolment for select using (player_id = my_player_id());
create policy self_group on "group" for select using (id in (select group_id from enrolment where player_id = my_player_id()));

-- ---------- Unlock notices ----------
create table if not exists unlock_seen (
  player_id uuid references player, ladder_step_id uuid references ladder_step,
  seen_at timestamptz not null default now(), primary key (player_id, ladder_step_id)
);
alter table unlock_seen enable row level security;
create policy self_unlock on unlock_seen for all using (player_id = my_player_id()) with check (player_id = my_player_id());

-- ---------- Private storage for solo evidence ----------
insert into storage.buckets (id, name, public) values ('evidence', 'evidence', false) on conflict do nothing;
create policy evidence_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'evidence' and (storage.foldername(name))[1] = my_player_id()::text);
create policy evidence_read on storage.objects for select to authenticated
  using (bucket_id = 'evidence' and ((storage.foldername(name))[1] = my_player_id()::text or is_founder()));
