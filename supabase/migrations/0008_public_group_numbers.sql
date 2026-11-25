-- Group totals for the project map. Counts only: no names, no misses, no per-player rows.
create or replace view public_week with (security_invoker = false) as
  select s.season_id, s.date,
         (count(a.player_id) filter (where a.type in ('group','solo')))::int as showed
  from session_date s
  left join attendance a on a.session_date_id = s.id
  group by s.season_id, s.date;

create or replace view public_season_finishers with (security_invoker = false) as
  select x.season_id, count(*)::int as finishers
  from (
    select a.player_id, sd.season_id
    from attendance a join session_date sd on sd.id = a.session_date_id
    join season se on se.id = sd.season_id
    where a.type in ('group','solo')
    group by a.player_id, sd.season_id, se.sessions_required
    having count(*) >= se.sessions_required
  ) x
  group by x.season_id;

revoke all on public_week, public_season_finishers from anon, authenticated;
grant select on public_week, public_season_finishers to anon, authenticated;
