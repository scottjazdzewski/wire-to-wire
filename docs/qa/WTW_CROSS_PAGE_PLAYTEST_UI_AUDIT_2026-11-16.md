# WIRE TO WIRE — Cross-page playtest UI consistency audit

Date: 2026-11-16  
Base: `main` after PR #260 (`9c6b9189e7c0a09352af56418d64ce9ba85eb300`)  
Scope: One approved desktop management UI; no changes to naming, art, historical records, world generation, horse populations, economics, or live game commands.

## Audit coverage

The canonical menu registry contains **67 pages** in eleven sections. The management browser matrix exercises **61 non-History menu destinations** (History is an independently routed archive). The existing CI audits navigation and selected VIEW state, sorting, source identity, game-clock stability, save persistence, available roster tables and laptop-width shell dimensions. This change extends it with label/dropdown geometry on every displayed management VIEW and full-content-width checks on five routes at 1280px and 1024px.

## Findings and fixes

1. **Stable / World / training and other shared VIEW controls:** The common VIEW helper returned an inline `label` with a block `select`. On screens that did not supply a parent-specific flex rule (including Stable & Horses), the word VIEW stacked above Overview instead of forming a single horizontal control. Use one shared `ng-manager-view-picker` layout for every instance.
2. **Default route container / Due Actions:** The shared route parent still defaulted to a two-column grid and cut some single-screen views into half-width panels. Make the route container a block globally, rather than layering more page-specific exceptions.
3. **Race File, Search and World records:** These modern pages already own their internal presentation and should never inherit a parent two-column split at narrower window sizes. The new global route rule preserves their independent layouts.
4. **Operation overview:** Preserve the full-width correction from PR #260 and add a direct Chromium measurement to prevent regression.
5. **Menu-title capitalization:** Verify all registered menu titles begin with an uppercase letter (first alphabetic character); preserve existing proper names, acronyms, and dates.

No non-source racing results, horses, income, entries, or historical facts were created to disguise empty screens.

## Release gates

- `node --test tests/1999-cross-page-ui-consistency.test.mjs` — menu, VIEW, special-route and CSS budget contract.
- `scripts/1999-full-screen-controls-cdp.mjs` — the 61-page browser navigation/controls suite plus five full-width routes checked at real 1280×800 and 1024×800 Chromium viewports and shared picker geometry at 1280×800.
- Existing repository checks, screenshot/desktop audit, world and persistence checks must pass before merge.
- Single canonical stylesheet remains below its **315,000-byte** budget.
- This scope does **not** certify that every screen contains a populated player stable; that is determined by the selected saved game/operation and belongs to gameplay data integration, not a UI placeholder.
- Packaged EXE verification is distinct from merging source into main.
