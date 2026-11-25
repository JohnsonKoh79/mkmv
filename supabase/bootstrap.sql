-- Run once in the SQL Editor after 0002. Edit the three values first.
-- 1) Your founder record. Use the same email you will sign in with.
insert into player (real_name, contact, nickname, role, public_consent)
values ('YOUR REAL NAME', 'you@example.com', 'YOUR NICKNAME', 'founder', false);

-- 2) OPTIONAL, to try the player screens yourself: also enrol that record in the group.
insert into enrolment (player_id, group_id)
select id, '00000000-0000-0000-0000-0000000000c1' from player where contact = 'you@example.com';
