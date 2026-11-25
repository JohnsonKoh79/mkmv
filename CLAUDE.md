# MKMV website

This folder holds everything needed to build the MKMV website.

## Start here

Read `docs/MKMV_Website_Build_Prompt.md` in full before writing any code. It is the brief: rules, pages, data model, design system, build order and acceptance checks. Ask the owner the questions marked OPEN before building the part they affect.

## Files

- `docs/MKMV_Website_Build_Prompt.md`: the build brief.
- `docs/MKMV_Build_Handover.md`: what the first version already does. Section 12 of the build brief says what to change in it.
- `brand/MKMV_Brand_Guideline.md`: colours, logo use, wording and the kit image prompt.
- `brand/kit/`: blank garment images (`socks.png`, `singlet.png`, `pants.png`) once the owner supplies them.
- `docs/MKMV_Plan_ZH.pdf`: the season-one plan in Traditional Chinese, for background only.
- `brand/logo/`: the MKMV wordmark as transparent SVGs, stacked and horizontal, in black (`#10100F`), off-white (`#EAE4DE`) and oxblood (`#522E2C`). Use these files; never retype the wordmark.
- `brand/MKMV_Logo.pdf`: the original logo artwork.
- `brand/MKMV_5-Degree_Shift_Board.jpeg`: internal design logic for the 5° forward slant. Never quote its text in the site.

## Rules that are easy to break

- Black and off-white only. Oxblood appears only on things earned by finishing, and never on black.
- Never sort players by level and never build a leaderboard.
- The public sees nicknames, photos, levels, achievements and each player's record of logged sessions. It never sees real names, misses, notices, flags or orders.
- Signed-in navigation has two tabs only: Project and Me.
- Keep the existing database rules and row-level security.
- Write "MKMV" and "Make your move." Never "make a move", "Make Moves" or "the 5am club". No registered-trademark symbol.
- Mobile first. Logging a session takes two taps.
