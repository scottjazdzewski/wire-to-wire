# WIRE TO WIRE — LIVE DEPENDENCY & RETIRED CODE LEDGER
Created 2026-11-14. Applies to all engineering workstreams and commercial releases.

## Universal rule
When a new implementation replaces an old one, **physically remove the old one in the same verified PR**. Do not simply hide pages, keep dead CSS, introduce another renderer, preserve unsupported fallbacks, or let stale documentation invite resurrection. Confirm consumers, visual parity, command authority, browser persistence and customer save compatibility **before** deleting live dependencies.

## Verified physically retired (must stay absent)

| Deleted code or presentation | Single surviving authority | Guard |
|---|---|---|
| `public/manager/manager.js`, `public/manager/manager.css`, Manager V2 scripts/styles | `public/next/next.js`, `public/next/next.css` | `tests/no-legacy-screen-regression.test.mjs` |
| `public/office-v30-2.js`, `public/office-v30-3.js`; retired Office pager/styles | one playable `/next/` UI | `tests/no-legacy-screen-regression.test.mjs` |
| `pilotHorseConnectionsPanel()`, `pilotHorseLinksFor()`, `profileRecordSection()`, `connectedTableState()`; `ng-connected-*` retired overlays | one approved `profileDetail()`, `restored1999Profile()` with standard record selector and links | `tests/1999-no-legacy-pilot-profile-overlay.test.mjs` |
| `menuIcon()`, `depCurrentMeetRows()`, `depTrackRaceRows()`; dead demo race generators | live source-backed 1999 data and shared calendar | `tests/1999-ui-live-surface-prune.test.mjs` |
| Unreferenced `officeMenu` legacy Office action mapping in current JS (this milestone) | shared `tabmap`, `managementViewOptions()`, `pageTab()`, `openMenu()` | `tests/product-legacy-code-retirement.test.mjs` |

The old `RECORD VIEW` wording and the instruction to reconstruct `connectedTableState()` have also been removed from the **governing** unified UI standard. The actual surviving dropdown is named `VIEW`; profile deeper navigation remains `MORE RECORDS`.

## Live transitional dependencies: NOT SAFE TO DELETE YET

The hidden Office markup in `public/next/index.html` and the mounted `office-v30-1.js`, `office-v30-4.js`, `office-fm-v32.js`, `office-fm-v34.js`, `office-fm-v35.js`, `office-fm-v36.js` and `office-fm-v37.js` are still loaded by the one real game. They supply source/game compatibility until native commands and read adapters have **verified equivalent coverage**. The dormant page is not authorized to become a second UI.

| Outstanding retirement work | Needed first | Current safety |
|---|---|---|
| Hidden Office DOM compatibility structure | Inventory every selector used by active scripts; replace with tested headless game/read APIs; verify all decision cases, routing, saves and game clock in Chromium | Hidden, but preserved for now |
| `office-v30-1.js`, `office-v30-4.js` | Proven parity for save, restore, current date, decision handling, source record mapping | Do not remove while live |
| `office-fm-v32.js`, `office-fm-v34.js` to `v37.js` | Replace actual source record/route projections without losing horse/person/track/farm data or player actions | Do not remove while live |
| Archive/History presentation differences | Migrate to one verified management screen vocabulary while preserving canonical historical data and era navigation | Do not delete historical records to make UI consistent |
| Other prior-version code in gameplay/source engines | Dependency/consumer graph, save schema compatibility, relevant browser plus unit parity tests, reviewed source identity effects | Age/version strings alone do not prove dead code |

**No blanket deletion of old save migration support.** Existing customer careers and world authority are more important than raw source-file count.

## Mandatory evidence in each future retirement PR
- Old path/symbol and why it is superseded.
- New single authority and all former entrypoints.
- Search results for import/script/dynamic loads, command dispatch, save schemas and any required test/QA clients.
- Exact removed code/files and changed authoritative design documents.
- Regression test proving absence and tested parity across relevant screen families.
- Latest main SHA, successful full CI and Chromium visual/screenshots; merge SHA and explicit approval.

`tests/product-legacy-code-retirement.test.mjs` enforces the retired-system denylist. The existing cross-screen tests and product-wide workflow enforce the still-active game. A clean software repository is a **rolling requirement on every feature**, not a dangerous one-time delete-all operation.
