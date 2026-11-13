# WIRE TO WIRE — CLEAN JANUARY 1999 WORLD: SINGLE-SOURCE HANDOFF

**Current as verified:** Friday, November 13, 2026, 7:17 AM America/New_York.  
**Authoritative repository:** https://github.com/scottjazdzewski/wire-to-wire  
**Authoritative branch for live integration:** `main` — re-fetch HEAD before **every** edit; inspected HEAD `5354a92f850bda93ed80265bbae4c2efd38e3875`.  
**Game scenario:** `FOUNDING_1999` effective **1999-01-01**.  
**User's governing order:** START FROM SCRATCH with the approved founding-world people and organizations. Do NOT bring back old generated rosters, owners, simulated racing horses, inherited finances, 2014 cases or old saves. Keep ONLY genuinely connected historical champions, horses, breeding families and pedigree ancestors as read-only history or legitimately living source stallions/mares. **Scale only after a complete small pilot works.**

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
| Identified organization principals | **37 slots**; 13 established/approved, **24 proposed** for user review |
| Named source/new world people | **46** |
| NEW available professional candidates | **68** (26 jockeys, 10 trainers, 8 farm managers, 6 bloodstock agents, 4 vets, 4 farriers, 4 racing secretaries, 6 jockey agents); NOT employed; zero payroll |
| Total people surfaced | **114** |
| Registered playable racing horses | **0**; stable is deliberately empty |
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
4. `docs/1999-founding-leadership-roster.md` — exact 37 organizations, their principal IDs/status, and 24 provisional principal proposals. **Do not invent 24 different names.**
5. `public/data/wtw-1999-founding-directory-v1.json` — authoritative flat **opening identity/read-directory** reference, NOT a transaction ledger.
6. `public/1999/engine/founding-world-1999.mjs` — game-facing isolated read-model scenario.
7. `public/1999/engine/founding-leadership-1999.mjs`, `founding-personnel-1999.mjs`, `founding-ancestry-1999.mjs`, `founding-youngstock-candidates-1999.mjs` — distinct leadership, professional, historical parent, and UNCOMMITTED youngstock layers.
8. `public/1999/engine/local-api.mjs` + `public/next/1999-ui-source.mjs` — existing adapter and UI integration.
9. `public/next/index.html`, `public/next/next.css`, `public/next/next.js` — **approved FM interface to preserve**, not redesign.
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

**A. Leadership identity lock (UI can prepare; user approval / canon required for promotion):** Use the already prepared 24 principal proposals and six secondary directors; do not regenerate names from scratch. Preserve verified 13 and 37 total organization IDs, stable/farm roles, locations and ownership-group/principal relationships. Mark proposals as such until user acceptance.

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
- No unauthorized overwrite of another window's canonical gameplay release.
- No branch merges or mass PR cleanup without reviewing ancestry and user approval.
- After any code change: re-fetch newest `main`, check CI at the exact new SHA, report completed real work and one next substantive action.

## 8. The new window's initial action (not another general audit)

1. Re-fetch `main`, identify any changes newer than the inspected `5354a92f...`, and run exact-commit CI verification.
2. Compare the 37-organization leadership roster against latest user-approved names/IDs; flag only genuine name conflicts, not all history.
3. Ensure the existing premium Office UI has correct empty-state behavior and no old data requests. Fix actual browser defects in narrow commits.
4. Prepare a versioned, exact-ID **UI intake contract** against the gameplay engine's forthcoming first new 1999 horse cohort. Integrate only once released; avoid simulating or inventing the cohort in the UI.
5. Return a concise checkpoint: authoritative commit, actual live world counts, verified tests, integrated files, unresolved authority blockers and next concrete commit.

**Success definition:** A real, small, self-consistent 1999 founding world that is playable end-to-end; not merely a decorated page, giant mock database, historical essay, or inflated passing-test report.
