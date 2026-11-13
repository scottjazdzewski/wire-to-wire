# WIRE TO WIRE — CLEAN JANUARY 1999 WORLD: SINGLE-SOURCE HANDOFF

**Current as verified:** Friday, November 13, 2026; approved-only opening v3 now on `main`. Re-check HEAD and CI before editing.  
**Authoritative repository:** https://github.com/scottjazdzewski/wire-to-wire  
**Authoritative branch for live integration:** `main` — re-fetch HEAD before **every** edit; `5354a92f...` is an older checked checkpoint, NOT the current edit base.  
**Game scenario:** `FOUNDING_1999` effective **1999-01-01**.  
**User's governing order:** START FROM SCRATCH with the approved founding-world people and organizations. Do NOT bring back old generated rosters, owners, simulated racing horses, inherited finances, 2014 cases or old saves. Keep ONLY genuinely connected historical champions, horses, breeding families and pedigree ancestors as read-only history or legitimately living source stallions/mares. **Scale only after a complete small pilot works.**

**2026-11-13 strict approved-only update:** The site at `/next/?world=1999` now uses **37 approved founding organizations**, of which **33 have accepted/established principal IDs and four have NULL principals pending user name approval**. **41 approved named people** are exposed, including accepted secondary partners and non-operating Magic Johnson at Ledbetter; the old 68 test-generated workers, 12 auction catalogs and 118 phantom track training centers are NOT present in the opening world. The 30 Facilities directory rows are references to existing institutions ONLY: **5 stud farms, 15 farms, 10 racing-stable organizations**. No separate buildings or capacity/costs were created. The 118 racecourses are unchanged. The 73 source-linked breeding animals remain as protected historical-current breeding references; racing stable has zero registered runners. Logo assignment is restricted to `public/assets/office/founding-organization-logo-index.json`: **37 exact-ID slots, 21 approved logos now published**, 16 awaiting matching new artwork. The 108 old ownership entities are NOT imported. The previous legacy logo index of 108 organizations is not used by the founding UI. Current UI assets use an `approved-only` cache revision. Cloudflare Pages uses Git-linked `main` deployments; authenticated live verification still requires the owner's Access session.

## CLEAN-SOURCE CODE PURGE AND TEST-WORLD BOUNDARY — NOVEMBER 13, 2026

This is an **approved-entities-only, source-backed January 1, 1999 opening**. The opening contains **37 organizations, 41 founding leadership people, 26 user-selected identity-only jockeys, 20 identity-only trainers, 18 stallions and 55 broodmares, and 118 retained U.S./Canadian/Cuban racecourses**. **ZERO registered racing horses, ZERO certified physical facilities, ZERO unapproved generated game staff or companies, ZERO auction catalogs and ZERO automatic historical racing results.** Personnel identities have no automatically assigned salaries, ratings, mounts or horses. The 30 facility rows are approved **organization references**, not newly registered property assets.

**Production purge:** obsolete 2014/87,500/325,000 synthetic world generators, fake portfolio paths, independent 1999 app, index worker, old expanded-world presets and save migration have been removed from current `main`. The local API rejects retired mode/population options and any attempted old pilot switch. Browser startup resets old saved world namespaces; new clean-world game data must be registered explicitly. The hard gate is `tests/1999-approved-only-world.test.mjs`.

The **118-track North American/Cuban directory** is the only current game map. No international track is admitted; historical closed venues among the 118 are retained as tracks, not automatically race-active. The formerly stale 134/international geography test and read-model compiler expectations have been brought into line with the 118-track source, without removing legitimate read-only pedigree/yearbook history. The old B01 cohort and youngstock-proposal metadata were deleted from the founding directory; approved broodmare geography source provenance remains protected.

**DO NOT restore any deleted generator or import old world saves.** The other name-generation windows may supply **new** horses, facilities and personnel identities, but no game entity becomes active until accepted by exact immutable ID. The target small test environment is populated incrementally only from explicit approvals; this cleanup is not a claim that entries/races can yet run with zero racehorses.

## ELITE JOCKEYS FIRST — INITIAL 1999 PERSONNEL ROSTER

