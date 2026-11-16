# WIRE TO WIRE — Cross-page playtest UI consistency audit

Date: 2026-11-16  
Base: `main` after PR #260 (`9c6b9189e7c0a09352af56418d64ce9ba85eb300`)  
Scope: One approved desktop management UI; no changes to naming, art, historical records, world generation, horse populations, economics, or live game commands.

## Audit coverage

The canonical menu registry contains **67 pages** in eleven sections. The management browser matrix exercises **61 non-History menu destinations** (History is an independently routed archive). The existing CI audits navigation and selected VIEW state, sorting, source identity, game-clock stability, save persistence, available roster tables and laptop-width shell dimensions. This change extends it with label/dropdown geometry on every displayed management VIEW and full-content-width checks on three special routes.

## Findings and fixes

1. **Stable / World / training and other shared VIEW controls:** The common VIEW helper returned an inline `label` with a block `select`. On screens that did not supply a parent-specific flex rule (including Stable & Horses), the word VIEW stacked above Overview instead of forming a single horizontal control. Use one shared `ng-manager-view-picker` layout for every instance.
2. **Due Actions:** Its direct route remained a two-column grid container although it is a single full-page workspace, causing the same half-width symptom reported on Kingsmere's operation dashboard. Explicitly display that route's parent as a block.
3. **Race File:** Its entire information panel was similarly placed into the first column of the generic route grid, despite its own intended two-column internal conditions layout. Display the route parent as a full-width block, preserving the race file's own grid.
4. **Operation overview:** Preserve the full-width correction from PR #260 and add a direct Chromium measurement to prevent regression.
5. **Menu-title capitalization:** Verify all registered menu titles begin with an uppercase letter (first alphabetic character); preserve existing proper names, acronyms, and dates.

No non-source racing results, horses, income, entries, or historical facts were created to disguise empty screens.

## Release gates

- `node --test tests/1999-cross-page-ui-consistency.test.mjs` — menu, VIEW, special-route and CSS budget contract.
- `scripts/1999-full-screen-controls-cdp.mjs` — the 61-page browser navigation/controls suite plus full-width special routes and shared picker geometry at a real 1280×800 Chromium viewport.
- Existing repository checks, screenshot/desktop audit, world and persistence checks must pass before merge.
- Single canonical stylesheet remains below its **315,000-byte** budget.
- This scope does **not** certify that every screen contains a populated player stable; that is determined by the selected saved game/operation and belongs to gameplay data integration, not a UI placeholder.
- Packaged EXE verification is distinct from merging source into main.
