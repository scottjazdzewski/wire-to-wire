# WIRE TO WIRE — SCREEN-BY-SCREEN RESTORATION AND UNIFORM OPERATIONS REGISTER
**Baseline:** 2026-11-14, current playable game `/next/?world=1999`. **Never replace with an Office/Manager prototype or an archived Drive HTML file.**

## Meaning of status
- **LOCKED** = verified approved structure/behavior that must not regress; it does **not** certify every fact, pixel or feature.
- **INTEGRATED** = currently shares production UI/menu/roster operating behavior, under regression tests.
- **VERIFY** = screen needs complete live content/visual/browser acceptance; no claim it is release ready.
- **SOURCE GAP** = genuine missing source-backed data/features must remain honest; no invented filler.

## One game operating procedure on every applicable screen
1. Global header/department rail and Save/Load/Continue work without changing the game behind the player's back.
2. Select a department from the one left rail; use the shared **VIEW** dropdown to navigate its available views. On a profile, use Overview / History / **MORE RECORDS** from its permanent local control area.
3. Search/filter the **complete underlying directory** (not a clipped preview), adjust ALL COLUMNS / QUICK VIEW, sort by a meaningful column (repeat for reverse order), then open a record by its source ID.
4. Long lists **independently scroll** inside their own keyboard-focusable region, with visible headings and usable scrollbars. No hidden extra full-screen page or redundant navigation. Keep global rail and primary tools visible where layout permits.
5. Back/Forward returns to the correct former view. Logo, category badge, status, data and profile records remain matched to the same immutable entity ID.
6. Information-rich workspace: surface genuine current activity, schedules, risk, entries, work, costs, history and actionable decisions when available; no filler, sprawling blank cards or flat-looking generic website widgets. Preserve readable typography and selected accents.
7. Saving, exiting and restarting must reopen the same career with unchanged time, horses, people, money, decisions and visuals; malformed saves fail closed.

## Detailed screen register

| Screen / view family | Previously agreed composition / working behavior to preserve | Status, specific acceptance still needed |
|---|---|---|
| Office — Overview, Messages, Decisions, Calendar, News, Reports, Career | Same global date, Save/Continue, source-backed briefing/decision desk, compact VIEW, real linked files and notifications. No 2014 demo feed or hidden Office screens | **INTEGRATED / VERIFY** direct screen-by-screen interactivity, activity and space use; no fake events |
| Stable — Overview, Horses | **Full-height** horse roster, dense clickable columns, ALL COLUMNS/QUICK VIEW, search/filter/sort/scroll, adjacent real calendar, personnel and decisions. Do not revert to giant empty cards or partial roster | **LOCKED structure / VERIFY** long-roster, ownership link, width and dead-space checks |
| Stable — Training, Health, Race Plans, Barns | One stable screen vocabulary; horse-specific care, training policy, welfare, shipping/barn and race actions from the actual career only | **INTEGRATED / VERIFY** each action and list; do not substitute test horse relationships for canonical profiles |
| Racing — Overview, Calendar, Entries, Results, Stakes, Race Planning | Compact date/track controls, complete race-day condition books, actual entry/eligibility/shipping status and money, sortable rows and internal scroll; program browsing never advances the clock | **INTEGRATED / VERIFY** distinct states and race-plan UI; all real entries/settlements are engine-owned |
| Breeding — Overview, Stallions, Broodmares, Foals, Pedigrees, Stud Farms | Same VIEW / sortable roster grammar; direct horse, pedigree and farm dossier links; honest source-backed breeding data | **INTEGRATED / SOURCE GAP / VERIFY** full records and actionable facilities without made-up pregnancies |
| Sales — Overview, Auctions, Sale Calendar, Sale Companies, Catalogs, Watchlist, Private Offers | Same dense table, sale/company/date selectors, sort/filter/scroll, direct lot/horse/company links; genuine auctions and offers only | **INTEGRATED / SOURCE GAP / VERIFY** no fictional price or bid as authentic |
| Personnel — Overview, Trainers, Jockeys, Owners, Principals, Staff | Dense full-height sortable directory and person profile; correct professional source identity and assignments; consistent view selector | **INTEGRATED / VERIFY** human dossier, portraits, geographic base and contract facts |
| Facilities — Overview, Stud Farms, Training Centers, Breaking Facilities, Racing Stables, Farms, Trainer Barns | Preserve user's facility distinctions; sortable searchable lists, full facility/organization profile, valid geographic locations and personnel | **INTEGRATED / SOURCE GAP / VERIFY** only recognized facilities; no phantom training centers |
| Tracks — Overview, Active Meets, All Tracks, Stakes | Complete track registry, meet conditions, historical/operating state, source links; correct logo/palette and sortable/filterable list | **INTEGRATED / VERIFY** track directory behavior and all-source coverage |
| **Track dossier** — Belmont, Aqueduct, Gulfstream and other tracks | **LOCKED stadium layout**: left always-visible full four-column sortable Major Races & Stakes with 16px G1/G2/G3 trophies, right Meet & Conditions over Track History, exact-ID hero mark at right and small category icon at left | **LOCKED**. Preserve `docs/design/WTW_TRACK_PROFILE_PERMANENT_LOCK_2026-11-14.md`, screenshots/geometry, no pilot overlays, no collapsed stakes |
| Horse dossier | Source identity, DOB/age, racing attributes, owner/breeder/trainer, pedigree, career, form, Overview/History/MORE RECORDS, stable World roster links. Consistent 46-rating dossier where source supports it | **INTEGRATED / VERIFY** pedigree, historic vs playable, long-name and missing-photo states |
| Person dossier — trainers, jockeys, owners and others | Same horse-grade detailed profile family, identity with appropriate career/role data, source person ID, linked horses/farms, consistent record navigation | **INTEGRATED / VERIFY** role-specific history and relationships without fictitious contracts |
| Farm / ownership / organization dossiers | Same shared identity grid and profile controls, approved logo in protected right hero slot, operating details and source relationships; no one-off profile implementation | **INTEGRATED / VERIFY** exact logo fit, facility distinctions, links, owner economics |
| Finances — Overview, Cash Flow, Operating Costs, Budgets | Dense verified cash/ledger information, sortable transaction views, readable currency, consistent VIEW; a display-only sort never changes balances | **INTEGRATED / SOURCE GAP / VERIFY** complete actual ledger, cash flow, projections without fake statements |
| World — Overview, 1999 Horses, People, Organizations, Tracks, Meets, Major Races, News | Source-backed world; Overview offers compact balanced preview but **full directories remain in their own scrollable, sortable views**; one VIEW dropdown and no phantom population | **INTEGRATED / VERIFY** complete source coverage and record navigation; no covert demo/game test injection |
| Global Search | Full searchable source-linked directory; name/type/owner ASC/DESC toggles with direction arrows, keyboard-focusable bounded 60-row scrolling, complete-directory pagination, source-ID-safe record opening | **INTEGRATED / VERIFY** live sort, scroll, search/filter, keyboard focus, source identity and visual density at 1536×864/1280×800 |
| History / Archive | One chronological canon and stable immutable identities, era-accurate locations and dates, meaningful race/horse/people/farm/track linking; same recognizable operating patterns | **VERIFY / SOURCE GAP**. Current `/archive/` is an explicit exception to `/next/` routing; do not claim the whole archive has passed shared UI parity |
| Save / Load / Continue | Single game state authority, named career saves, durable process restart, fail-closed errors, no separate demonstration data shown as the customer's saved world | **LOCKED behavior / VERIFY** cross-version migrations, crash safety, extended real session tests |

