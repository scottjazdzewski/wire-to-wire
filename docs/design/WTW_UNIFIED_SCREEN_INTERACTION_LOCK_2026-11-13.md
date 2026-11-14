# WIRE TO WIRE — UNIFIED SCREEN INTERACTION & VISUAL RELEASE LOCK
**Locked user direction:** 2026-11-13  
**Scope:** playable /next/ 1999 management UI and, by family equivalence, Archive/History.  
**Status:** governing product acceptance rule; NOT a claim of commercial visual approval.  
**Supersedes:** any window-specific recommendation, temporary theme pilot or per-screen workaround that conflicts with consistent interaction.

## Product rule
**One recognizable management game, not individually invented pages.** A user who learns to open an entity, inspect its record, change its local view and return to a roster must already know how to do the same thing for every comparable entity.

Football Manager and Out of the Park Baseball are the reference **level of quality**, not sources for copyrighted assets or a license to reproduce their exact UI. Reject designs that look like generic websites, giant marketing cards, patchwork forms or one-off demos. Do not claim a page finished merely because code deploys or screenshot smoke tests pass.

## Approved interface vocabulary — do not drift
| Pattern | One consistent behavior | Permitted content-specific variation |
| --- | --- | --- |
| Global chrome | One common game top bar: time/date, Save/Load, Continue/status, global search and actions | Context text and actual game state |
| Primary navigation | Persistent left department rail, same order, icon placement, active/hover/focus feedback | Selected department only |
| Department routing | Existing VIEW / dropdown controls access department screens; no redundant horizontal global menu | Domain-relevant choices inside same control pattern |
| Entity profile | Identity badge at left, type + name + sourced metadata at center, hero mark/portrait at right, tools in their consistent area | Track surfaces/meet, horse age/sex/owner, person role, farm/owner operations |
| Profile records | Same Overview/History/MORE RECORDS or matching local records controls, same placement and interaction. Every section uses the shared profile record renderer | The labels and available, source-backed record sets |
| Directories | Same action/search/filter row, sortable headers, compact/expanded control, row opening behavior, empty states | Horse/person/track/farm-specific columns and valid filters |
| Record relationships | Names open their canonical linked entities through existing routes; back/forward returns to the prior context | Which linked entities exist |
| Tables & data | Shared column rhythm, heading height, alignment, semantic statuses, keyboard focus, row density, and scrolling | Meaningful domain data |
| Responsive fallback | Reflow content; keep controls and full names/important facts visible; no accidental overflow or fixed-height clipping | Different number of facts and records |
| Branding | Color and hero artwork may change **by immutable entity ID**, preserving contrast and status semantics | Genuine crest/logo, location-specific imagery, subdued entity colors |

**Distinguish consistent operation from identical content.** A race-entry workbench and an owner history do not have to use the same inner columns, but **their shell, control semantics, navigation, alignment and states** are shared. Domain-specific widgets are justified only by a genuine task and are documented as a reusable family, not custom screen decoration.

## Redesign and regressions: automatic rejection reasons
- Another set of tabs, a new top menu, a different back behavior, a second drawer/sidebar, or a local navigation vocabulary that conflicts with an existing one.
- A page loses data because a logo/photo is inserted, truncates a full track name, hides controls at narrower width or uses tiny text as a substitute for layout.
- A large empty card/filler panel, decorative meter or redundant summary that reduces usable roster/decision space.
- Different search, sorting, filtering, tab placement, icon behavior or link semantics for the same profile/roster family.
- Brand-color overrides that camouflage disabled, warning, health, legal/eligibility or Continue states.
- Rebuilding a shared renderer in parallel, reintroducing retired prototypes, or restoring earlier layout via trailing CSS patches.
- Hardcoding numbers, statuses, images, race entries, ownership, employee assignments or locations instead of displaying canonically sourced state.
- Showing a finished or approved badge merely because tests pass; only reviewed rendered screenshots and functioning interactions can support visual acceptance.

