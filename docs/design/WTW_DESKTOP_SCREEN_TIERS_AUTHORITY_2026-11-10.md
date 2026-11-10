# WTW — DESKTOP SCREEN-TIER AUTHORITY & BUILD ORDER
**Date:** 2026-11-10
**UI authority:** Current `main` at `public/next/next.js` and `public/next/next.css`. The approved Racing Office shell, identity shields, real asset media references, and forest-green/gold style remain locked.
**Scope:** Presentation, navigation and layout only. **Gameplay, horse and people attribute generation, AI decisions, simulation state, and canonical world/historical data belong to the separate Playability and Data windows.**

## Hierarchy and acceptance workflow
- **Shell / Tier 0:** Global navigation, compact Racing Office, Continue/Save/date, primary departments and organization badge. Already approved; protect it.
- **Tier 1 — entity and operating OVERVIEW pages:** Horse Profile, People Profile (trainer/jockey/owner/agent/staff by source role), Farm Profile, Track Profile, Organization Overview. This is the current UI build tier.
- **Tier 2 — detail tabs from Tier 1:** Horse Career Record, Pedigree, Achievements, Connections, History; People Attributes, Reputation, Stable Horses, Career, Connections, History; Farm Connected Horses, Operations, Connections, History; Track Meet Schedule, Major Races, Connections, History; Organization full roster, commitments, open cases and financial details. Build and approve as a *separate batch after Tier 1 is visually approved*.
- **Tier 3 — specific deep records or actions opened from detail:** named owners/trainers/jockeys, one horse's historic starts, an individual race or official result, a particular parent/offspring or breeding transaction, a named sale lot, a specific facilities task, official season/year archives, individual management decisions.
- **Tier 4 — archive and analytical views:** full searchable historical race database, comparison reports, multi-season performance charts, historical pedigrees, long-range finances and operational analytics, all linked to authoritative IDs.

## Tier 1 implementation
| Overview | Sourced first-screen questions | Current UI delivery |
| --- | --- | --- |
| Horse | Foaling flag/state, date of birth, sex, racing age; four athletic trait groups; training/race plan; actual career info and immediate actions | Existing approved compact no-scroll athlete layout; gameplay window owns observed attribute values |
| People | Role, age, birthplace, base; scoped professional skills; source-backed reputation/trust; career and horse assignments | Three-column, fixed desktop overview; only headline skills appear here; full list is Tier 2 |
| Farm | Location, type, owner, current status; linked horses; real professional connections; recorded achievements | Three compact, source-linked cards; details move to corresponding Tier 2 tabs |
| Track | Location, surfaces, operating status, circuit; meet information; racing conditions; 5 sourced clickable featured stakes | Three compact cards; all stakes and long meet calendars are Tier 2 |
| Organization | Real player organization identity and stats; first four horses, racing commitments, open cases, follow-ups; actual cash status and navigation to five departments | Six equal-information panels in a 3x2 desktop dashboard, with source-linked “all” routes and no duplicate hero |

## Required cross-screen visual behavior
1. Consistent compact title row, actual approved emblem/photo only when source-linked, identity metadata immediately next to the name.
2. First-screen useful information is above the fold at 1366×768; **no scrolling the whole Overview** and no independently scrolling overview cards. More detail belongs to the direct tabs/links.
3. Equal panel-heading heights, matching key/value density and type scale, text wrapping only where absolutely needed, no clipped actionable controls.
4. Every table row, destination link and “ALL” action goes to the real existing route or dedicated later tier. Avoid dead mock controls.
5. Missing source values render as unavailable/unknown, never invented. In particular, ratings and reputation are owned by the gameplay window.
6. Main Office is frozen. New visual work must not rewrite source game state, seed entities, change save keys or invent historical records.
7. Test the layout at 1280×800, 1366×768, 1440×900; automated tests and Cloudflare deployment passing do not count as authenticated pixel-level signoff.

