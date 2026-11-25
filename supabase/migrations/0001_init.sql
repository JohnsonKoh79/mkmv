-- MKMV data model. Level, remaining Wednesdays, can-finish, unlocks and silent misses are computed, never stored.
create type attendance_type as enum ('group','solo','sauna_only','absent');
create type ink as enum ('black','oxblood');
create type release as enum ('immediate','on_finish');
create type project_status as enum ('upcoming','ongoing','finished');
create type player_role as enum ('player','founder');
create type order_status as enum ('preordered','paid','sent_to_printer','handed_over');

create table project (id uuid primary key default gen_random_uuid(), name text not null, descriptor text not null, status project_status not null default 'upcoming');
create table season (id uuid primary key default gen_random_uuid(), project_id uuid not null references project, label text not null, start_date date not null, window_weeks int not null, sessions_required int not null, timezone text not null default 'Asia/Kuala_Lumpur');
create table session_date (id uuid primary key default gen_random_uuid(), season_id uuid not null references season, date date not null, notice_deadline timestamptz not null, unique (season_id, date));
create table "group" (id uuid primary key default gen_random_uuid(), season_id uuid not null references season, seat_limit int not null default 12);
create table player (id uuid primary key default gen_random_uuid(), auth_user_id uuid unique, real_name text not null, contact text, nickname text, photo_url text, public_consent boolean not null default false, role player_role not null default 'player');
create table enrolment (player_id uuid references player, group_id uuid references "group", referrer_id uuid references player, joined_at timestamptz not null default now(), primary key (player_id, group_id));
create table attendance (player_id uuid references player, session_date_id uuid references session_date, type attendance_type not null, notice_given boolean not null default false, evidence_url text, recorded_by uuid references player, primary key (player_id, session_date_id)); -- primary key rejects a second session on one Wednesday
create table product (id uuid primary key default gen_random_uuid(), name text not null, sizes text[] not null default '{}');
create table ladder_step (id uuid primary key default gen_random_uuid(), season_id uuid not null references season, level_required int not null, product_id uuid not null references product, ink ink not null, release release not null, price numeric(10,2), is_free boolean not null default false);
create table "order" (id uuid primary key default gen_random_uuid(), player_id uuid not null references player, ladder_step_id uuid not null references ladder_step, size text not null, status order_status not null default 'preordered');
create table waitlist (id uuid primary key default gen_random_uuid(), name text not null, job text, reason text, referred_by text, created_at timestamptz not null default now());

create or replace function is_founder() returns boolean language sql stable security definer as
$$ select exists (select 1 from player where auth_user_id = auth.uid() and role = 'founder') $$;

alter table project enable row level security; alter table season enable row level security;
alter table session_date enable row level security; alter table "group" enable row level security;
alter table player enable row level security; alter table enrolment enable row level security;
alter table attendance enable row level security; alter table product enable row level security;
alter table ladder_step enable row level security; alter table "order" enable row level security;
alter table waitlist enable row level security;

-- Public reads: structure only.
create policy pub_project on project for select using (true);
create policy pub_season on season for select using (true);
create policy pub_dates on session_date for select using (true);
create policy pub_ladder on ladder_step for select using (true);
create policy pub_product on product for select using (true);

-- Public sees only nickname, photo and level, via views that hide real_name, contact, misses, notices, flags, orders.
create view public_player with (security_invoker = false) as
  select p.id, p.nickname, p.photo_url from player p where p.public_consent and p.nickname is not null;
create view public_roster with (security_invoker = false) as
  select e.group_id, e.player_id, e.joined_at from enrolment e join player p on p.id = e.player_id where p.public_consent;
create view public_level with (security_invoker = false) as
  select a.player_id, sd.season_id, count(*) filter (where a.type in ('group','solo')) as level
  from attendance a join session_date sd on sd.id = a.session_date_id join player p on p.id = a.player_id
  where p.public_consent group by a.player_id, sd.season_id;
grant select on public_player, public_roster, public_level to anon, authenticated;

-- Founders: everything.
create policy founder_all_player on player for all using (is_founder()) with check (is_founder());
create policy founder_all_enrol on enrolment for all using (is_founder()) with check (is_founder());
create policy founder_all_att on attendance for all using (is_founder()) with check (is_founder());
create policy founder_all_order on "order" for all using (is_founder()) with check (is_founder());
create policy founder_all_group on "group" for all using (is_founder()) with check (is_founder());
create policy founder_all_wait on waitlist for all using (is_founder()) with check (is_founder());
create policy founder_write_project on project for all using (is_founder()) with check (is_founder());
create policy founder_write_season on season for all using (is_founder()) with check (is_founder());
create policy founder_write_dates on session_date for all using (is_founder()) with check (is_founder());
create policy founder_write_ladder on ladder_step for all using (is_founder()) with check (is_founder());
create policy founder_write_product on product for all using (is_founder()) with check (is_founder());

-- Players: own row, own attendance (solo only), own orders.
create policy self_player on player for select using (auth_user_id = auth.uid());
create policy self_player_upd on player for update using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid() and role = 'player');
create policy self_att_read on attendance for select using (player_id in (select id from player where auth_user_id = auth.uid()));
create policy self_att_solo on attendance for insert with check (type in ('solo','absent') and player_id in (select id from player where auth_user_id = auth.uid()));
create policy self_orders on "order" for all using (player_id in (select id from player where auth_user_id = auth.uid()))
  with check (player_id in (select id from player where auth_user_id = auth.uid()));

-- Join form: anyone may add to the waiting list, nobody but founders may read it.
create policy anyone_waitlist on waitlist for insert with check (true);
-- TODO next: server-side checks that a solo upload falls on the Wednesday, orders match unlocked steps, notice closes Tue 21:00.
