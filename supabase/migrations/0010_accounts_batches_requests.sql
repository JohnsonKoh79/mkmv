-- Redesign step 1: MKMV account -> project -> batch. Signing up creates an account only;
-- joining a project is a separate request that a founder approves.
-- Safe to apply while the current site is live: nothing it reads is removed.

-- ============ 1. Project, batch, mission and cut labels ============
alter table project add column slug text unique, add column label text, add column title text;
update project set slug = '12w-5am', label = 'Project 01', title = '12W · 5AM'
  where id = '00000000-0000-0000-0000-0000000000a1';
alter table project alter column slug set not null, alter column label set not null, alter column title set not null;

-- A batch is the existing season + group. A batch with no date yet has start_date null.
alter table season alter column start_date drop not null;
alter table season add column batch_number int not null default 1, add column join_closes_at timestamptz;
update season set label = 'Batch 1', join_closes_at = timestamptz '2026-12-15 21:00:00+08'
  where id = '00000000-0000-0000-0000-0000000000b1';
alter table season add constraint season_batch_unique unique (project_id, batch_number);

alter table ladder_step add column mission_label text, add column mission_title text;
update ladder_step set
  mission_label = case level_required when 2 then 'Mission 01' when 4 then 'Mission 02' when 6 then 'Mission 03'
                                      when 8 then 'Mission 04' when 10 then 'Mission 05' else 'Final mission' end,
  mission_title = case when level_required = 12 then 'Finish: 12 sessions' else 'Show up ' || level_required || ' times' end
  where season_id = '00000000-0000-0000-0000-0000000000b1';

alter table product add column has_cut boolean not null default false;
update product set name = 'Shorts' where name = 'Pants';
update product set has_cut = true where name in ('Singlet', 'Shorts');

-- ============ 2. Accounts ============
-- Every signed-up person gets one player row (the MKMV account). A seat is a separate enrolment.
alter table player alter column real_name drop not null;
alter table player add column cut text not null default 'm' check (cut in ('m', 'w'));
create unique index player_contact_unique on player (lower(contact)) where contact is not null;
alter table "order" add column cut text check (cut in ('m', 'w'));

-- Claims a founder-added row with the same email, otherwise creates a bare account. Confirmed emails only.
create or replace function link_player() returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); mail text;
begin
  if uid is null then return; end if;
  select lower(email) into mail from auth.users where id = uid and email_confirmed_at is not null;
  if mail is null then return; end if;
  if exists (select 1 from player where auth_user_id = uid) then return; end if;
  update player set auth_user_id = uid where auth_user_id is null and lower(contact) = mail;
  if found then return; end if;
  insert into player (auth_user_id, contact) values (uid, mail) on conflict do nothing;
end $$;

create or replace function set_cut(p_cut text) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_cut not in ('m', 'w') then raise exception 'bad cut'; end if;
  update player set cut = p_cut where auth_user_id = auth.uid();
end $$;

-- An account without a seat appears on no public page.
create or replace view public_player with (security_invoker = false) as
  select p.id, p.nickname, p.photo_url from player p
  where p.public_consent and p.nickname is not null and exists (select 1 from enrolment e where e.player_id = p.id);

-- Dates, deadline and seat count per batch. Counts only.
create view public_batch with (security_invoker = false) as
  select s.id as season_id, s.project_id, s.batch_number, s.start_date,
         (select max(d.date) from session_date d where d.season_id = s.id) as end_date,
         s.join_closes_at, g.seat_limit,
         (select count(*)::int from enrolment e where e.group_id = g.id) as seats_taken
  from season s left join "group" g on g.season_id = s.id;
revoke all on public_batch from anon, authenticated;
grant select on public_batch to anon, authenticated;

-- ============ 3. Join requests ============
create type request_kind as enum ('join', 'waitlist_next_batch', 'waitlist_next_project');
create type request_status as enum ('requested', 'approved', 'waitlisted', 'withdrawn', 'removed');

