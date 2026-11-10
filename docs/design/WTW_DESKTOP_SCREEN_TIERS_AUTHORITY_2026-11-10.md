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

## Tier 1 signoff before moving into detail views
- Inspect Horse, People, Farm, Track and Organization Overview directly in an authenticated desktop browser.
- Verify compact role/location header and 3-column content at common desktop viewport sizes.
- Verify buttons: Person full Attributes/Reputation, Farm connected horses/operations, Track major races/meet, Organization named horses/cases/commitments.
- Confirm that no primary Overview needs to scroll, cut off useful text, or leave a large dead panel.
- Any genuine missing source data should show an honest empty state rather than fake numbers.

**Next authorized UI-only batch: Tier 2 detail pages, beginning with the Horse detail tabs; do not change underlying career facts, database links or logic.**
