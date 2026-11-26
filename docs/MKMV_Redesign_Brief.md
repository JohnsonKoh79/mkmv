# MKMV website: redesign brief (v2)

Written 25 Nov 2026 for an AI coding tool. Read `docs/MKMV_Website_Build_Prompt.md` first. **This brief overrides its sections 5, 6 and 12 wherever they differ, and builds on section 13.** Everything else there still holds: the rules engine, the database rules and row-level security, the design system and the copy rules.

Items marked OPEN must be asked before building the part they affect.

---

## 1. The problem

The site was built as if MKMV were one project. The account, the menu and the home page all belong to Project 01, so signing in feels like enrolling, and nobody can tell that this is the first project or what comes next.

## 2. Three levels

| Level | What it is | What belongs to it |
|---|---|---|
| MKMV | The community | The account, nickname, photo, the player's whole record |
| Project | One challenge | Rules, missions and kit, the map |
| Batch | One group of up to 12 with its own dates | Roster, each player's level, the weekly actions |

- Signing up creates an MKMV account and nothing else.
- Joining a project is a separate request that a founder approves.
- **Naming:** the project's title is `12W · 5AM` and its small label is `Project 01`. Batches are `Batch 1`, `Batch 2`.

## 3. Who sees what

Everything below is public with no login:

- Home and the list of projects.
- Each project page: missions, map, group numbers, who is in, rules.
- Each player page: nickname, photo, level, record, achievements.

Only a signed-in person sees **Me**. Only a player in a running batch sees **My Move**.

## 4. Navigation

- **Signed out:** top bar only: logo, Sign in, Join. No bottom bar.
- **Signed in:** bottom tabs, in this order:

| Tab | Who sees it | Contents |
|---|---|---|
| Projects | Everyone signed in | The list, then each project's page |
| My Move | Players in a running batch | Level, this week's actions, missions |
| Me | Everyone signed in | Profile, my projects, my requests, my kit, achievements, record |

- Remove the Home, Inventory and Profile tabs.
- Founders get an Admin link inside Me. Admin stays a separate area (section 13 of the build prompt).

**Routes:** `/` projects list · `/project/[slug]` · `/project/[slug]/request` · `/move` · `/me` · `/player/[id]` · `/admin/*`. Redirect `/status` and `/inventory` to `/move`, and `/profile` to `/me`.

**After sign-in:** a player lands on My Move; anyone else lands on Projects.

## 5. Screens

Six mock-ups are in `docs/mockups/`. Match their layout, hierarchy and wording. Their names and numbers are sample data.

1. **Home, signed out** (`Main.dc.html`). Black hero with "Make your move." and one line about MKMV, then the project list. Each project is a block showing its label, status, title, descriptor, three kit pictures and one box per batch. A running batch box shows its dates, week, seats taken and the button. The next batch box shows "Date to be confirmed" and Join the waitlist. A dashed "Next project" block sits below with its own waitlist button.
2. **Home, signed in without a seat** (`HomeIn.dc.html`). Replace the hero with "You're registered. Pick a project." Same project list.
3. **Project page** (`Project.dc.html`). Label, title, descriptor; a Batch 1 / Batch 2 switch; week and seats; the primary button with its deadline; then the map, group numbers, missions, who is in (empty seats shown as "Open seat"), and the rules.
4. **My Move** (`MyMove.dc.html`). Project and batch, the level as a huge number, twelve markers, sessions and Wednesdays left; a black "This week" block with Upload solo session and I'm out this week; then the missions with the player's progress.
5. **Me** (`Me.dc.html`). Photo, nickname, edit link; My projects (each links to its My Move); My requests with status; My kit grouped by project; Achievements; My record; Sign out.
6. **Request to join** (`Request.dc.html`). See section 7.

The project button follows the table in section 13 of the build prompt. A person with a request in sees its status in place of the button.

## 6. Missions

The kit is presented as missions. Every piece says how it is earned.

| Mission | Complete by | Reward | Cost |
|---|---|---|---|
| Mission 01 | Show up 2 times | Socks · Core black | Buy |
| Mission 02 | Show up 4 times | Singlet · Core black | Buy |
| Mission 03 | Show up 6 times | Shorts · Core black | Buy |
| Mission 04 | Show up 8 times | Socks · Reserved | Buy, finishers only |
| Mission 05 | Show up 10 times | Shorts · Reserved | Buy, finishers only |
| Final mission | Finish: 12 sessions | Singlet · Reserved | Free |

