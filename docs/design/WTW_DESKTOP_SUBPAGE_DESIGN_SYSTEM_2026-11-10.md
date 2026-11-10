# WIRE TO WIRE — DESKTOP SUBPAGE DESIGN SYSTEM
**Status:** Approved direction from user's OOTP 27 and Football Manager reference screenshots; implementation is phased, beginning with Horse Profile.
**Date:** November 10, 2026
**Authority:** The current deployed Github `main` code, approved WTW UI/brand, existing game state and the authoritative historical/organization databases. This is a **UI contract**, NOT a new database or game simulation.

## What we borrow from the user's visual references
- **OOTP's player and club pages:** compact identity row with real crest/portrait; primary/secondary horizontal tabs; career facts, ratings and history organized as dense but readable data columns; table/list drill-downs.
- **OOTP's organizational/player-development pages:** numerical management information beside an organizational chart or specialized workspace. Only use a positional/spatial visualization where horse racing actually benefits.
- **FM's player profiles:** identity + current condition + granular attributes and connections in one view, with deeper tabs rather than repeated overview cards.
- **FM's squad screens:** dense, sortable, filterable rosters and well-aligned comparable columns, each row opening an entity page.
- **FM's competitions:** compact comparison columns for connected records and documented results; allow year/track/class filters when present.
- **FM's tactical and match screens:** purpose-built action workspaces for actual decisions (race placement, training, breeding, shipping), with analysis and decision consequences adjacent rather than hidden behind unrelated cards.
- **FM's portal:** mixed data views only when each has distinct operational value; no oversized banner, duplicate row or blank filler.

The reference images authorize **layout and interaction patterns**, NOT OOTP/FM artwork, their team colors, real sports data, or fictitious thoroughbred figures.

## WTW identity and desktop layout contract
- Preserve the approved WTW racing logo, established racing badges, dark forest-green/charcoal surfaces, ivory type, subdued gold accents and restrained red for important actions.
- Preserve compact primary navigation with Continue, game date, Save and conditional DUE. Secondary tabs for the current department; **no globally scrolling top bar**.
- Standard compact entity header: one approved 56–72 px shield (or organization logo), name, known state/location/description, authorized actions. An entity photograph is allowed when the approved media pointer exists; never imply a generic photo depicts a named horse/person.
- One shared titlebar, tab strip, data-row family, KPI style, selected/hover/focus state, internal scrolling and empty-state treatment. Do not make a new CSS personality per department.
- Content must earn its space. Use approx 38–44 px table rows, 12–14 px readable body text, tabular right-aligned numbers and compact 30–36 px controls. Fixed 2- or 3-column grids should degrade at narrower **desktop** widths without clipping. Do not cram by shrinking all fonts.
- The first desktop screen at 1366×768 should answer: **Who/what is this? What is its state? What can I do? What evidence supports that?**
- Direct clickthrough from horse→owner/trainer/jockey/farm; race→track/horse/results; organization→horse/people/facilities; history→race edition. Use canonical IDs as soon as exposed; do not invent IDs or copy databases.

## Six reusable screen families
| Family | Applies to | Information order | Interaction contract |
|---|---|---|---|
| 1. Entity Profile | Horse, person, farm, stable/organization, track | compact identity/photo; current facts; career/performance; connections; history | tabs; linked canonical records; honest unknowns |
| 2. Management Directory | Stable Horses, Personnel, Stallions, Broodmares, Farms, Facilities, Sales catalogs | action/search/filter row; compact sortable table; selected-context panel | filters/sorts only real fields; no dead-row buttons |
| 3. Racing Event | Calendar, Entries, individual Race Profiles, Meets, Stakes, Results | event/date/venue identity; status; conditions; entrants; eventual results & history | entered vs targeted vs result strictly distinguished |
| 4. Decision Workbench | Training, Race Planning, Breeding, Scouting/Sales, Shipping | specific question; relevant evidence; available choices; impact/follow-up | no fake choices; connects original decision engine |
| 5. Operating & Finance | Stable organization overview, Cash Flow, Budgets, Operating Costs, Contracts | real balances/obligations; timelines; itemized transaction/detail | cash remains unknown until authoritative dollar state |
| 6. Historical World | Archive, Horses, People, Tracks, historical races/year results | searchable catalog; years/filters; authoritative record; cross-linked entities | separate certified vs provisional evidence; no copy of historical corpus |

## Live route audit — what already exists
- **Working source-linked views in current UI:** Office, current horse and people/farm/track profiles, stable roster/overview, race calendar and Office decisions; historical `/archive/` viewer, organization overview.
- **Needs detail-template upgrades:** Person, Farm, Track, Stable organization, event/race profile, Career Record, Pedigree, Connections and History drill-downs.
- **Several primary department tabs currently route to generic reserved/placeholder views:** Breeding, Personnel, Facilities, Finances and many of their nested pages. These require real source-integrated UI work, not new dummy data.
- **Approved 2014 Office prototype is not the complete 1999 canonical playable universe.** Do not conflate dates or assert production completeness.

## Rollout sequence (one baseline, one template family at a time)
1. **Horse Profile** is the design pilot. Compact identity/header, sourced career snapshot, source-backed connections and achievements, active training/racing context, source-approved portrait when available; source routes continue to power actions.
2. **Other Entity Profiles** inherit the exact header/rows/tabs pattern for trainers/jockeys/owners, farms/organizations, tracks; add only domain-specific sections from actual records.
3. **Directories**: full Stable roster, personnel lists and farm/stallion/broodmare catalogs. Implement shared sorting/filter/table components rather than one-off cards.
4. **Racing**: calendar, meet, race, entries/results and stakes profile drill-down with evidence/time status and travel/geography links.
5. **Decision Workbenches**: horse training, racing campaign planning, breeding, auction, scouting. Domain-specific workspaces may use calendars, pedigree graphs or positional visualizations only when justified.
6. **Finance + Historical World**: operating ledger, cash (when sourced), archive/year views and deep entity links.

## Acceptance gates for each page family
- Screens at **1280×800, 1366×768 and 1440×900**; useful information above fold; no document horizontal scroll or dead space from giant hero cards.
- All visible tabs, row links, search/filter controls and decision buttons are functional; keyboard focus and selected state visible.
- No changing approved gameplay/Save/Load decisions or historical source fields; no second ledger. No placeholder figures represented as real statistics. Unknown fields use a clear dash/unavailable state.
- No conflicting brand/image assets; no generic photograph passed off as a named entity.
- Build and automated tests pass. Live, authenticated pixel signoff is distinct from CI and deployment.

**Desktop scope:** mobile adaptation explicitly deferred.
