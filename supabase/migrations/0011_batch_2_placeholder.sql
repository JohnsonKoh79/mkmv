-- Batch 2: announced, no date yet. Shown as "Date to be confirmed" with a waitlist.
-- Apply after the code that understands a dateless batch is live.
insert into season (project_id, label, start_date, window_weeks, sessions_required, timezone, batch_number, join_closes_at)
values ('00000000-0000-0000-0000-0000000000a1', 'Batch 2', null, 14, 12, 'Asia/Kuala_Lumpur', 2, null)
on conflict (project_id, batch_number) do nothing;
