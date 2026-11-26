-- Achievement definitions are data, per batch. Nobody awards them: they are computed from attendance.
create table achievement (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references season on delete cascade,
  name text not null,
  scope text not null check (scope in ('individual', 'group')),
  rule text not null check (rule in ('first', 'solo', 'dates', 'all_in', 'finisher', 'full_house', 'group_100', 'all_out')),
  dates date[] not null default '{}',
  sort int not null default 0,
  unique (season_id, name)
);
alter table achievement enable row level security;
revoke all on achievement from anon, authenticated;
grant select on achievement to anon, authenticated;
grant insert, update, delete on achievement to authenticated;
create policy achievement_read on achievement for select using (true);
create policy achievement_founder on achievement for all to authenticated using (is_founder()) with check (is_founder());

insert into achievement (season_id, name, scope, rule, dates, sort) values
  ('00000000-0000-0000-0000-0000000000b1', 'First Move', 'individual', 'first', '{}', 1),
  ('00000000-0000-0000-0000-0000000000b1', 'Solo', 'individual', 'solo', '{}', 2),
  ('00000000-0000-0000-0000-0000000000b1', 'Holiday', 'individual', 'dates', '{2026-12-23,2026-12-30,2027-02-10}', 3),
  ('00000000-0000-0000-0000-0000000000b1', 'All In', 'individual', 'all_in', '{}', 4),
  ('00000000-0000-0000-0000-0000000000b1', 'Finisher', 'individual', 'finisher', '{}', 5),
  ('00000000-0000-0000-0000-0000000000b1', 'Full House', 'group', 'full_house', '{}', 6),
  ('00000000-0000-0000-0000-0000000000b1', '100', 'group', 'group_100', '{}', 7),
  ('00000000-0000-0000-0000-0000000000b1', 'All Out', 'group', 'all_out', '{}', 8);

-- The public record: logged sessions only. Never absences, notices, sauna-only or evidence.
create view public_record with (security_invoker = false) as
  select a.player_id, sd.season_id, sd.date, a.type::text as type
  from attendance a
  join session_date sd on sd.id = a.session_date_id
  join player p on p.id = a.player_id
  where a.type in ('group', 'solo') and p.public_consent and p.nickname is not null
    and exists (select 1 from enrolment e where e.player_id = p.id);
revoke all on public_record from anon, authenticated;
grant select on public_record to anon, authenticated;