## Code ownership (current transitional architecture)
- Playable management shell: `public/next/next.js` and `public/next/next.css`.
- Shared profile composition: **one** `profileDetail()` renderer, `restored1999Profile()` adapter; profile visual companion is `public/next/profile-hero-v2.mjs`. No per-entity renderer forks.
- Shared profile and record controls: one current `profileDetail()` / `restored1999Profile()` family, with the approved per-entity record navigation. The old `connectedTableState()`, `profileRecordSection()` and `ng-connected-*` overlays were **physically retired** in PR #145; they must not be restored or used as an implementation template.
- Entity palette companion: `public/next/identity-themes.mjs`; unique colors are an identity layer, not an alternate UX.
- **One canonical management stylesheet:** `public/next/next.css` now contains all active shared layout, career dialog, entity themes and profile hero rules in the same tested cascade order. The prior three CSS companion files were physically retired. **Do not re-add them or create page-specific stylesheets.** Change shared rules in `next.css` and keep one profile/table/nav interaction system across all relevant pages.
- Existing original assets and canonical data stay in their current authority; UI changes may read but not mutate them.

## Old layout retirement — permanent authority
- [Legacy Layout Retirement Register](WTW_LEGACY_LAYOUT_RETIREMENT_2026-11-13.md) identifies the physically deleted Manager V2 and obsolete Office pager files, and the only unavoidable **hidden gameplay/data compatibility adapter**.
- Never revive `public/manager/manager.js`, `manager.css`, `office-v30-2.js`, `office-v30-3.js`, or the retired screenshot/test suite. `/manager/` must remain a redirect to the current `/next/?world=1999` game.
- `public/next/index.html` must contain one visible manager `#wtwNextgen`; retained old Office source nodes are permanently hidden and **never** valid screen templates. Any move off that compatibility bridge must replace its game actions with a tested headless API before deleting its supporting DOM.
- `tests/no-legacy-screen-regression.test.mjs` is a required non-regression gate alongside this unified interaction lock. No previously retired screen may reappear after an unrelated UI change.

## Initial cross-screen interaction parity — 2026-11-14

The Racing Office, Horse Profile and Stable screen family comparison has established a single operating rule for compact roster density and profile tabs:

- **Stable horse roster**, **World horse directory** and **Racing/department roster** call the same `rosterDensityControls()` renderer; ALL COLUMNS and QUICK VIEW retain the same order, keyboard activation, visible selected style and `aria-pressed` state.
- Stable and Racing rosters are both explicitly named, keyboard-focusable scroll regions.
- Horse, Person, Track and Farm dossiers expose the actual active record view in the dossier bar, and Overview/History announce active navigation with `aria-current`. A History page must not still claim to be an overview.
- One focus-visible treatment applies to roster and dossier controls inside the existing unified stylesheet. No new stylesheet, navigation system or per-screen override is permitted.
- `tests/ui-fm-ootp-screen-family-controls.test.mjs` prevents these equivalent screen families from forking again. This is **structural/operational parity**, not visual signoff; screenshots and FM/OOTP quality review remain mandatory.

## Required QA matrix before any screen is promoted
1. Compare actual rendered screens side by side for **Horse / Person / Track / Farm / Owner** profiles and at least two directories; verify shared top context, control locations, row density, hover/focus, and back/forward behavior.
2. Check 1536×864, **1366×768**, 1280×800, and small/narrow viewports where supported. Long names, wordmarks, toolbars, sourced facts and tables must remain usable.
3. Inspect empty, normal, long-name/many-record and no-logo states without invented records. Confirm new transparent artwork does not change the identity grid.
4. Exercise: department rail → directory → profile → related entity → back; local Overview → History → MORE RECORDS; table search/filter/sort/open; save/load and Continue.
5. Run feature tests and visual audit. Report unrelated failures distinctly (e.g., active work on the 1999 track registry); do not silently change history or game logic in a UI review.
6. A **person** compares screenshots to FM/OOTP-derived quality criteria. If obviously weaker, mark **REJECTED**, give a specific fix and iterate. CI pass, public deployment and artwork completeness are not visual signoff.

