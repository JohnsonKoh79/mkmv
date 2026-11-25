# MKMV website: build prompt

Written 24 Nov 2026 for an AI coding tool. Paste this whole file as the brief. Items marked DEFAULT are choices made for you that the owner can change. Items marked OPEN must be asked before building that part.

---

## 1. Your task

Build the MKMV website: a public, mobile-first site that shows the ongoing projects and who is in them, and lets each member track their progress and unlock kit by showing up.

It should feel like **a stark commercial fashion site running a game system.** Think of the restraint of yeezy.com (big imagery, a bare grid, almost no copy) combined with an RPG "system" layer in the spirit of Solo Leveling (a status window, quests, an inventory, unlock notices). Take the feeling from both. Do not copy either one's layout, assets, wording or names.

It must be **extremely easy to use.** Borrow the restraint of minimalist fashion sites, not their obscurity: every control has a plain label, navigation is always visible, and a member can record a session in two taps on a phone at 5am.

---

## 2. Context you need

**MKMV** (pronounced "make move"; tagline "Make your move.") is a free, referral-only community in Johor Bahru, Malaysia, for ordinary busy people who keep their word. Every Wednesday: 5:00 workout, 6:30 sauna and cold plunge, 7:30 breakfast, done by 8:00.

- Values: **accepting, encouraging, committing.** It is not for elite athletes.
- The purpose is people proving they keep their word. The game is the method, the kit is the proof, and sales are a result. The site must never read as a clothing shop with a community attached.
- MKMV runs as a series of **projects**. Each project is a commitment challenge with its own rules and its own earned kit. More projects will follow, so nothing about Project 01 may be hard-coded.
- Two founders run it with no budget and little time. Anything that needs weekly manual work is a defect.

---

## 3. Vocabulary (use these words in the interface)

| Word | Meaning |
|---|---|
| Project | One challenge, such as Project 01 |
| Player | A member, shown by nickname and photo |
| Session | One Wednesday 5am training |
| Level | A player's session count in a project (LV 0 to LV 12 in Project 01) |
| Inventory | The kit a player has unlocked |
| Locked / Unlocked | State of each kit piece |
| Finisher | A player who completed the project |

---

## 4. Project 01 rules (implement exactly)

**Display name:** `PROJECT 01` with the descriptor `12 sessions. Wednesdays, 5am.` Never write "5am club".

| Setting | Value |
|---|---|
| Window | 14 Wednesdays |
| Sessions needed | 12 |
| Misses allowed | 2 |
| Seats per group | 12 |
| Timezone | Asia/Kuala_Lumpur |
| Cost to join | Free |

**Dates:** 2, 9, 16, 23, 30 Dec 2026; 6, 13, 20, 27 Jan 2027; 3, 10, 17, 24 Feb 2027; 3 Mar 2027. Every date counts.

### Sessions

- At most one session per player per Wednesday.
- **Group session:** a founder ticks the player on the roll call.
- **Solo session:** the player uploads a watch screenshot or photo on that Wednesday. It counts immediately, with no approval step.
- **Sauna only:** the player arrived after the 5:00 start. Recorded, but it does not raise the level.
- Count totals only. There is no streak and nothing ever resets.

### Notice

- A player who will miss taps "I'm out this week" before Tuesday 21:00.
- A miss without notice is a silent miss. The player's referrer gets a prompt to check in.
- Two silent misses raise a flag that only founders can see.
- DEFAULT: more than two solo sessions in a project raises a founder-only flag and blocks nothing.

### Finishing

- Finisher = 12 sessions inside the 14-week window.
- A player can still finish while `sessions + Wednesdays remaining >= 12`.
- When that is false, the player stays in the project, keeps their level and black unlocks, and can join the next season. Show their level as normal. Never show "failed", "eliminated" or similar.

### Unlock ladder

| Level | Piece | Ink | Behaviour |
|---|---|---|---|
| 2 | Socks | Black | Can buy now |
| 4 | Singlet | Black | Can buy now |
| 6 | Pants | Black | Can buy now |
| 8 | Socks | Oxblood | DEFAULT: shown as unlocked, payable only on finishing |
| 10 | Pants | Oxblood | DEFAULT: shown as unlocked, payable only on finishing |
| 12 | Singlet | Oxblood | Free on finishing |

- Unlocking gives the right to buy. Only the finisher singlet is free.
- Oxblood is never purchasable by non-finishers or the public.
- Pre-order only. Product names, prices and sizes must be editable by founders, because printer details are not confirmed.

---

## 5. What is public and what is private

**Public, no login:**

- Every project and its status (ongoing, upcoming, finished).
- Every player in it: **nickname, profile photo, level, unlocked inventory, finisher mark.**
- Each player's profile: the projects they are in or have finished.

**Members only:**

- Session uploads (watch screenshots can reveal home routes).
- "I'm out this week" notices.

**Founders only:**

- Real names, contact details, referrers, silent-miss flags, solo flags, orders and payments.

**Rules:**

- A player picks their own nickname and photo and must tick consent before their profile goes public.
- Never show misses, notices or flags publicly. The public sees a level, not an absence record.
- Rosters are listed in join order. **Never sort players by level and never show a ranked leaderboard.** Levels show a player's own progress, not a comparison of fitness.

---

## 6. Pages

### Public

1. **Home: ongoing projects and who is in.** The MKMV mark, then each ongoing project as a large block: name, descriptor, current week ("WEEK 3 OF 14"), and a grid of player cards (photo, nickname, level). Upcoming and finished projects below. A "Join" link.
2. **Project page.** Rules in a few plain lines, the session dates, the unlock ladder shown as six pieces, and the full roster.
3. **Player profile (status window).** Photo, nickname, level with twelve markers, inventory grid with locked and unlocked pieces, finished projects.
4. **Join.** Interest form: name, job, why you want in, who referred you. Stores to a waiting list. Entry is by referral, so this does not create an account.

