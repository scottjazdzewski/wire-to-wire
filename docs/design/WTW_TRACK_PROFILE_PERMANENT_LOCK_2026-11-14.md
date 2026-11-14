# WIRE TO WIRE — PERMANENT TRACK PROFILE PRESENTATION LOCK
Date: November 14, 2026

## Authoritative page

There is ONE supported FM/OOTP-style track dossier. The source of truth is `public/next/next.js` `profileDetail()`, its approved `ng-track-workspace`, and the single stylesheet `public/next/next.css`.

The track overview **must** retain the following independent compartments:

- Left: **MAJOR RACES & STAKES** — full, sortable four-column `ng-stakes-table` with real 1999-stake links and 16px G1/G2/G3 trophy marks. It is an always-visible, internally scrollable list; NEVER replace it with a collapsed `<details>` section.
- Right, upper: **MEET & CONDITIONS** — operating meet, track configurations, conditions, linked context.
- Right, lower: **TRACK HISTORY** — opening date, attendance capacity, source-linked history and full history navigation.
- Above: permanent profile identity hero with track badge on the left, all four track identity facts readable, action buttons and exact-ID genuine venue mark on the right.

The approved track workspace uses `ng-track-workspace` with a left/right grid and `ng-track-info-stack` with meet above history. The same shared shell, navigation, tabs and actions apply to all track and organization dossiers.

## Retired, physically deleted and forbidden

A 38-horse experimental model was mistakenly displayed inside real track, trainer and owner profiles, physically displacing the approved layout. The following **presentation system** has been deleted from the supported UI:

- `pilotHorseConnectionsPanel()`, `profileRecordSection()`, `pilotHorseLinksFor()`, and `connectedTableState()`.
- The `APP.connectedTables` state, all `connected-*` click/scroll/search handlers, and their `ng-connected-*` CSS.
- The tests that *required* this obsolete test-panel interface.

This is NOT a deletion of 1999 gameplay, source racing records, or the isolated `PilotHorse:` testing route. The pilot engine/relationships remain behind their explicit test route, never appended to canonical WorldRecord or FoundingProfile dossiers.

**Do not bring those obsolete controls back as another dropdown, secondary roster or overlay. Never hide them with CSS as a substitute for deletion.**

## Identity rule: logo first, layout unchanged

- Every canonical track's palette is keyed by the immutable `T-####` identity. Venue page accents should follow the real mark; make art-direction color proposals only where source logo color is not certified.
- Belmont Park `T-0002` is explicitly anchored to the dominant green field from the supplied approved logo (`#0C603C`), with off-white rather than unrelated gold as its principal contrast.
- The approved track *category badge* must be the small left icon even before async identity theme loading. The real venue's image is the big mark in the right protected column. No duplicated left/right real logo.
- Horse stats, injury, warning colors, and Continue remain globally semantic. The page template, control locations and column widths must never vary by track.

## Permanent acceptance requirements

1. Run `tests/1999-track-profile-layout-lock.test.mjs`, `tests/1999-no-legacy-pilot-profile-overlay.test.mjs`, the identity theme tests, and full repository CI.
2. The desktop Chromium visual audit captures **Belmont**, Aqueduct and Gulfstream and measures actual stakes rows, the four sortable headers, horizontal two-column geometry, Meet above History, full four-track metadata, large logo and category badge, and zero obsolete panel nodes.
3. Verify both desktop (1536×864) and laptop (1280×800). The browser identity is `data-wtw-identity=T-0002` on Belmont and its active palette base is `#0C603C`; Office remains neutral after navigation.
4. Do not merge a UI-only change if historical data, save or engine checks regress, even when the screenshot passes.

Restoration source provenance: the full sortable stakes renderer was recovered verbatim from commit `f48ffb44e8` (before the generic dropdown regression), except for two unused legacy DOM lookup variables that were removed. Racing, people, breeding, owner and source record logic were not replaced.
