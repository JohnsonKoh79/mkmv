-- Wednesday window (Malaysia time) and QR check-in.
insert into setting (key, value) values ('window_open', '04:30'), ('window_close', '23:59') on conflict (key) do nothing;

create or replace function within_window() returns boolean language sql stable security definer set search_path = public as $$
  select (now() at time zone 'Asia/Kuala_Lumpur')::time
    between coalesce((select value from setting where key = 'window_open'), '04:30')::time
        and coalesce((select value from setting where key = 'window_close'), '23:59')::time + interval '59 seconds'
$$;

-- Solo upload: the Wednesday itself, inside the window.
create or replace function log_solo(evidence text) returns void language plpgsql security definer set search_path = public as $$
declare pid uuid := my_player_id(); sdid uuid;
begin
  if pid is null then raise exception 'no player'; end if;
  select s.id into sdid from session_date s
    join "group" g on g.season_id = s.season_id
    join enrolment e on e.group_id = g.id and e.player_id = pid
    where s.date = (now() at time zone 'Asia/Kuala_Lumpur')::date limit 1;
  if sdid is null then raise exception 'no session today'; end if;
  if not within_window() then raise exception 'outside window'; end if;
  insert into attendance (player_id, session_date_id, type, notice_given, evidence_url, recorded_by)
    values (pid, sdid, 'solo', false, evidence, pid)
    on conflict (player_id, session_date_id) do update
      set type = 'solo', evidence_url = excluded.evidence_url, recorded_by = pid
      where attendance.type = 'absent';
  if not found then raise exception 'already recorded'; end if;
end $$;

-- One check-in code per Wednesday. Founder-only: members only ever learn it by scanning.
create table checkin (
  session_date_id uuid primary key references session_date on delete cascade,
  code text not null,
  is_open boolean not null default false,
  opened_at timestamptz, closed_at timestamptz
);
alter table checkin enable row level security;
revoke all on checkin from anon, authenticated;
grant select on checkin to authenticated;
create policy checkin_founder on checkin for select to authenticated using (is_founder());

-- Opens only on the Wednesday itself. Every opening makes a new code, so an old photo of the QR is useless.
create or replace function open_checkin(p_date uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_founder() then raise exception 'founders only'; end if;
  if not exists (select 1 from session_date where id = p_date and date = (now() at time zone 'Asia/Kuala_Lumpur')::date) then
    raise exception 'not today';
  end if;
  insert into checkin (session_date_id, code, is_open, opened_at, closed_at)
    values (p_date, replace(gen_random_uuid()::text, '-', ''), true, now(), null)
    on conflict (session_date_id) do update set code = excluded.code, is_open = true, opened_at = now(), closed_at = null;
end $$;

create or replace function close_checkin(p_date uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_founder() then raise exception 'founders only'; end if;
  update checkin set is_open = false, closed_at = now() where session_date_id = p_date;
end $$;

-- A member scans the code. Counts as a group session. Returns 'ok' or 'already'.
create or replace function check_in(p_code text) returns text language plpgsql security definer set search_path = public as $$
declare pid uuid := my_player_id(); c checkin%rowtype; d session_date%rowtype;
begin
  if pid is null then raise exception 'no player'; end if;
  select * into c from checkin where code = p_code;
  if not found or not c.is_open then raise exception 'closed'; end if;
  select * into d from session_date where id = c.session_date_id;
  if d.date <> (now() at time zone 'Asia/Kuala_Lumpur')::date then raise exception 'not today'; end if;
  if not within_window() then raise exception 'outside window'; end if;
  if not exists (select 1 from enrolment e join "group" g on g.id = e.group_id where e.player_id = pid and g.season_id = d.season_id) then
    raise exception 'not in batch';
  end if;
  insert into attendance (player_id, session_date_id, type, notice_given, recorded_by)
    values (pid, d.id, 'group', false, pid)
    on conflict (player_id, session_date_id) do update set type = 'group', notice_given = false, recorded_by = pid
      where attendance.type = 'absent';
  return case when found then 'ok' else 'already' end;
end $$;

revoke execute on function open_checkin(uuid), close_checkin(uuid), check_in(text), within_window() from public, anon;
grant execute on function open_checkin(uuid), close_checkin(uuid), check_in(text), within_window() to authenticated;