### Player (signed in)

5. **My status.** The player's own status window plus the two actions for this week: "I'm out this week" and "Upload solo session". Two taps maximum for either.
6. **Unlock moment.** When a level unlocks a piece, show a full-screen system notice ("UNLOCKED: SOCKS") once, then add it to the inventory.
7. **Inventory and pre-order.** Unlocked pieces with size choice and pre-order. Oxblood pieces at level 8 and 10 show "Available when you finish".

### Founder

8. **Roll call.** One screen, twelve players, one tap each: present, sauna only, absent. Must be usable in under a minute.
9. **Flags.** Silent misses and solo flags.
10. **Orders.** Grouped by piece, ink and size; mark paid, sent to printer, handed over.
11. **Setup.** Projects, dates, groups, players, referrers, ladder, products.
12. **Waiting list.**

---

## 7. Design system

### Colour

| Token | Hex | Use |
|---|---|---|
| Black | `#10100F` | Text; dark surfaces |
| Off-white | `#EAE4DE` | Backgrounds; text on black |
| Oxblood | `#522E2C` | Finisher states and finisher kit only |

- Everything is black and off-white. No other colours, gradients, glows or shadows.
- Oxblood appears only on things earned by finishing. Never use it for buttons, links or alerts.
- Never put oxblood on black. Use it on off-white.

### Type and form

- Use the supplied MKMV wordmark artwork (stacked and horizontal). Do not retype it.
- Headings: Archivo Expanded Bold or the closest available, uppercase, tight.
- A 5° forward slant may be used on headings and line details. Never explain it in copy.
- System panels (status window, unlock notice) are flat rectangles with thin rules and uppercase labels. The game feeling comes from structure and wording, not from neon, sci-fi effects or fantasy art.
- Large real photographs taken in 5am light. No stock images, no illustrations, no icons of runners, flames or lightning.
- Mobile first. Minimum tap target 44px. Text contrast must pass WCAG AA.

### Copy

- Brand: "MKMV". Tagline: "Make your move."
- Never "make a move". Never "Make Moves" as a slogan. Never "the 5am club".
- No registered-trademark symbol.
- English first. Any Chinese is Traditional Chinese.
- icebatu and Pulse may be named only as venue and sponsor.
- Do not use "rank", "elite", "streak" or "leaderboard".
- Keep copy short. Most screens need fewer than twenty words.

---

## 8. Technical defaults

All DEFAULT; ask before changing.

- Next.js with TypeScript and Tailwind, deployed on Vercel.
- Supabase for database, auth and photo storage, with row-level security enforcing section 5.
- Sign-in by email magic link. No passwords, no SMS costs.
- No online payment yet. A player pre-orders, pays by bank transfer, and a founder marks it paid.
- Project rules live in the database (window, sessions required, ladder), not in code.
- Provide a script to import the season-one attendance sheet (CSV), because the season starts on 2 Dec 2026 before the site is live.

### Data model

| Table | Key fields |
|---|---|
| `project` | id, name, descriptor, status |
| `season` | id, project_id, label, start_date, window_weeks, sessions_required, timezone |
| `session_date` | id, season_id, date, notice_deadline |
| `group` | id, season_id, seat_limit |
| `player` | id, real_name, contact, nickname, photo_url, public_consent, role |
| `enrolment` | player_id, group_id, referrer_id, joined_at |
| `attendance` | player_id, session_date_id, type (group, solo, sauna_only, absent), notice_given, evidence_url, recorded_by |
| `ladder_step` | season_id, level_required, product_id, ink, release (immediate, on_finish), price, is_free |
| `product` | id, name, sizes |
| `order` | player_id, ladder_step_id, size, status |
| `waitlist` | name, job, reason, referred_by |

Level, Wednesdays remaining, can-still-finish, unlocked steps and silent-miss count are always computed, never typed in.

---

## 9. Build order

1. **Phase 1:** data model, setup, roll call, public home, project page, player profile, sign-in, my status, solo upload, notice, unlock moment, CSV import.
2. **Phase 2 (before 3 Mar 2027):** inventory pre-order, orders screen, finisher marks.
3. **Phase 3:** a second project, a second group, players in other timezones.

Show the public home and the roll call first for review before building the rest.

---

## 10. Acceptance checks

1. 12 sessions in 14 weeks makes a finisher.
2. Missing weeks 1 and 2 then attending 12 in a row makes a finisher.
3. A third miss does not remove the player, hide them or label them; they can still log sessions and buy black unlocks.
4. A second session on the same Wednesday is rejected.
5. A solo upload on a Wednesday raises the level with no founder action.
6. "Sauna only" does not raise the level.
7. At level 4, black socks and black singlet can be ordered and nothing else can.
8. At level 10, oxblood socks and pants show as unlocked but cannot be paid for.
9. At level 12, the oxblood singlet is free and the two reserved pieces become payable.
10. The notice button closes at Tuesday 21:00 Malaysia time.
11. A signed-out visitor can see nicknames, photos and levels, and can never see a real name, contact detail, miss, notice, flag or order.
12. No page sorts players by level.
13. A player without consent ticked does not appear publicly.
14. A founder can complete roll call for twelve players in under a minute on a phone.

---

## 11. Open questions for the owner

- Hold the level 8 and 10 oxblood pieces until finishing (current default), or release them at once?
- Should session photos ever be public, or stay members-only (current default)?
- Domain name.
- Products, sizes and prices, once the printer confirms minimums.
- Whether "MKMV" is cleared as a trademark (the search is not yet done).