## Permanent navigation, typography and justification rules (2026-11-10)
- **Back/Forward:** The compact global arrows use the actual visited browser page history. Original Office entity routes and UI-only destinations must push navigable entries. Popstate and direct URL loads restore the corresponding view; route changes must never be simulated with inactive buttons.
- **Global Search:** The search icon and Ctrl+K lead to a typeahead directory of all *currently openable* horse, people, farm, track and race records, management pages and available decisions. Use original handlers and the historical Archive rather than creating a shadow data registry. Unknown names produce an explicit no-match state; do not invent a page.
- **Presentation capitalization:** All human profession/role labels are consistently **Title Case** (e.g., **Stable Staff**, **Bloodstock Agent**, **Farm Manager**) in headers, relationships, menus and search results. Preserve actual canonical person data unchanged; use a centralized display formatter.
- **Centered UI geometry:** Center controls and their iconography vertically/horizontally, center comparable KPI and status values, and place all text/icon/button content on matching baselines. Use consistent heading heights, row padding, column widths, and balanced spacing across same-tier screens.
- **Readability exception:** Do not center paragraphs, long horse/person names, narrative intelligence, legal/source notes or dense table descriptions. Leave those left-aligned for scanning. *Center justification is a layout consistency rule, not a blanket text-align:center instruction.*
- **Office whitespace:** At normal desktop viewport sizes, first increase legibility and size of source-backed text in Decision Desk/Intelligence/Your Call rather than inventing new facts or empty cards. No-scroll Tier 1 Overviews remain the highest priority.
- **Verification:** Regressions are checked in `tests/next-office-v7.test.mjs`; browser screenshot acceptance is distinct from code/test/deployment success.

## Permanent horse owner-badge and OOTP directory rules (2026-11-10)
- Every horse name displayed in a navigable profile, Stable Roster, Race Schedule, People/Farm horse-assignment link, Organization Overview or global search roster must use the **same `horseOwnerBadge` component** beside its name.
- An owner badge represents actual owner/owner-organization identity, **not** the horse's trainer, barn, racing stable, foaling farm or currently associated person. Unknown ownership is explicitly shown with the same neutral '?' mark and accessible "Owner not recorded" label. Never apply the player's stable crest merely because a horse is on a managed roster.
- Owner IDs/names are projected read-only from the existing Office horse records and `horseState` (original source bridge). Where available, approved crests are read from `organization-logo-index.json` using owner keys. A known owner without approved imagery uses initials in the same shield; future official crest assets replace that fallback automatically.
- Global Search uses one compact **OOTP-style roster table**, not large two-column tiles. Type / Name / Role or Detail / Owner / Open are aligned fields with category filters, sortable Name/Type/Owner columns and viewport-sized pagination. Live typing updates only results, preserving focus. A page's navigation target is an existing source route; do not index imaginary game entities.
- An Overview does not need extra cards merely to occupy every pixel; allow meaningful visual hierarchy, but do not squander desktop space on redundant page headings or 50px-high list rows.
- **People Profile V2 delivered:** The primary Overview displays professional attributes, reputation/standing, connected horses (with source-backed owner badges and current statuses), a career snapshot and observed working relationships together in one desktop viewport. A person can make sense of the whole profile without navigating multiple tabs. Deep tabs remain for lengthy evidence/history only; empty source fields stay honest and compact.
- **Screen-level navigation:** Entity profiles and Search use their own navigation context. Do not display a duplicate or unrelated secondary department tab bar above these screens; preserve the space for real information.
- **Search reliability:** The global search icon must open the roster without exceptions at 700/768/900/1080px desktop heights. Keep the runtime pagination render test, not just a syntax assertion; a syntactically valid double-call to a number must never regress.
- **Next Tier 1 checkpoint:** After People visual approval, adopt the same information-dense, source-linked layout for Farms and Tracks, with no changes to gameplay or canonical data.

## Tier 1 signoff before moving into detail views
- Inspect Horse, People, Farm, Track and Organization Overview directly in an authenticated desktop browser.
- Verify compact role/location header and 3-column content at common desktop viewport sizes.
- Verify buttons: Person full Attributes/Reputation, Farm connected horses/operations, Track major races/meet, Organization named horses/cases/commitments.
- Confirm that no primary Overview needs to scroll, cut off useful text, or leave a large dead panel.
- Any genuine missing source data should show an honest empty state rather than fake numbers.

**Next authorized UI-only batch: Tier 2 detail pages, beginning with the Horse detail tabs; do not change underlying career facts, database links or logic.**