User reconfirmed Nov 13: **start with the elite jockeys**, then continue jockeys and trainers, preserving established original names where reconciled. The original [1999 Trainer & Jockey Foundation Cast v0.1](https://docs.google.com/document/d/1l2_PXxeMbPBbD1f6ysEPeLhj9cIJjSxopqKJjPmx4V4/edit) is source evidence for starting career descriptions/PROPOSED 1999 ages. The v3.3 canonical 1999 people registry is authority for ID and present identities/geography.

The **three highest-profile exact ID/name matches**, reviewed first, are **Nico Arroyo P-000053 (elite circuit), Marcel Dubois P-000055 (established national stakes), Paloma Reyes P-000057 (leading Florida)**. **USER UPDATE NOV 13: these three are male; Paloma specifically confirmed male, name and ID unchanged.** Original ages 31/37/29 are proposals, not certified birthdates; no skill scores. **Simonne Beaulieu**, a leading Ontario/Woodbine turf rider from the same original cast, is now explicitly **user approved as male**, with selective stakes mounts in **New York on big race days** while retaining Woodbine as his main circuit. Because no Simonne P-ID existed in the later v3.3 registry, he receives separate TEST ID **P-1999-J-000001** rather than overwriting unrelated Nico Valenti P-000065. **Emiko Sato and Ray Paxton remain unresolved original-cast candidates**, not admitted into the initial all-male elite group. See [the elite-first 1999 jockey admission plan](./1999-elite-jockey-admission-v1.md).

Identity-only pilot data at `public/data/wtw-1999-jockey-pilot-v1.json`: **26 explicitly user-selected opening jockey identities**, including restored male Simonne Beaulieu, the corrected male Paloma Reyes and Louisiana-born Owen LeBlanc; no unselected canonical jockey reserve is included in the opening roster. `public/next/next.js` displays all 26 in the ORIGINAL OOTP/FM Personnel → Jockeys roster, with exact-ID Horse-style person profiles and blank abilities, ratings, contracts, mount assignments, earnings. This is NOT game-engine employment or proof jockeys are race-bookable. The original 41 owner/principal identities, 37 organizations, 118 domestic/Cuban tracks and current facilities remain unchanged. Actual winter colony availability, birthdates and ages need reconciliation before race settlement.

## CANONICAL APPROVED OWNERSHIP LOGO MASTER — ALL WINDOWS

**One permanent approved-source Drive folder:** https://drive.google.com/drive/folders/15wRW8620R8AD1e7W4Rg69Eog4n2qlT22 (folder ID `15wRW8620R8AD1e7W4Rg69Eog4n2qlT22`; named **APPROVED**). This folder already has approved original PNGs, dimension exports, `manifest.json` files and per-organization ID subfolders. **Do not move, rename or fork the Drive master.** All ownership-logo generation windows place approved master art + exports only here, using the existing `APPROVED_O000014_ARGOSY_BLOODSTOCK` style subfolder convention, exact canonical `O-...` ID. Unapproved drafts stay outside APPROVED.

**Website production assets:** `public/assets/office/founding-organization-logos/` in `scottjazdzewski/wire-to-wire` on `main`; exact ID-to-asset mapping in `public/assets/office/founding-organization-logo-index.json`. Only 37 founding O-IDs are eligible for live 1999 art; Drive intentionally retains additional historic/future organizational imagery outside this roster. No logo may add another entity or alter ownership. **Full official instructions and copy-ready handoff:** [Ownership Logo Master & Website Publishing README](../public/assets/office/founding-organization-logos/README.md).

## AVAILABLE LOGOS PUBLISHED TO THE CURRENT WEBSITE — NOVEMBER 13

The user authorized pushing existing available artwork to the existing approved website. The published exact founding logo manifest at `public/assets/office/founding-organization-logo-index.json` now contains **17 source-registered, exact O-ID + exact organization-name matches**. These 17 existing 64-pixel compact marks are reused by **path reference**; no image files were duplicated or new identities constructed. The same O-ID serves Ownership and Facility pages and horse-owner marks. **20 founding entities still need artwork.** Two legacy organization images were intentionally NOT mapped because their old displayed labels conflict with today's founding identities: O-000002 was `Lattice Farm`, not `Harrowgate Farm`; O-000056 was `Marcus Vale`, not `Quickfire Racing`. Never repurpose those marks by ID alone. New user-created crests should replace older matched artwork only by same O-ID and verified source.

Existing **24 canonical track logos** remain in `public/assets/places/track-logos/` and are selected by track T-ID from the existing `public/assets/office/decision-photo-index.json`. Existing **12 approved profile badges** are in `public/assets/profile-badges/v2/`, unchanged. Three current approved people have existing exact-ID image references; all others use the neutral existing badge. Do not restore unrelated portraits by name guess. The 118 US/Canada/Cuba track directory and all actual track logos remain intact; no international tracks become site entities.

**NEXT PERSONNEL GROUP: JOCKEYS FIRST, THEN TRAINERS.** User wants the actual people present and linked to their approved organizations before settling attribute lists. The existing offline `founding-personnel-1999.mjs` has 26 deterministic jockey *test candidates*, NOT 26 authorized employees. Do not simply activate them. Obtain/reconcile actual jockey identity IDs, names, 1999 ages, nationality, birthplace, and base with the gameplay authority and user-approved founding roster; keep mounts, contracts, earnings, salaries, abilities, ratings and reputation UNKNOWN until authoritative release. Then trainers and remaining roles follow, initially only enough to test a complete one-circuit gameplay loop. The UI is a read-only consumer of the separately authorized gameplay population.

## LOCKED FACILITIES OVERVIEW LAYOUT — NOVEMBER 13, 2026 USER SCREENSHOTS

**HARD DESIGN REQUIREMENT:** The user supplied screenshots of the **actual existing Facilities · Overview and Personnel · Overview screens**, establishing the canonical OOTP / Football Manager layout. Facilities MUST remain a **full-width sortable roster** with **VIEW dropdown**, find-records search, configurable column/contains/status filters, sortable headings, and high-density scrollable rows. It MUST visually align with the existing Stable, Sales and Personnel list screens. **No persistent right inspector, separate split-page workbench, dashboard cards, or unnecessary page hopping.** The previously published `/next/facility-workspace-preview.html` split inspector was **explicitly rejected and deleted**; its test and visual audit capture were removed. Do NOT resurrect it or describe it as approved.

The existing `public/next/next.js` Facilities roster is the design authority, not a new HTML UI. Its default Overview preserves 30 approved O-ID institution references and original CAP / USED / FREE / COND / QUALITY / STAFF / MONTHLY COST / OWNER / STATUS columns; genuine F-ID properties must not be fabricated. A `Trainer Barns` option is added **inside the existing Facilities View dropdown only**. Training Centers, Breaking Facilities, Trainer Barns currently have zero registered physical facilities and must stay empty until engine-authorized properties exist. **Do not redesign any other screens.**

The approved underlying gameplay idea remains: tangible positive and negative horse effects (recovery, stress, training efficiency, soreness, schooling and avoidable setbacks), individual facility finances and profitability, AI parity, and track-hosted trainer barns. Horse owner O-ID, trainer P-ID, actual physical residence F-ID and host racetrack T-ID are independent relationships; a horse owned by one group can live in another trainer's rented Belmont barn. See the revised [Facility roster and horse-effects V2 contract](./FACILITY_PAGE_AND_HORSE_IMPACT_PREVIEW_V1.md). **The coefficients are not yet approved/calibrated**, so do not present illustrative values as official. Future horse-effect, staff and P&L columns should be exposed through the SAME full-width Facilities roster / View dropdown, not side panels or new pages.

## LOCKED WEBSITE PROFILE TEMPLATES — NOVEMBER 13, 2026

The user approved **Track-style profiles for 37 founding ownership organizations and 30 facility institution references** (same immutable O-ID, no extra physical facilities), and **Horse-style dossiers for the 41 admitted founding people** (immutable P-ID). Correct implementation now **REUSES THE ORIGINAL** `profileDetail()` renderer inside `public/next/next.js`, supplied by the existing `public/next/1999-restored-profiles.js` source adapter. Owner/facility pages have the same `ng-profile-track` + `ng-track-workspace` shell as Racecourse pages. Approved people have the same `ng-profile-horse` + `ng-horse-dossier` shell as Horse pages. The earlier imitation `1999-founding-profiles.js` was **deleted** and must never be reintroduced. All 41 approved people have exact O-ID organization associations, shown on Personnel → Principals; Magic Johnson remains a major non-operating investor. Four still unapproved principal name proposals remain outside live identities. No synthetic person abilities, registered 1999 runners, trainer-created facilities, phantom training centers, new contracts or finances may leak into clean opening. Logo assignments continue via 37 exact organization ID slots, without old legacy logo fallback.

**Profile design and route authority:** [1999 founding profile template contract](./1999-founding-profile-template-contract.md). **Do not redesign these templates in later windows without user direction.** Owner and facility pages are distinct views of one organization; people use the detailed horse-style biography + attributes + connections + career panel structure.

## NO-SCOPE-DRIFT TRACK AND TEST-POPULATION RULE — USER RECONFIRMED NOV 13

**Track website inventory is 118 NORTH AMERICAN/CARIBBEAN venues ONLY, including Oriental Park, Havana, Cuba.** Keep all 118 exact canonical T-IDs and geographic locations displayed in the Racecourse directory, including the **16 historically closed before 1999** as historical/dormant site entries. There are **no international IT-IDs** in the 1999 website. The 102 operational 1999 WTW tracks remain eligible for modeled scheduling; dormant tracks are not deleted, but neither are they automatically scheduled. DO NOT create a new training center or barn from a track record. The canonical directory is `public/data/track-geography-v33.json` and its 118 `registry=NORTH_AMERICA` entries; the earlier founding JSON has only 102 currently operational track program rows.

**The clean opening state is a checkpoint, NOT the final test game.** The intended progression is: (1) isolate/wipe old synthetic saved test ownership/horse/personnel/facility/financial entities while protecting all canon; (2) retain 37 approved organizations and 41 approved people, 73 source-linked breeding horses, and 118 domestic site tracks; (3) populate a **controlled starter test roster** of eligible racing horses and necessary employees/facilities, explicitly marked as test-game entities with no false historic provenance, linked to approved IDs; (4) **refine/validate ages** (racing-year age for horses, DOB-based age for humans), family and horse relationships, geographic travel, and interactions; (5) test ALL core gameplay loops: races/entries, trainer/jockey assignments, breeding, growth, sales, shipping, finances, contracts, saving/loading and season advancement. The gameplay-engine window owns the controlled admission of active starter entities; UI displays exactly what is released. Do not present “empty forever” as success, invent unrelated organizations or introduce international tracks.

## 1. IMPORTANT: stop using the stale branches and handoffs

As verified, GitHub has 79 branch names and six open PRs. In particular, PR #75 (`founding-world-clean-1999-pilot`) is a WIP branch, while #63/#61/#62 were designed around the old 87,500-horse population. **Do not merge those PRs or cherry-pick their full-world data into `main`.** The old `docs/1999-management-testing-handoff.md` instructs people to run 87,500 horses, 3,308 owners and the older `wtw1999ManagementStateV1`: it is superseded for the clean rebuild.

Single-window workflow: operate against latest `main`; do not create a new development branch unless the user explicitly asks. Use the existing canonical ID namespace and current files; inspect latest commit + corresponding CI each time before overwriting any shared file. Do not run parallel mass updates on the same file. **Never delete Git branches, historical archives or PRs solely because they are old**; leave them unmerged and inert unless the user authorizes cleanup.

This handoff is the current startup document. If another document conflicts with the clean opening world, refer to the user's latest directive and the verified `docs/1999-founding-population-and-integration-gates.md`, then reconcile from live `main` rather than guess.

## 2. Two-window division of responsibility

**THIS WINDOW / NEXT UI WINDOW:** approved premium Office/FM interface, browser navigation, player-facing profiles (horse, owner, farm, principal, trainer, jockey), page data contracts, read-only founding-world data integration, asset/logo lookup by immutable IDs, screen functionality, browser tests and narrow website repository changes. Keep all approved assets, responsive geometry and established design. The player site is `/next/?world=1999`. The plain `/1999/` world viewer is **not** a replacement game interface.

**SEPARATE GAMEPLAY-ENGINE WINDOW:** all authoritative race simulations, eligibility, training decisions, calendar/AI, breeding outcomes, financial opening accounts, fees, purse settlement, transfers, contracts, age/ability progression, and save integrity. This window publishes a versioned, testable world/gameplay release and manifest in its agreed Google Drive workspace; the website integrates **that** release. DO NOT create a second independent engine, live ledger, payout calculator, or competing state database in the UI.

## 3. Verified main-branch world state (November 13, 2026)

| Item | Current state |
|---|---|
| Founder-selected organizations | **37** (23 established IDs, 14 founding-scenario provisional IDs) |
| Identified organization principals | **33 approved/established**, **4 slots BLANK pending approval**; proposed names remain in docs, not in live game |
| Named source/new world people | **41 approved identities** |
| New staff / jockeys / trainers | **0 activated**; old 68 candidates remain offline test fixtures only |
| Total people surfaced | **41** |
| Registered playable racing horses | **0**; stable is deliberately empty |
| Facility reference rows | **30**; 5 studs, 15 farms, 10 racing operations; zero invented buildings, breaking yards or track training centers |
| Auction catalog entities | **0**, no legacy test catalogs |
| Published founding organization logos | **17 exact-ID/name matches**, 20 still awaiting correct artwork; old extra organizations remain excluded |
| Connected living stallions | **18** |
| Connected living broodmares | **55** |
| Total living animals in the opening World | **73** |
| Proposed 1997/1998 youngstock | **84 read-only candidates**: 41 born 1997, 43 born 1998; NO assigned certified birth, owner, breeder, registered name, sale or finance |
| Historical horse–organization links | **67 associations involving 61 source horses**; historical only |
| Historic archival pedigree | Read-only five-generation trace from selected roots; NO other deceased winners join the active 1999 World |
| Tracks | **102 operating geographical references** plus 32 historic; NOT 102 simultaneously running meets |
| Opening owner cash, contracts, race payouts | **NOT CERTIFIED**, do not invent values |
| Older B01 generated runners | **39 quarantined**; not playable. Six B01-only trainers also excluded |
| Old 325,000 horses / 3,308 owners | Outside `FOUNDING_1999` (explicit benchmark only) |
| Old 2014 saves, stories, cases | No import into founding scenario |

Current local saves use the isolated `wtw1999FoundingStateV1`. These are not proof of finance/AI engine certification. Grooms and exercise riders are permanently excluded from player-facing staff.

### Critical recent change

At older checkpoints the opening world showed 39 runners / 112 living horses. That is **obsolete**. The November 13 reset removed those 39 synthetic B01 runners. **Do not report 39 or 112 as the current clean starting inventory** or reintroduce the horses merely to make a Stable or training test pass.

### Tests confirmed for inspected `main` commit `5354a92f...`

- WTW Canon Desk: **318/318 tests passed**.
- 1999 source integration: **67/67 passed**.
- Premium Office `management-1999-browser`: **passed** with empty stable and founding data.
- Desktop Visual Audit: **passed**.
- Separate older `WTW 1999 horse development` run at commit `55b71243...`: **failed**, specifically `Active owned horse available`, because the scenario has no registered owned runners. This test has **not** been shown passing at `5354a92f...`; rebuild its meaningful test against the *new* approved first racing horse rather than fabricating an old one.
- The CI result must be checked on the **new exact HEAD** after any later push.

## 4. Actual source-of-truth files to open, in this order

1. `docs/FOUNDING_1999_SINGLE_SOURCE_HANDOFF_CURRENT.md` — this current handoff.
2. `docs/1999-founding-population-and-integration-gates.md` — approved hard-reset scope, true inventory and priority order.
3. `docs/1999-founding-gameplay-integration-contract.md` — exact fields required from the gameplay-engine owner.
4. `docs/1999-founding-leadership-roster.md` — 37 immutable organization IDs, 33 approved/established and four proposed revised principals; V2 roster is authoritative, not the old 24-proposal staging list.
5. `public/data/wtw-1999-founding-directory-v1.json` — authoritative flat **opening identity/read-directory** reference, NOT a transaction ledger.
6. `public/1999/engine/founding-world-1999.mjs` — game-facing isolated read-model scenario.
7. `public/1999/engine/founding-leadership-1999.mjs`, `founding-personnel-1999.mjs`, `founding-ancestry-1999.mjs`, `founding-youngstock-candidates-1999.mjs` — distinct leadership, professional, historical parent, and UNCOMMITTED youngstock layers.
8. `public/1999/engine/local-api.mjs` + `public/next/1999-ui-source.mjs` — existing adapter and UI integration.
9. `public/next/index.html`, `public/next/next.css`, `public/next/next.js`, `public/next/1999-restored-profiles.js` — **the ONE approved FM Track/Horse renderer and source adapter; no parallel profile templates**.
10. `tests/1999-founding-world.test.mjs`, `tests/1999-founding-youngstock-candidates.test.mjs`, `tests/1999-founding-leadership.test.mjs`, `scripts/1999-management-browser-smoke.sh` — core regression probes.

Narrative and logo authority:
- World Bible: https://docs.google.com/document/d/1zBmtdFenkeP70odONetitXFcruPc0qwt485JAR8lDDs/edit
- Founder logo/aura handoff: https://docs.google.com/document/d/1tA-4NLG7QoZ4qhugnku40QkV_PsvuWP1tAO81jze0z8/edit
- Do not confuse the separately packaged `WIRE_TO_WIRE_UI_CURRENT` historical Office HTML/v24 reference with the latest live `/next/` 1999 founding integration: preserve approved UI, but start engineering from current `main`.

## 5. Specific accepted organization identity examples

- Kingsmere: Thomas Kingsley, founded 1949; granddaughter Carolina leads in 1999; historical breeder of Heyday; owner of Heyday was Whitcombe, trainer Arthur Bell (roles distinct).
- Aurelian Stud: David Carlin and Elliot Kessler; historic Julian Voss departure created bitter Argosy rivalry, **not** a Kingsmere rivalry.
- Wetherby Plain: Charles Wetherby IV, 1874 traditional broodmare family.
- Harrowgate: approved rename from Lattice; retain `O-000002`, Paper Tiger connection; unrelated to Miriam Vale.
- Ashby Vale Farm: Miriam Vale in Virginia, fiercely Virginia-bred; historically linked to Dominion Nails; independent from Harrowgate.
- Crescent Mile: bred and **retained** Who Knows and Saint Nobody under user's updated story; reconcile old race-owner history rather than overwrite it.
- Ironweed: western Kentucky cattle roots, durable runners.
- Four Corners: Nathaniel 'Nate' Quill, Maryland breed-to-race; After You bloodline.
- The user also approved **Midway** (Ditka), **Knight’s Way** (Knight), **All The Colors**, **Velvet Key Racing**, **Quickfire Racing / Vince Bellini**, **Longleaf / Dr. Everett Raines**, **Potomac Heritage Stable** (Buchanan), and **Palma Real / fictional President Rafael Cienfuegos**.
- Existing historical source horse IDs, pedigree relationship IDs and results are immutable. Breeder, racing owner, original breeder, foaling farm, trainer, current stable and stallion station are separate relationships; never infer one from another.

This list is illustrative, NOT an extra roster: the 37 exact IDs are in the leadership and directory files.

## 6. The very next actual production work — do this in sequence

**A. Leadership identity lock (partially accepted, FOUR names pending):** User accepted 21 of the former 24 primary proposals, Dino Marks at All The Colors, and all otherwise unchanged secondary leadership. The proposed replacements Graham Kincaid (Harrowgate), Hugh Radcliffe (Huntcross), Sebastian Pryce (Argosy Racing) and Daniel Calder (Ledbetter Calder) still require individual name approval. The prior Ledbetter link was corrected: Magic Johnson P-910018 is a MAJOR NON-OPERATING INVESTOR, never the manager. Voss P-000018 still runs Argosy Bloodstock O-000014, distinct from well-financed, analytics-led Argosy Racing Partners O-000057. Do not create employment/ownership contracts for these links.

**B. New opening horses — GAMEPLAY OWNER RELEASE REQUIRED:** The 84 `H-FNEW-1997/1998-xxxx` rows are proposals only. Need game-approved founding birth and ownership transactions: immutable Horse_ID, accepted dam/sire, correct foaling dates/locations, actual breeder, 1999 owner/residence, age/sex, trainer and racing barn when applicable, current/potential curves, health/attributes. No registered name until real game registration event through the accepted horse-name release. The independent research name-engine v4.46 is **not yet an approved deployed registrar**. Do not fabricate horse race histories or retroactively assert a historical birth transaction.

**C. Small playable cohort first:** Start with ONE plausible Jan/Feb 1999 racing circuit populated with enough genuinely named, owned, eligible, sound horses and staffed barns to run the full game loop. 250–400 runners is only a later planning estimate across the entire founding world; do not scale until a small complete circuit works. Pure stud and nursery farms may have zero racehorses.

**D. Authoritative engine finance / transactions:** Gameplay engine supplies fresh opening cash/assets/debts, professional contracts, board/stud fees, training cost, sale transfers, purse postings and valid save/reload tests. Website must show uncertified/not available, NEVER '0 paid' or old test balances, until approved real values arrive.

**E. Integrate without redesign:** Exact-ID read adapter presents owner/farm profiles, horse attributes/ancestry, Personnel, Facilities, Breeding, Racing entries/results, Sales, Finances, World Search and Decision Desk on the already-approved `/next/` Office interface. Every page must resolve to the **same** horse/owner ID; no orphan aliases or invented result rows. Preserve responsive UI.

**F. Quality gate, then scale:** Node tests + current source tests + Chromium screenshot/browser smoke + first full race/finance/breeding engine integration + serial save/reload. Verify each on the exact commit and engine release. Increase to 4–6 circuits only after one works; expand further afterward.

## 7. Strict anti-branch / anti-contamination instructions

- No new parallel ledger, duplicate horse database, replacement roster, arbitrary synthetic horse import, old B01 resurrection or 'placeholder' race result.
- No old `CANON_ANCHORED_TEST` as player default; it is an explicit engineering test mode.
- No old 2014 content, old management save key or imported demo money.
- No grooms or exercise riders in the UI staff population.
- No UI redesign; no generic alternate management dashboard.
- No unsupported numerical salaries, foaling contracts, purchases, purses or opening cash.
- No promotion of the four newly suggested names until the user approves them individually.
- No unauthorized overwrite of another window's canonical gameplay release.
- No branch merges or mass PR cleanup without reviewing ancestry and user approval.
- After any code change: re-fetch newest `main`, check CI at the exact new SHA, report completed real work and one next substantive action.

## 8. The new window's initial action (not another general audit)

1. Re-fetch `main`, identify any changes newer than the inspected `5354a92f...`, and run exact-commit CI verification.
2. Close the four remaining revised-leadership name approvals. Other 33 founder principal roles are already established or explicitly accepted; don't reopen them absent new user direction.
3. Ensure the existing premium Office UI has correct empty-state behavior and no old data requests. Fix actual browser defects in narrow commits.
4. Prepare a versioned, exact-ID **UI intake contract** against the gameplay engine's forthcoming first new 1999 horse cohort. Integrate only once released; avoid simulating or inventing the cohort in the UI.
5. Return a concise checkpoint: authoritative commit, actual live world counts, verified tests, integrated files, unresolved authority blockers and next concrete commit.

**Success definition:** A real, small, self-consistent 1999 founding world that is playable end-to-end; not merely a decorated page, giant mock database, historical essay, or inflated passing-test report.
