-- Pre-orders. Players can only order through place_order(), which enforces the unlock ladder.
create table if not exists setting (key text primary key, value text not null);
alter table setting enable row level security;
create policy setting_read on setting for select to authenticated using (true);
create policy setting_founder on setting for all using (is_founder()) with check (is_founder());
insert into setting (key, value) values ('payment_instructions', 'Bank transfer details to be added by a founder.') on conflict do nothing;

alter table "order" add column if not exists created_at timestamptz not null default now();
alter table "order" add column if not exists price numeric(10,2) not null default 0;
create unique index if not exists order_one_per_step on "order" (player_id, ladder_step_id);

-- Players read their own orders; they can no longer write them directly.
drop policy if exists self_orders on "order";
create policy self_orders_read on "order" for select using (player_id = my_player_id());

create or replace function place_order(step uuid, p_size text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  pid uuid := my_player_id(); st ladder_step%rowtype; psizes text[]; lvl int; req int; fin boolean; oid uuid;
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
    where a.player_id = pid and s.season_id = st.season_id and a.type in ('group','solo');
  fin := lvl >= req;
  if lvl < st.level_required then raise exception 'locked'; end if;
  if (st.release = 'on_finish' or st.is_free) and not fin then raise exception 'finish first'; end if;
  select sizes into psizes from product where id = st.product_id;
  if p_size is null or not (p_size = any(psizes)) then raise exception 'bad size'; end if;
  if not st.is_free and st.price is null then raise exception 'price not set'; end if;
  insert into "order" (player_id, ladder_step_id, size, price)
    values (pid, step, p_size, case when st.is_free then 0 else st.price end) returning id into oid;
  return oid;
end $$;

create or replace function cancel_order(oid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from "order" where id = oid and player_id = my_player_id() and status = 'preordered';
end $$;

revoke execute on function place_order(uuid, text), cancel_order(uuid) from public, anon;
grant execute on function place_order(uuid, text), cancel_order(uuid) to authenticated;