- Only the Reserved singlet is free. A finisher who wants the Reserved socks or shorts pays for each one separately when they redeem it. Before finishing, a completed Mission 04 or 05 reads "Complete. Yours to buy when you finish."
- Missions belong to a project. Store the mission label and title with each ladder step, so the next project defines its own.

**Mission card:** picture, mission label, a status chip, the title, "Reward: …", a row of segments (one per session needed), and one line or button.

| State | Picture | Chip | Last line |
|---|---|---|---|
| Public, no player | Full | `4 sessions` | How to get it |
| In progress | Black silhouette | `2 of 4` | `2 sessions to go.` |
| Locked | Black silhouette, dashed border | `Locked` | `4 sessions to go.` |
| Complete | Full | `Complete` | **Get it** button and the price |
| Complete, held (04, 05 before finishing) | Dimmed | `Complete` | `Yours to buy when you finish.` |

- The button says **Get it**. Do not use "Pre-order" anywhere.
- Do not name a payment method on mission cards or buttons. OPEN: where the payment instructions appear after someone orders.
- **Men's / Women's switch** above the missions. It swaps the singlet and shorts pictures (`-m` and `-w` files in `public/kit/`), is remembered per person, and becomes the cut on the order. Show the cut in the founder's printer summary.
- Reserved cards use an oxblood border and oxblood text on off-white. Oxblood never sits on black.

## 7. Request to join

Registering takes an email only. These details are asked when someone requests a seat:

| Group | Fields |
|---|---|
| About you | Full name, phone number, date of birth |
| Your health | Health conditions or injuries (free text), emergency contact name and phone |
| Why you want in | Free text |
| Who referred you | The member's name and phone number, both required |
| Ticks | "I can make 12 of these Wednesdays at 5am." and "MKMV may keep my details to run this project." |

- **Minimum age is 18.** Check the date of birth in the database function, not only in the form.
- Show the batch dates and how many Wednesdays are left against the 12 needed.
- All of these fields are founder-only. Health details and emergency contacts must never appear in a public view, a player-visible query, or a default export. Record when consent was given.
- Statuses, decisions and the waitlist follow section 13 of the build prompt.
- OPEN: the wording of a privacy notice and of a participation acknowledgement. Leave a clearly marked place for both.

## 8. Settled since the build prompt

- Reserved pieces at levels 8 and 10 are held until finishing.
- A project runs in batches. Batch 1 takes requests until Tue 15 Dec 2026, 21:00 Malaysia time.
- Batch 2 has no date yet: show "Date to be confirmed" with a waitlist.
- The product is Shorts, not Pants.

## 9. Still open

- Prices.
- Where payment instructions appear after ordering.
- Privacy notice and participation acknowledgement wording.
- Whether registered people without a seat get a locked preview of My Move.

## 10. Build order

**Launch comes first.** The first session is Wednesday 2 Dec 2026. Do nothing here until the live site is ready for it.

1. Data: project and batch labels, mission label and title on ladder steps, the request fields in section 7 with their security rules, the saved cut preference. Show the migration before applying it.
2. Routes and navigation: the new routes, redirects, the top bar and the three tabs.
3. Home and the project list.
4. Project page with missions and the cut switch.
5. Request to join, and the status on Me.
6. My Move.
7. Me.

Stop after steps 1, 4 and 7 for review.

## 11. Acceptance checks

1. A new account lands on Projects, has no level, and appears on no public page.
2. Signed out, there is no bottom bar. Signed in without a seat, the tabs are Projects and Me. As a player, they are Projects, My Move and Me.
3. Home shows every project with its batches, and the next batch reads "Date to be confirmed".
4. The words "Pre-order", "Inventory" and "Home" (as a tab) appear nowhere.
5. Every mission card states what completes it and what the reward is.
6. At level 2, Mission 01 is Complete with a Get it button, Mission 02 reads "2 of 4", and the rest are silhouettes.
7. At level 10 without finishing, Missions 04 and 05 are Complete but cannot be bought.
8. On finishing, the Reserved singlet is free, and Reserved socks and shorts are each bought separately.
9. Switching to Women's changes the singlet and shorts pictures, survives a reload, and is recorded on the next order.
10. A request cannot be sent without full name, phone, date of birth, emergency contact, the referrer's name and phone, and both ticks.
11. A date of birth under 18 is refused by the database.
12. Health details, emergency contacts, dates of birth and phone numbers are returned to founders only.
13. No mission card or button names a payment method.

## 12. About the mock-ups

The files in `docs/mockups/` are reference only. They come from a design tool, so ignore the `support.js` line, the `x-dc` wrapper and the script block, and do not copy their `/_blob/…` image addresses: the real kit pictures are in `public/kit/`. Read them for structure, spacing, type sizes and wording.
