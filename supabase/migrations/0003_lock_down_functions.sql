-- Functions are executable by everyone by default. Limit member actions to signed-in users.
revoke execute on function my_player_id(), link_player(), give_notice(), log_solo(text) from public, anon;
grant execute on function my_player_id(), link_player(), give_notice(), log_solo(text) to authenticated;
