# WIRE TO WIRE — Lane 6 UI integration and release gates
**Observed:** 2026-11-17  
**Base:** `main` at `460ca579d7ed03a92de8e71a3eec272c6e48e360`

## The one playable renderer

The shipping development target is the existing `public/next/` renderer with the local 1999 game and durable active career. `WIRE_TO_WIRE_UI_CURRENT` is a *visual/reference* package, not a second runtime. Its root `README_FIRST.md` labels Office v24 while the package authority ledger/current-state files label v31; do not import either standalone HTML source over the current shared renderer. Keep the approved navigation, logos, panel geometry, saved record IDs and exact links.

## Open UI PRs to reconcile without losing implemented code

| PR | Confirmed scope | Conflict/acceptance work |
|---|---|---|
| #251 | Full-world generated directories, roster paging, people/farm links, track/calendar browsing, multiple logo repairs | Open; changes `next.js`, `next.css`, commercial career manager and large asset set. Its PR description reports 300k world startup hitting `Invalid string length`. Do not call the *playable* 300k career certified on that evidence. Asset bytes + lock must stay synchronized. |
| #261 | Shared horizontal VIEW control and full-width Organization/Due Actions/Race File screens | Open; changes `next.js`, `next.css`, browser cross-page audit. Preserve its 61-route viewport matrix and 67-title test. |
| #266 | Saved May-29-1999 full-world read projection: exact horse/run/race IDs, actual cash and results, canonical back/forward routes | Open; changes `next.js` and commercial career manager plus new read model and Chromium checks. Preserve saved-run source-ID validation, unknown-field labels and identity links. |

**Critical overlapping files:** `public/next/next.js` is changed by all three; `next.css` by #251/#261; `1999-commercial-career-manager.mjs` by #251/#266. Merge/rebase them deliberately after each other's accepted behavior is verified, not by overwriting later main or introducing a second UI.

## Lane 6 small correction in PR #273

This PR intentionally avoids all overlapping paths. It corrects missing age versus actual age zero, status word-boundary matching, accounting-style display filters, status fallbacks, and age-zero display in the existing Stable attributes page. Source regression tests are in `tests/1999-roster-filter-source-parity.test.mjs`.

## Still-required full UI release matrix

1. Load the **same** canonical 300,000-horse 1999 career, not a smaller replacement world; confirm stable and World row counts and sample immutable horse IDs against the saved registration records after restart.
2. At 1440×900, 1280×800, 1366×768 and 1024×768, test Office, Stable, attribute ranking, World, owners, farms, trainers, jockeys, tracks, Calendar, Race File, finance and history. Check internal scrolling, no document overflow, full-width special screens and visible logo alpha.
3. Click exact horse, owner, trainer, jockey, farm, track and race links; use Back and Forward through peer dossiers; verify that duplicate display names do not change record identity.
4. Change sort, column, range and status filters; assert displayed count/rows are derived from the full saved data and that missing values are never interpreted as zero. Confirm page controls change identity-linked rows.
5. Reconcile each visible cash balance/purse/entry amount and historical result with its exact underlying saved-game ledger ID. Unknown source values must be visibly unknown, not invented.
6. Close/reopen the real installed Windows app fully offline with the same run/world IDs and date; capture screenshots and interaction logs. A browser-only check or green web deployment is not a Windows release certification.

**Release status:** PR #273 is a narrow verified source fix, not a declaration that the complete game UI or full-size Windows career has passed. The required browser, source, package, and offline desktop CI checks remain independent gates. Coordinate new assets with the graphics lane; no asset bytes change here.
