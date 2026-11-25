# MKMV website: build handover

Status as of 25 Nov 2026. Written so another person or chat can rethink the design without reading the code. Everything described here runs locally at `http://localhost:3000` against a real Supabase project. It is not deployed.

## 1. What this is

A mobile-first site for MKMV: public pages show projects and players; signed-in players log notices and solo sessions, unlock kit and pre-order it; founders run roll call, orders, flags, waiting list and setup. Source brief: `docs/MKMV_Website_Build_Prompt.md`. Project rules for any AI tool: `CLAUDE.md`.

Stack: Next.js 16 (App Router, Turbopack, `cacheComponents` on), React 19, TypeScript, Tailwind 4, Supabase (Postgres, Auth magic link, Storage), `@supabase/ssr`. Font: Archivo (variable width axis), via `next/font/google`.

## 2. What is built, page by page

### Public (no login)
| Route | What it shows |
|---|---|
| `/` | Black block per **ongoing** project: name, descriptor ("12 sessions. Wednesdays, 5am."), week line ("Starts 2 Dec 2026" or "Week N of 14"), grid of player cards (photo or letter placeholder, nickname, "LV n", "Finisher" mark at 12), "See the rules" button. Then Upcoming, Finished, a Join button and "Make your move." |
| `/project/[id]` | Name, descriptor, week line; four rule lines; all 14 dates; the six-piece unlock ladder (static tiles, no player state); full roster in join order. |
| `/player/[id]` | Photo, nickname; per project: level number, 12 markers, inventory tiles (filled = unlocked, dashed = locked), oxblood "Finisher" tag at 12; "Finished" list. |
| `/join` | Form: name, job, why you want in, who referred you. Writes to `waitlist`. No account is created. |
| `/sign-in` | Email, "Send link". Supabase magic link. |

### Player (signed in)
| Route | What it does |
|---|---|
| `/status` ("Me") | Nickname, project name, level number and 12 markers, "Sessions 0 / 12", "Wednesdays left", the two weekly actions ("I'm out this week", "Upload solo session"), a compact inventory list (one row per piece), links to Pre-order, Admin (founders), Sign out. |
| `/inventory` | The six pieces; unlocked black pieces get a size picker and Add; cart bar sticks above the bottom bar; "Pre-order now"; "My orders" with reference codes, status, cancel while unpaid, amount due and bank-transfer text. |
| `/profile` | Photo (cropped client-side to 4:5, max 800px, JPEG), nickname (2 to 24 chars, unique), consent tickbox ("Put my nickname, photo and level on the public site."). |
| `/unlock` | Full-screen "UNLOCKED: SOCKS" shown once per piece, then "Continue". Black pieces on a black screen, oxblood pieces oxblood text on off-white. `/status` redirects here while any unlock is unseen. |

### Founder
| Route | What it does |
|---|---|
| `/roll-call` | One screen, one row per enrolled player, three buttons each (Present, Sauna, Absent), "Mark unmarked as present", sticky "N of 12 marked" and Save. Picks today if it is a session day, else the latest past Wednesday, else the first date. |
| `/admin` | Hub with five tiles. |
| `/admin/orders` | Printer summary grouped by piece, ink, size; each order with one button to advance Paid, Sent to printer, Handed over. |
| `/admin/flags` | Silent misses (FLAG at 2+) and solo sessions (FLAG above 2). |
| `/admin/waitlist` | Join-form entries with Remove. |
| `/admin/setup` | Bank-transfer text, product names and sizes, a price per ladder step, add a player (real name, email, nickname, referrer; enrols into the group, stops at 12 seats), player list. |

## 3. Navigation as it stands

- **Top bar:** logo (links home). Signed out: "Sign in", "Join". Signed in: "Sign out"; founders also "Admin".
- **Bottom bar (signed in only, every page except `/unlock`, `/sign-in`, `/auth`):** Home, Me, Inventory, Profile. 56px tall, current page filled black.
- Known confusion: **Me** (`/status`) and **Profile** (`/profile`) are two different places for "my stuff". Me is progress and actions; Profile is nickname, photo, consent. Players will not know the difference.

## 4. Data model (Supabase, all in `supabase/migrations/0001` to `0007`)

Tables: `project`, `season`, `session_date`, `group`, `player`, `enrolment`, `attendance`, `product`, `ladder_step`, `order`, `waitlist`, `unlock_seen`, `setting`. Views for the public: `public_player`, `public_roster`, `public_level`.

Seeded: PROJECT 01, one season (2 Dec 2026 to 3 Mar 2027, 14 Wednesdays, 12 required), one group of 12 seats, three products (Socks, Singlet, Pants; sizes placeholders), six ladder steps. Level, remaining Wednesdays, can-still-finish, unlock state and silent misses are always computed, never stored (`src/lib/rules.ts`).

Rules enforced in the database, not only the screens:
- One attendance row per player per Wednesday (primary key).
- `give_notice()` closes at Tuesday 21:00 Malaysia time.
- `log_solo()` works only on the Wednesday itself (Malaysian date) and counts immediately.
- `place_order()`: refuses locked pieces, oxblood before finishing, bad sizes, unset prices, duplicates.
- `save_profile()`: nickname 2 to 24 chars, unique, consent needs a nickname, photo must be in the player's own folder.
- `save_roll_call()`: founders only; never overwrites a notice the player gave.
- Row-level security: a plain player cannot write orders or attendance directly, cannot read other players, the waiting list, or founder data. Anonymous visitors read only the public views (nickname, photo, level for players with consent).

