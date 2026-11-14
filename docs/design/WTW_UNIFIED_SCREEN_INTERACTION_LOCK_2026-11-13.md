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
- Shared connected-record controls: **one** `connectedTableState()` + **one** `profileRecordSection()`; no custom table for each track/owner/trainer.
- Entity palette companion: `public/next/identity-themes.mjs`; unique colors are an identity layer, not an alternate UX.
- **One canonical management stylesheet:** `public/next/next.css` now contains all active shared layout, career dialog, entity themes and profile hero rules in the same tested cascade order. The prior three CSS companion files were physically retired. **Do not re-add them or create page-specific stylesheets.** Change shared rules in `next.css` and keep one profile/table/nav interaction system across all relevant pages.
- Existing original assets and canonical data stay in their current authority; UI changes may read but not mutate them.

## Old layout retirement — permanent authority
- [Legacy Layout Retirement Register](WTW_LEGACY_LAYOUT_RETIREMENT_2026-11-13.md) identifies the physically deleted Manager V2 and obsolete Office pager files, and the only unavoidable **hidden gameplay/data compatibility adapter**.
- Never revive `public/manager/manager.js`, `manager.css`, `office-v30-2.js`, `office-v30-3.js`, or the retired screenshot/test suite. `/manager/` must remain a redirect to the current `/next/?world=1999` game.
- `public/next/index.html` must contain one visible manager `#wtwNextgen`; retained old Office source nodes are permanently hidden and **never** valid screen templates. Any move off that compatibility bridge must replace its game actions with a tested headless API before deleting its supporting DOM.
- `tests/no-legacy-screen-regression.test.mjs` is a required non-regression gate alongside this unified interaction lock. No previously retired screen may reappear after an unrelated UI change.

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
