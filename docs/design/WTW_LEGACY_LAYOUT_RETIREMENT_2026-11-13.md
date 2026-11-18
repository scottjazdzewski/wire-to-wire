# WTW — LEGACY LAYOUT RETIREMENT REGISTER
**Date:** 2026-11-13
**Authority:** [Unified Screen Interaction Lock](WTW_UNIFIED_SCREEN_INTERACTION_LOCK_2026-11-13.md)
**Status:** Removing obsolete presentational runtimes; compatibility bridge still has known dependencies and must never be a selectable screen.

## One live playable interface
- `/next/?world=1999`: only approved playable management UI, mounted at `#wtwNextgen`. Department rail, identity/profile layout, local controls and record tables are shared.
- `/`: canonical redirect to the same /next/ game. No alternate homepage.
- `/manager/`: canonical redirect to /next/?world=1999. **There is no second Management Studio.**
- `/archive/`: separate historical records tool, not an alternate playable Office. Preserve its historical features; move towards common game visual standards without destroying history.

## Physically removed from production
- `public/manager/manager.js` — abandoned second full management renderer.
- `public/manager/manager.css` — abandoned parallel screen design.
- `scripts/manager-v2-visual-audit.sh` and its GitHub Actions step — tests for the retired alternative interface.
- `public/office-v30-2.js` — adds outdated pagers/arrows to the Office.
- `public/office-v30-3.js` — immediately undoes/changes those outdated pagers.
- Twelve excluded, superseded tests specifically bound to obsolete prior layout contracts, removed from `tests/`. All **remaining** tests are now run, with no exclusion set.

All removed content is recoverable from Git history if a **gameplay dependency** is discovered; an old layout must never be restored as the fix.

### Standalone 2014/Office prototype presentation removed
- `public/office/office-core.js`, `office-nav.js`, `office-pager.js`, `office-routes.js`, `office.css` were a separate old screen family. The live `/next/` page, current `office-v30-4.js` engine and 1999 adapters do not import or load these files. They are physically deleted, not dormant.
- The old screen family is preserved only in Git history; do not re-add any `/office/office-*` script or CSS link to playable pages.


## Quarantined compatibility adapter — **not another screen**
The original `public/next/index.html` still contains the older Office `.app`, `#routeShell`, `#routeBody`, source controls and route detail markup because current `public/next/next.js` still:
- Reads original Office decisions, messages, fixture/horse source rows and profile fields.
- Calls original `data-act` controls for Save, Load, Continue and other canonical game actions.
- Tracks the original Office route state to display one profile in the new manager screen.

The bridge is explicitly marked `data-wtw-layout="legacy-data-bridge"`, `aria-hidden="true"`; the `.app` is natively `hidden`; `#routeShell` starts hidden; and `next.css` contains a scoped unconditional `display:none!important` guard for all old Office overlay roots. **No old screen is permitted to display**.

Remaining adapter-dependent scripts include `office-v30-1.js`, `office-v30-4.js` and the ordered `office-fm-v32.js` through `office-fm-v37.js` compatibility chain. Some mutate hidden Office nodes or provide status data read by the current UI. These remain until the current renderer reads an explicit headless adapter instead. They are **not visual authorities** and must not be used as templates or resurrected into view.

## What completing full removal requires
1. Create a single **headless Office adapter** exposing canonical state, decisions, messages, fixtures and source route data without old HTML panels.
2. Replace `originalAct()`, `bridgeNode()`, `currentRoute()` and the remaining DOM selectors inside `next.js` with direct, tested adapter calls.
3. Prove Save/Load/Continue, history and decisions, profile linking, entries/fixtures, source record fields and back/forward remain equivalent.
4. Remove the original `.app`, route shell, legacy Office renderer scripts and compatibility chain in the **same gated change**, never one piece at a time with broken functionality.
5. Verify real desktop screenshots and interactions at 1536×864, 1366×768 and 1280×800; human reviewer must approve the same FM/OOTP standard across every page.

**Do not** interpret the existence of this bridge as approval to display or rebuild the old Office. If a compatibility refactor fails, **keep the old bridge hidden and fix the adapter**, not reenable the old UI.

