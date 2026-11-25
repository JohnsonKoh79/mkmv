-- Public roster now carries the season, so anonymous visitors never need to read the founder-only "group" table.
create or replace view public_roster with (security_invoker = false) as
  select e.group_id, e.player_id, e.joined_at, g.season_id
  from enrolment e
  join "group" g on g.id = e.group_id
  join player p on p.id = e.player_id
  where p.public_consent and p.nickname is not null;
grant select on public_roster to anon, authenticated;