Tested in rolled-back transactions: ordering rules (14 checks) and profile rules. Not tested: the signed-in pages in a browser by anyone but the owner, roll call save end to end, solo upload (needs a real Wednesday; first is 2 Dec 2026), unlock screen, the founder admin actions.

## 5. How it is styled now

**Colour:** three tokens only. Black `#10100F` (text, dark blocks), off-white `#EAE4DE` (page background), oxblood `#522E2C` (finisher things only, always on off-white, never on black). No gradients, glows, shadows or other colours.

**Type:** Archivo. Headings use `.font-display`: weight 800, width 125% (expanded), uppercase, letter-spacing -0.02em, plus a 5° forward slant (`skewX(-5deg)`) via the `.slant` class. Labels: small uppercase, wide tracking (`text-xs tracking-widest`). Body: Archivo regular.

**Form language:** flat rectangles, 1px black borders, no radius. "System panel" feel comes from thin rules and uppercase labels. Locked things use a dashed border; unlocked black pieces are filled black; unlocked oxblood pieces are filled oxblood.

**Components:** `PlayerCard` (4:5 photo box, nickname, LV), `LevelBar` (big "LV n" plus 12 boxes), `Ladder` (tile grid or compact rows), `MemberNav` (bottom bar), `Header`, `AdminShell`. Buttons are either black-filled or 1px outlined, minimum 44px (most 48 to 56px).

**Imagery:** none. No photographs are supplied yet, so cards show a faded letter. No illustrations, icons, or motion anywhere.

**Voice:** short, bold, imperative. "Show up." "Earned." "Make your move." "You're not in yet." Never "free", "rank", "elite", "streak", "leaderboard", "failed", "make a move", "Make Moves", "the 5am club".

Constraints from the brief that any redesign must keep: black and off-white only; oxblood only for finishing, never on black; never sort players by level or show a ranked list; the public sees only nickname, photo, level; mobile first; logging a session in two taps; real photographs in 5am light, no stock images or runner/flame/lightning icons; the game feel comes from structure and wording, not neon or sci-fi.

## 6. Owner feedback not yet addressed

1. **Locked versus unlocked is not obvious.** Today the difference is a dashed border versus a filled square and a small word. It needs a much stronger visual difference.
2. **Everything should be project-first and feel like a game.** The page title should be the project itself ("12 weeks, 5am" style), and the project should be the stage: what you earn, who is in, how far everyone has come, history, and excitement ("Ready Player One"). Today the project is a heading above a grid of cards, and a player's own page has no history, no sense of progress through the weeks, no achievements, and no story.
3. **Me and Profile are confusing.** Two pages for "mine".
4. The styling overall reads as plain bordered forms, not a game. Open design question for the next chat: how to get a game feel with only black, off-white and one earned oxblood.

## 7. Things the redesign should decide

- One home for a player: probably a single project-first screen that merges Me, inventory and profile.
- What "history" means: per-week timeline of the 14 Wednesdays (public view must not show misses, notices or flags), project-level progress, finishers.
- What is shown publicly at project level that is not a ranking (for example total sessions logged by the group, weeks completed, finishers count). Not a leaderboard.
- The unlock ladder as the centrepiece: the six pieces as visual objects (needs product artwork or photography).
- Whether oxblood at levels 8 and 10 shows as unlocked but held (current default) or releases at once. **Still an open owner decision.**
- Where the first-time experience, project reveal and unlock moment get their drama.

## 8. Not built yet

- Admin editing of projects, dates and groups (use the Supabase table editor).
- CSV import of the season-one attendance sheet (brief requires it; season starts 2 Dec 2026). Needs the sheet's columns.
- Referrer prompt after a silent miss.
- Founder side tidy-ups: roll call for a past or chosen date, editing a recorded mark.
- Real product names, sizes, prices, bank details, photography, domain, deployment (Vercel), custom email sender (Supabase's built-in email is limited to a few per hour; real players need SMTP).
- Phase 3: second project and group, other timezones. The data model supports them; the screens assume one group per season and pick the first.
- Trademark clearance for "MKMV" is the owner's open item.

## 9. Test and placeholder data to remove before launch

- Prices are test values: socks RM 20, singlet RM 60, pants RM 80 (oxblood socks 20, oxblood pants 80). Bank text is "TEST: Bank transfer details to be added before launch."
- A founder record exists for the owner (real name "Johnson", nickname "Johnson").
- The waiting list has one test row ("TEST DELETE ME") unless already removed.
- `supabase/bootstrap.sql` and `supabase/fix_founder.sql` are one-off scripts with the owner's email in the latter.

## 10. Running it

```bash
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

`.env.local` holds `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public key) and `SUPABASE_DB_URL` (database connection string, used only by local tooling to apply migrations; never put it in client code or commit it). Migrations are plain SQL files applied in order with a small Node script, since the Supabase CLI runs one statement at a time.