## Current verified operating milestone — management information panels

The compact source-backed management record surfaces are now the same interactive family: **World Overview**, **Office/World News**, and the **Opportunities action board** use one shared `managerSortRecords()` and `managerSortableColumns()` implementation.

- Four compact column headings (type, name, detail and context) sort read-only record projections in either direction; the active heading exposes its ascending/descending state with accessible controls. The previously approved opening order remains unchanged until a player sorts.
- Source-linked record IDs, source array order, game clock, outcome data and player decisions do not change when table order changes.
- Main information lists and supplemental record regions are focusable independent scrolling areas. Their headings and the original left/right workspace remain visible.
- Real Chromium tests exercise actual sort clicks and source IDs on all three screen families, in addition to the existing 67-view and five-profile operating matrix. Browser evidence is required before changing statuses from VERIFY to release-approved.
- Still outstanding: human review of actual rendered density/atmosphere, full Archive parity, and long-run game-state acceptance. No fabricated messages or race activity may be used to fill empty pages.

## Screen approval checklist (apply to EACH row and each view)
- Correct roster/profile structure; layout matches previously accepted screenshot, no retired components.
- All navigation, dropdown, sorting, filtering, record opening and Back/Forward functions actually work.
- Vertical scroll genuinely exposes all records; header, navigation and key facts remain readable at **1536×864** and **1280×800**, with long text and normal/empty/many-record states.
- Correct entity-specific logo, photo, trophy, badge and theme. Missing art uses honest placeholders; approved images never move their identity slot.
- Money, race outcomes, injuries, historical results and age/foaling data are drawn from their correct authoritative engine/source.
- Real activity rather than decorative filler; essential information prominent, compact, and not flat or bland.
- Actual browser screenshots and interactions reviewed. **Passing code tests alone does not grant visual approval.**

## Engineering work sequence
**Pass 1 (this milestone):** lock every view's approved shape and operating contract; share real VIEW option rendering; add structural tests against the current game without restyling or replacing any approved page.

**Pass 2:** audit and repair individual screen interactions against the register, starting with all department lists, active selectors, scroll behavior, table sort semantics and actual navigation.

**Pass 3:** inspect every screen in real Chromium at desktop/laptop resolutions, compare the actual output to approved references, and only then mark its visual status reviewed. This cannot be inferred from static source, green builds or generated mockups.

**Pass 4:** source-backed activity and density improvements on specific unresolved screens; no invented world events, unnecessary new menus or CSS patch layers.

**Separation:** this register is a coordination and non-regression authority, not permission for the UI window to edit racing/financial/historical engines or override ownership, naming or logo windows.
