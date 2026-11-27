-- Gender is asked on Request to join and fixes the singlet and shorts cut.
alter table player add column gender text check (gender in ('m', 'f'));

create or replace function set_cut(p_cut text) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_cut not in ('m', 'w') then raise exception 'bad cut'; end if;
  update player set cut = p_cut where auth_user_id = auth.uid() and gender is null;
end $$;

drop function submit_request(uuid, text, text, date, text, text, text, text, text, text, boolean, boolean);

create or replace function submit_request(
  p_project uuid, p_full_name text, p_phone text, p_dob date, p_health text,
  p_emergency_name text, p_emergency_phone text, p_reason text,
  p_referrer_name text, p_referrer_phone text, p_commit boolean, p_consent boolean, p_gender text
) returns uuid language plpgsql security definer set search_path = public as $$
declare pid uuid := my_player_id(); batch uuid; rid uuid;
        today date := (now() at time zone 'Asia/Kuala_Lumpur')::date;
begin
  if pid is null then raise exception 'no account'; end if;
  if coalesce(btrim(p_full_name), '') = '' or coalesce(btrim(p_phone), '') = '' or p_dob is null
     or coalesce(btrim(p_emergency_name), '') = '' or coalesce(btrim(p_emergency_phone), '') = ''
     or coalesce(btrim(p_referrer_name), '') = '' or coalesce(btrim(p_referrer_phone), '') = '' then
    raise exception 'missing details';
  end if;
  if p_gender is null or p_gender not in ('m', 'f') then raise exception 'missing details'; end if;
  if p_commit is not true or p_consent is not true then raise exception 'ticks required'; end if;
  if p_dob < date '1900-01-01' or p_dob > (today - interval '18 years')::date then raise exception 'under 18'; end if;
  if length(coalesce(p_health, '')) > 2000 or length(coalesce(p_reason, '')) > 2000 or length(p_full_name) > 120 then
    raise exception 'too long';
  end if;
  if exists (select 1 from enrolment e join "group" g on g.id = e.group_id join season s on s.id = g.season_id
             where e.player_id = pid and s.project_id = p_project) then
    raise exception 'already in';
  end if;

  select s.id into batch from season s join "group" g on g.season_id = s.id
    where s.project_id = p_project and s.start_date is not null and now() < s.join_closes_at
      and (select count(*) from enrolment e where e.group_id = g.id) < g.seat_limit
    order by s.batch_number limit 1;
  if batch is null then raise exception 'closed'; end if;

  -- A waitlist entry the person chose themselves gives way to a real request.
  update join_request set status = 'withdrawn'
    where player_id = pid and project_id = p_project and status = 'waitlisted' and decided_by is null;
  if exists (select 1 from join_request where player_id = pid and project_id = p_project and status in ('requested', 'waitlisted')) then
    raise exception 'already requested';
  end if;

  insert into join_request (player_id, project_id, season_id, kind, status)
    values (pid, p_project, batch, 'join', 'requested') returning id into rid;
  insert into request_private (request_id, full_name, phone, date_of_birth, health_notes, emergency_name, emergency_phone,
                               reason, referrer_name, referrer_phone, commitment_ticked, consent_ticked)
    values (rid, btrim(p_full_name), btrim(p_phone), p_dob, nullif(btrim(p_health), ''), btrim(p_emergency_name),
            btrim(p_emergency_phone), nullif(btrim(p_reason), ''), btrim(p_referrer_name), btrim(p_referrer_phone), true, true);
  -- Gender decides the cut of the singlet and shorts. Players cannot change it afterwards; founders can.
  update player set gender = p_gender, cut = case when p_gender = 'f' then 'w' else 'm' end where id = pid;
  return rid;
end $$;
revoke execute on function submit_request(uuid, text, text, date, text, text, text, text, text, text, boolean, boolean, text) from public, anon;
grant execute on function submit_request(uuid, text, text, date, text, text, text, text, text, text, boolean, boolean, text) to authenticated;

create or replace function place_order(step uuid, p_size text, p_cut text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  pid uuid := my_player_id(); st ladder_step%rowtype; psizes text[]; cuts boolean; mycut text; lvl int; req int; fin boolean; oid uuid;
begin
  if pid is null then raise exception 'no player'; end if;
  select * into st from ladder_step where id = step;
  if not found then raise exception 'no such piece'; end if;
  if not exists (select 1 from enrolment e join "group" g on g.id = e.group_id
                 where e.player_id = pid and g.season_id = st.season_id) then
    raise exception 'not in this project';
  end if;
  select sessions_required into req from season where id = st.season_id;
  select count(*) into lvl from attendance a join session_date s on s.id = a.session_date_id
    where a.player_id = pid and s.season_id = st.season_id and a.type in ('group', 'solo');
  fin := lvl >= req;
  if lvl < st.level_required then raise exception 'locked'; end if;
  if (st.release = 'on_finish' or st.is_free) and not fin then raise exception 'finish first'; end if;
  select sizes, has_cut into psizes, cuts from product where id = st.product_id;
  if p_size is null or not (p_size = any(psizes)) then raise exception 'bad size'; end if;
  if not st.is_free and st.price is null then raise exception 'price not set'; end if;
  select cut into mycut from player where id = pid;
  -- A known gender wins over anything the browser asks for.
  if exists (select 1 from player where id = pid and gender is not null) then
    p_cut := null;
    select case when gender = 'f' then 'w' else 'm' end into mycut from player where id = pid;
  end if;
  if p_cut is not null and p_cut not in ('m', 'w') then raise exception 'bad cut'; end if;
  insert into "order" (player_id, ladder_step_id, size, price, cut)
    values (pid, step, p_size, case when st.is_free then 0 else st.price end,
            case when cuts then coalesce(p_cut, mycut) end)
    returning id into oid;
  return oid;
end $$;