-- What the person themselves may read: no personal details here.
create table join_request (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references player on delete cascade,
  project_id uuid references project,          -- null = "next project" with no project yet
  season_id uuid references season,            -- the batch, when known
  kind request_kind not null,
  status request_status not null,
  created_at timestamptz not null default now(),
  decided_by uuid references player on delete set null,
  decided_at timestamptz
);
create unique index join_request_one_open on join_request
  (player_id, coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status in ('requested', 'waitlisted');

-- Founder-only details, in a separate table so no player-visible query can return them.
create table request_private (
  request_id uuid primary key references join_request on delete cascade,
  full_name text not null,
  phone text not null,
  date_of_birth date not null,
  health_notes text,
  emergency_name text not null,
  emergency_phone text not null,
  reason text,
  referrer_name text not null,
  referrer_phone text not null,
  commitment_ticked boolean not null check (commitment_ticked),
  consent_ticked boolean not null check (consent_ticked),
  consent_at timestamptz not null default now()
);

alter table join_request enable row level security;
alter table request_private enable row level security;
revoke all on join_request, request_private from anon, authenticated;
grant select on join_request, request_private to authenticated;
create policy request_read on join_request for select to authenticated using (player_id = my_player_id() or is_founder());
create policy request_private_founder on request_private for select to authenticated using (is_founder());
-- No insert or update policies: every write goes through the functions below.

create or replace function submit_request(
  p_project uuid, p_full_name text, p_phone text, p_dob date, p_health text,
  p_emergency_name text, p_emergency_phone text, p_reason text,
  p_referrer_name text, p_referrer_phone text, p_commit boolean, p_consent boolean
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
  return rid;
end $$;

create or replace function join_waitlist(p_project uuid, p_kind request_kind) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid := my_player_id();
begin
  if pid is null then raise exception 'no account'; end if;
  if p_kind = 'join' then raise exception 'not a waitlist'; end if;
  if exists (select 1 from join_request where player_id = pid and project_id is not distinct from p_project and status = 'requested') then
    raise exception 'already requested';
  end if;
  update join_request set kind = p_kind
    where player_id = pid and project_id is not distinct from p_project and status = 'waitlisted';
  if not found then
    insert into join_request (player_id, project_id, kind, status) values (pid, p_project, p_kind, 'waitlisted');
  end if;
end $$;

create or replace function withdraw_request(p_request uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update join_request set status = 'withdrawn'
    where id = p_request and player_id = my_player_id() and status in ('requested', 'waitlisted');
end $$;

-- Checks seats and closing time, creates the seat and sets the status in one transaction.
create or replace function approve_request(p_request uuid, p_referrer uuid default null) returns void
language plpgsql security definer set search_path = public as $$
declare r join_request%rowtype; d request_private%rowtype; g_id uuid; g_limit int; batch uuid; closes timestamptz; ref uuid := p_referrer;
begin
  if not is_founder() then raise exception 'founders only'; end if;
  select * into r from join_request where id = p_request for update;
  if not found or r.status not in ('requested', 'waitlisted') then raise exception 'not open'; end if;
  select * into d from request_private where request_id = r.id;
  if not found then raise exception 'no details yet'; end if;  -- a bare waitlist entry must send a full request first

  batch := r.season_id;
  if batch is null then
    select s.id into batch from season s where s.project_id = r.project_id and now() < s.join_closes_at order by s.batch_number limit 1;
  end if;
  select g.id, g.seat_limit, s.join_closes_at into g_id, g_limit, closes
    from "group" g join season s on s.id = g.season_id where g.season_id = batch for update of g;
  if g_id is null or closes is null or now() >= closes then raise exception 'closed'; end if;
  if (select count(*) from enrolment where group_id = g_id) >= g_limit then raise exception 'full'; end if;

  if ref is null then  -- match the referrer by the last 9 digits of the phone number
    select jr.player_id into ref from request_private rp join join_request jr on jr.id = rp.request_id
      where jr.status = 'approved'
        and right(regexp_replace(rp.phone, '\D', '', 'g'), 9) = right(regexp_replace(d.referrer_phone, '\D', '', 'g'), 9)
      limit 1;
  end if;

  insert into enrolment (player_id, group_id, referrer_id) values (r.player_id, g_id, ref) on conflict do nothing;
  update player set real_name = coalesce(real_name, d.full_name) where id = r.player_id;
  update join_request set status = 'approved', season_id = batch, decided_by = my_player_id(), decided_at = now() where id = r.id;
end $$;

-- Founder decisions other than approval. There is no "declined".
create or replace function decide_request(p_request uuid, p_decision text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_founder() then raise exception 'founders only'; end if;
  if p_decision = 'removed' then
    update join_request set status = 'removed', decided_by = my_player_id(), decided_at = now() where id = p_request;
  elsif p_decision in ('waitlist_next_batch', 'waitlist_next_project') then
    update join_request set status = 'waitlisted', kind = p_decision::request_kind, season_id = null,
      decided_by = my_player_id(), decided_at = now()
      where id = p_request and status in ('requested', 'waitlisted');
  else
    raise exception 'bad decision';
  end if;
end $$;

-- ============ 4. Orders carry the cut ============
-- Same rules as before. p_cut is optional, so the current site's two-argument call keeps working.
drop function place_order(uuid, text);
create function place_order(step uuid, p_size text, p_cut text default null) returns uuid
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
  if p_cut is not null and p_cut not in ('m', 'w') then raise exception 'bad cut'; end if;
  insert into "order" (player_id, ladder_step_id, size, price, cut)
    values (pid, step, p_size, case when st.is_free then 0 else st.price end,
            case when cuts then coalesce(p_cut, mycut) end)
    returning id into oid;
  return oid;
end $$;

-- ============ 5. Who may call what ============
revoke execute on function link_player(), set_cut(text), submit_request(uuid, text, text, date, text, text, text, text, text, text, boolean, boolean),
  join_waitlist(uuid, request_kind), withdraw_request(uuid), approve_request(uuid, uuid), decide_request(uuid, text), place_order(uuid, text, text)
  from public, anon;
grant execute on function link_player(), set_cut(text), submit_request(uuid, text, text, date, text, text, text, text, text, text, boolean, boolean),
  join_waitlist(uuid, request_kind), withdraw_request(uuid), approve_request(uuid, uuid), decide_request(uuid, text), place_order(uuid, text, text)
  to authenticated;

-- The old waitlist table stays until the new request form replaces the Join page (step 5). It has no rows.
