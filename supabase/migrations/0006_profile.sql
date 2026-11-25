-- Player profile: nickname, photo, consent. Players edit only through save_profile().
create unique index if not exists player_nickname_unique on player (lower(nickname)) where nickname is not null;

-- No more direct updates by players (they could touch real_name, contact, auth_user_id).
drop policy if exists self_player_upd on player;

create or replace function save_profile(p_nickname text, p_photo text, p_consent boolean) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid := my_player_id(); nick text := nullif(btrim(p_nickname), '');
begin
  if pid is null then raise exception 'no player'; end if;
  if nick is not null and (char_length(nick) < 2 or char_length(nick) > 24) then raise exception 'nickname length'; end if;
  if p_consent and nick is null then raise exception 'nickname needed'; end if;
  if p_photo is not null and split_part(p_photo, '/', 1) <> pid::text then raise exception 'bad photo'; end if;
  update player set nickname = nick, photo_url = coalesce(p_photo, photo_url), public_consent = coalesce(p_consent, false)
  where id = pid;
end $$;
revoke execute on function save_profile(text, text, boolean) from public, anon;
grant execute on function save_profile(text, text, boolean) to authenticated;

-- Public bucket: photos are only ever linked from public profiles of players who ticked consent.
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
create policy avatars_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = my_player_id()::text);
create policy avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = my_player_id()::text);
create policy avatars_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = my_player_id()::text);
