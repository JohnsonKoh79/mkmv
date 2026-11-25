-- Security fix. Public views run with the owner's rights (they bypass row-level security),
-- and Supabase grants write privileges on new objects by default. public_player is auto-updatable,
-- so anonymous visitors could update or delete player rows through it. Make every public view read-only.
revoke all on public_player, public_roster, public_level, public_week, public_season_finishers from anon, authenticated;
grant select on public_player, public_roster, public_level, public_week, public_season_finishers to anon, authenticated;
