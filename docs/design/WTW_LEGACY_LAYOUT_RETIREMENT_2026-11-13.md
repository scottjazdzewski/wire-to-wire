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