## Deferred or independently owned work
- New track and organization transparent logos belong to the separate logo generator. Keep automatic exact-ID activation.
- Subtle location-specific hero photographs belong to the art window. Same shared placement rules, not a new page template.
- **#6 deeper entity-specific color coverage** remains deferred until the hero imagery/logo system is stable; identity colors must never alter interaction patterns.
- Track eligibility and historical/world registry reconciliation belongs to the history/world windows while the user is adding/removing tracks.

## Change protocol for every WTW UI window
1. Identify the **screen family and existing reusable component**.
2. Write the behavior invariant (where the control lives, what it does, how to navigate back, empty state and keyboard equivalent).
3. Change the **shared renderer/style** where possible. No visually independent screen fork.
4. Add/update a regression test that compares at least two affected entity/route types.
5. Run tests and screenshot comparison; reject UI drift even if the build is technically successful.
6. Merge only verified changes. Do not describe a screen as **finished** until screenshots and interaction have been reviewed.

This document formalizes the user's product direction and complements the existing `WTW_FM_OOTP_CANONICAL_DESKTOP_STYLE_2026-11-10.md`, `WTW_DESKTOP_SUBPAGE_DESIGN_SYSTEM_2026-11-10.md` and `MANAGEMENT_STUDIO_VISUAL_RELEASE_GATE.md`. Where older phase notes conflict, choose the **shared-function, no-UI-drift** rule above rather than resurrecting a previous iteration.

## Direct FM/OOTP navigation parity — 2026-11-14

Office Home uses the native `RETURN_OFFICE` game command in the 1999 career instead of an invisible click. All first-class data-roster departments and Stable use the same `openCustomView(section+' — Overview')` route and shared view-state grammar. Navigation stays inside `#wtwNextgen`, with one browser-history system; no competing Office screen is revived. Special historical and person/horse profile routes retain source-compatible adapters until they pass equivalent direct-projection tests. `tests/fm-direct-office-navigation.test.mjs` is a permanent regression gate.


## World & News — One Manager Screen Family (2026-11-14)

The World entry and its Overview/Major Races/News views now navigate directly through `openCustomView()`; the Office News view does the same. All use the current `#wtwNextgen` header, history and shared VIEW selector. No old World/News Office buttons are clicked.

World Overview shows a capped, balanced preview (up to 20 each of canonical horse, person, farm, track and race records), **without truncating or changing the underlying source directories**. Its count identifies displayed records versus linked records. Dedicated directory screens remain available through the same VIEW menu.

The News screen uses `ng-manager-screen`, existing manager classes, and only messages in the current game source or engine. It calls these **Office briefings** and never claims they are external published reports. An explicit 'verified external feed not connected' status remains visible; the old 2014 demo articles never appear as active 1999 news. News and World navigation use the uniform `Section — Page` URL format so browser Back/Forward restores the right screen.

`tests/world-news-direct-screen-family.test.mjs` locks this behavior. The desktop audit captures actual World Overview, World News and Office News, including laptop News geometry. This is an operational/structural gate; continue visual editorial QA against FM/OOTP references.



## Direct 1999 Opportunity Board — 2026-11-14

The visible organization and Office `OPPORTUNITIES` commands now open `openCustomView('Opportunities','Office','Overview')` directly. They never click the retired `Open opportunity board` control in the hidden Office. The old prototype had hard-coded offers and unrelated 2014 demo content.

The approved screen now uses `ng-manager-screen` with the same global manager rail, VIEW dropdown, metrics, dense record rows, sidebar and keyboard-operated game controls as World and News. Its primary records are **only** open, urgent source-backed Office messages and actual due follow-ups from the career. Racing and Sales links go through the normal direct department routes. A genuine empty queue remains empty; no races, offers or settlements are fabricated.

