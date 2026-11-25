-- Founder roll call. marks = {"<player_id>": "group" | "sauna_only" | "absent"}.
-- Only enrolled players are written. An absence never overwrites a notice the player already gave.
create or replace function save_roll_call(sd uuid, marks jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_founder() then raise exception 'founders only'; end if;
  insert into attendance (player_id, session_date_id, type, notice_given, recorded_by)
  select m.key::uuid, sd, m.value::attendance_type, false, my_player_id()
  from jsonb_each_text(marks) m
  where exists (
    select 1 from enrolment e join "group" g on g.id = e.group_id
    join session_date s on s.season_id = g.season_id
    where e.player_id = m.key::uuid and s.id = sd)
  on conflict (player_id, session_date_id) do update
    set type = excluded.type, recorded_by = excluded.recorded_by,
        notice_given = case when excluded.type = 'absent' then attendance.notice_given else false end
    where not (excluded.type = 'absent' and attendance.type = 'absent');
end $$;

revoke execute on function save_roll_call(uuid, jsonb) from public, anon;
grant execute on function save_roll_call(uuid, jsonb) to authenticated;