## Permanent release checks
- `tests/no-legacy-screen-regression.test.mjs`: confirms no retired Manager V2 files, alternate entrypoint or obsolete Office pager scripts; checks the old bridge is hidden and required game actions remain connected.
- `tests/ui-uniformity-lock.test.mjs`: prevents competing live renderers, extra CSS layers and non-uniform navigation.
- `scripts/desktop-visual-audit.sh`: captures the single current Office and actual profile/department screens; there is no alternate Manager V2 screenshot workflow.


### Retired unused legacy Office CSS generations — 2026-11-13
The only current playable management stylesheet is **`public/next/next.css`**. All former career, entity-identity, and profile-hero declarations have been folded into it in the original cascade order; their three separate CSS files are deleted. The History Vault uses its separate `public/style.css`.

These **nine entirely unreferenced historical theme files were physically removed** from production:
- `public/office-compact-v31.css`
- `public/office-fm-v32.css`
- `public/office-fm-v33.css`
- `public/office-fm-v34.css`
- `public/office-fm-v35.css`
- `public/office-fm-v36.css`
- `public/office-fm-v37.css`
- `public/office-v30.css`
- `public/office-visual-system-v38.css`

**Retired visual CSS is not a fallback.** Do not add a reference to these files when a current page looks wrong: fix the shared, approved stylesheet. `tests/no-legacy-screen-regression.test.mjs` enforces their absence. The older `office-fm-v32.js` to `v37.js` scripts are a **separate, still-active hidden source/data compatibility chain** and are not deleted by this CSS-only change.


## Headless Office bridge extraction — Phase 1 (2026-11-14)

**Migrated read operations (no UI or game data changes):**
- Game date on the live 1999 management UI is read first from the active gameplay service clock, then from the saved founding career state. A hidden `.dateChip` is no longer consulted in supported founding mode.
- The Office inbox uses the canonical `__WTW_1999_UI_DATA__.officeMessages` array. During data-module loading, it shows an empty inbox instead of resurrecting obsolete demo messages from `.left .msg`.
- Both now go through the small DOM-free `public/next/office-direct-read.js` adapter. The adapter is read-only, has no CSS/HTML/screens, doesn't write game state, and is loaded before the current renderer.
- `tests/office-direct-read-adapter.test.mjs` verifies source priority, game-date validation, loading behavior, and that the adapter cannot access the DOM.

**Still requiring headless migration:** action dispatch (Continue, Save, Load), native route and record projection, certain hidden Office state and fixtures, and compatibility status/calculation scripts. These remain permanently hidden until direct feature-parity tests prove a replacement. **Do not remove those live dependencies prematurely or reenable the old UI.**


## Direct game-command bridge — Phase 2 (2026-11-14)

**Migrated active operations:**
- The single `/next/` management game now sends **Save Current Game** and **Continue / Advance One Day** through one DOM-free `public/next/office-direct-command.js` command interface. Neither requires clicking the hidden Office `Save` button.
- The existing canonical Office controller exports `window.__WTW_1999_MANAGEMENT__.saveCurrentCareer()`, invoking exactly the current `saveState()` logic. This deliberately preserves native save format, game chronology and the training-state merge while removing the hidden clickable control.
- Continue calls the existing `advanceOneDay()` authority through the same headless command surface. In the 38-horse engine pilot the dynamic hook still resolves to the IndexedDB-backed `ADVANCE_DAY` game command. The bridge coalesces concurrent pending asynchronous advances, rather than queuing duplicate days from repeated clicks.
- **No fake pilot named saves.** When the IndexedDB pilot engine is active, legacy localStorage named-save capture is rejected with an explicit explanation. Pilot gameplay remains auto-saved by its own durable game engine; proper pilot named import/export must use that engine's schema in a later gated phase.
- The current layout is unchanged: same top Continue and Save/Load dialog, same placement/keyboard behavior, one FM/OOTP-style management interface. No second UI, game ledger, save namespace or alternate decision engine is introduced.