`tests/fm-source-opportunity-board.test.mjs` and desktop/laptop screenshots are release gates. The 1999 engine's race-entry opportunities continue to be authorized in the existing Racing desk; this UI work neither duplicates nor changes racing calculations, save state or ownership decisions. This is a presentation-layer retirement, not deletion of the still-required hidden gameplay adapter.

## Mandatory data-dense controls — November 14, 2026

User-locked nonnegotiable direction for **every current and future applicable screen**: information-dense, visually rich, operationally alive, with **working dropdown menus, independently scrollable information, and meaningful sortable tables**. This is not merely an Office/Track preference. The same interactions apply to Horse, Stable, Jockey, Trainer, Owner, Farm, Track, Racing, Breeding, Sales, Finance, World, History and any new management screen.

- Use a compact shared `VIEW` or `RECORD VIEW` dropdown for changing between records/pages and appropriate dropdowns for filtering and available columns. Select controls must work, remain keyboard-accessible and preserve actual state. The crucial overview stays visible.
- Use bounded, keyboard-focusable scroll areas for long rosters, result lists, calendars, stakes, finances and histories. Do not clip records, shrink typography to unreadable sizes or force entire dashboards to scroll for one long table.
- Tables support real, visible ascending/descending header sorting: numerically sort values and purses as numbers, dates chronologically, and names alphabetically. Search/filter and column presentation modes stay consistent in corresponding screen families. Sorting must not mutate source/career state.
- Prioritize full first-screen information, sourced dynamic status and activity, purposeful color/depth, authentic artwork and minimal dead space. Do not fabricate activity to fill empty states.
- Existing approved visual composition and prior locked Track/Stable/World controls may **not** be overwritten to satisfy these rules. If a comparable screen lacks one, extend the existing shared renderer rather than introduce another page architecture.

Acceptance combines structural tests, real Chromium interaction/scroll probes, actual rendered screen review and product-wide release certification. The permanent structural guard is `tests/ui-core-information-controls-contract.test.mjs`. User's visual standard is FM/OOTP-quality density and feeling, not a claim to replicate their copyrighted layouts.



## Locked local previous/next dossier controls — November 14, 2026

**All horse, person, owner, farm/facility and track information profiles must show compact local Previous ‹ and Next › controls immediately beside OVERVIEW**, followed by HISTORY and MORE RECORDS. These controls were missing from the previously approved shared dossier navigation, as observed on the Alderwick International Stud facility profile.

- This is **in-profile information navigation**, not a duplicate of the global browser Back/Forward buttons at the upper left. The arrows cycle through the one existing canonical section list: Overview, the displayed More Records entries in their original order, then History, wrapping at either end. Every click changes the actual content panel, not just the highlighted arrow.
- Never build a second navigation list, alternate screen, special-case facility pager or standalone CSS layer. Use the one `profileDetail()` shared dossier bar, `APP.detailTab` and the existing `profile-record` options. All profile types must behave consistently.
- Arrows remain visible, compact, keyboard-accessible, labeled and focus-highlighted at desktop and laptop sizes. Neither page movement nor the existing Overview/History/More Records buttons advance the game date, change record identities, alter asset artwork or mutate saved careers.
- Source-backed browser certification is required on all five families (track, horse, person, owner, facility), including forward, backward, wrap, stable identity, January 1999 game date and the locked Track Stakes / Meet / History arrangement.
- Permanent regression guards: `tests/dossier-local-navigation.test.mjs` and `scripts/1999-full-screen-controls-cdp.mjs`. A missing local pager is a regression even if global browser navigation still works.

**Year in Review future visual direction:** the user approved the premium annual style for now and wants a vintage newspaper/editorial character when returning later. Do not begin another annual redesign while restoring the shared profile navigation.

