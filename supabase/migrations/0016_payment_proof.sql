-- Manual payment: order -> transfer by TNG -> upload screenshot -> a founder approves.
-- "Payment pending" = preordered without proof. "Checking" = preordered with proof. A founder moves it to paid.
alter table "order" add column proof_url text, add column proof_at timestamptz;

create or replace function submit_payment_proof(p_orders uuid[], p_path text) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid := my_player_id(); n int;
begin
  if pid is null then raise exception 'no player'; end if;
  if split_part(p_path, '/', 1) <> pid::text then raise exception 'bad file'; end if;
  update "order" set proof_url = p_path, proof_at = now()
    where id = any(p_orders) and player_id = pid and status = 'preordered' and price > 0;
  get diagnostics n = row_count;
  if n = 0 then raise exception 'nothing to pay'; end if;
end $$;

-- The size can change until a founder confirms the order.
create or replace function change_size(p_order uuid, p_size text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update "order" o set size = p_size
    from ladder_step ls join product pr on pr.id = ls.product_id
    where o.id = p_order and o.player_id = my_player_id() and o.status = 'preordered'
      and ls.id = o.ladder_step_id and p_size = any(pr.sizes);
  if not found then raise exception 'cannot change'; end if;
end $$;

-- An order with a payment screenshot can no longer be cancelled by the member.
create or replace function cancel_order(oid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from "order" where id = oid and player_id = my_player_id() and status = 'preordered' and proof_url is null;
end $$;

revoke execute on function submit_payment_proof(uuid[], text), change_size(uuid, text), cancel_order(uuid) from public, anon;
grant execute on function submit_payment_proof(uuid[], text), change_size(uuid, text), cancel_order(uuid) to authenticated;

insert into storage.buckets (id, name, public) values ('proofs', 'proofs', false) on conflict do nothing;
create policy proofs_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'proofs' and (storage.foldername(name))[1] = my_player_id()::text);
create policy proofs_read on storage.objects for select to authenticated
  using (bucket_id = 'proofs' and ((storage.foldername(name))[1] = my_player_id()::text or is_founder()));

update setting set value = 'Transfer to Touch ''n Go: +60197298108' where key = 'payment_instructions';