**Next replacement targets:** direct load/import using native save-validation contracts; case/decision action routing through the same command interface; profile/fixture read projections without hidden Office DOM. The legacy controller and hidden Office markup stay quarantined until these are verified against save, decision and navigation behavior.

**Regression gate:** `tests/office-direct-command-bridge.test.mjs` asserts the Save and Continue paths use direct methods, validates asynchronous command coalescing and fail-closed behavior, and checks that no hidden UI controls are accessed by the adapter.

## Direct career restore and engine decisions

- The compact career manager and existing named slots use `SAVE_CURRENT` and `LOAD_CAREER`. Founding loads validate the source world, seed and actual calendar date before replacing the active save, then restore through normal startup. The compact dialog imports both .wtwsave and founding JSON snapshots into slots. It restores a slot only when the player selects Load.
- The 38-horse playtest uses its own IndexedDB run. Continue and decision answers use that run's command service. Inbox choices carry the engine's decision and option IDs, and the desk displays the persisted receipt. Opening-world advisory cards are still department links. The pilot no longer mirrors its clock into the founding save.
- The hidden file input, matching Load button and FileReader handler are gone. The visible date, inbox and choice controls have no Office selectors. Profile and other source routes still depend on the quarantined route shell and compatibility scripts.

## Direct Office/department navigation — Phase 3 (2026-11-14)

The `goOffice()` player control no longer clicks an invisible Office Overview button in the founding 1999 career. `__WTW_OFFICE_COMMANDS__.dispatch('RETURN_OFFICE')` delegates to the existing native Office `loadCase(currentCase,true)` route closer, maintaining the established case and browser-route lifecycle without an alternate UI. Non-founding compatibility remains explicitly gated.

`openMenu()` now uses **one direct `openCustomView(section+' — Overview')` navigation path** for Stable and every department registered in `DEP_NAMES` (Racing, Sales, Breeding, Personnel, Facilities, Finances and Tracks). These pages already share the canonical roster renderer. World source/profile routes and legacy-backed special views are deliberately not force-migrated until equivalent native record projection exists. No gameplay data, saves or identities are changed.

`tests/fm-direct-office-navigation.test.mjs` requires the direct Office command, single source-backed department navigation, and rejects missing native services. These changes do **not** authorize deleting the hidden profile source DOM yet.


## World & News Hidden Route Retirement (2026-11-14)

The playable founding career no longer navigates through `originalAct('World')` or `originalAct('News')`. The former hidden Office World directory contained six hard-coded demo horses and older connections, and the former News screen contained two prototype reports. They are retained only as inaccessible compatibility source code until other remaining bridge functions can be safely removed. **They must never become a playable fallback.**

The active World Overview and News views now use the shared FM/OOTP management component family and source-backed 1999 registry, race, people and Office message records. No new racing result, publication, farm, owner, name, horse or date is invented. World source records remain linkable through the full directory views, while World Overview is deliberately bounded for a dense one-screen experience.

Next extraction target: source-only profile and Office action routing. Do not alter this workstream's shared profile structures while another profile-navigation PR is active.



## Direct 1999 Opportunity Board — 2026-11-14

The visible organization and Office `OPPORTUNITIES` commands now open `openCustomView('Opportunities','Office','Overview')` directly. They never click the retired `Open opportunity board` control in the hidden Office. The old prototype had hard-coded offers and unrelated 2014 demo content.

The approved screen now uses `ng-manager-screen` with the same global manager rail, record-view dropdown, metrics, dense record rows, sidebar and keyboard-operated game controls as World and News. Its primary records are **only** open, urgent source-backed Office messages and actual due follow-ups from the career. Racing and Sales links go through the normal direct department routes. A genuine empty queue remains empty; no races, offers or settlements are fabricated.

`tests/fm-source-opportunity-board.test.mjs` and desktop/laptop screenshots are release gates. The 1999 engine's race-entry opportunities continue to be authorized in the existing Racing desk; this UI work neither duplicates nor changes racing calculations, save state or ownership decisions. This is a presentation-layer retirement, not deletion of the still-required hidden gameplay adapter.
