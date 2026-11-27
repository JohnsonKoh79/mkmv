-- Owner decision, 27 Nov 2026: Reserved socks and shorts can be bought as soon as their mission is complete.
-- Only the final Reserved singlet still needs finishing (it is earned, not sold).
update ladder_step set release = 'immediate' where not is_free;
