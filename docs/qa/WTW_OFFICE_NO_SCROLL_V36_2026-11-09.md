# WTW v36 — Desktop No-Scroll FM-Style Office QA
**2026-11-09 | Local review + release notes**

## User requirement
No scrolling at all on the desktop Office; side menus look and behave like Football Manager. Tighten menu alignment and improve readability, but never cut off text. Keep approved Wire to Wire forest-green/black/red/ivory/gold identity, profile badges and original game state.

## Implementation
- Left Messages is paged, not scrolled; preserves all 8 original messages and all filter controls. Page size varies with viewport height (4, 6, 7, or 8 visible).
- Right side is a non-scrolling FM-like rail: Race Schedule shows 2 rows/page, Stable Board 3 horses/page, Opportunities 1 card/page, plus dedicated Stable/Race Calendar shortcuts. Original rows remain reachable.
- Right-panel arrows now page their own panel; they no longer accidentally change the selected Decision Desk case.
- At short desktop height / zoom, central Decision/Intel/Move and right Race/Stable/Offers/Tools panels use tabs; every panel remains accessible without scrolling.
- Resolved decision results use Effect / Barn Reaction / Follow-up tabs with readable text and preserved working Return / Horse actions; no one-row overflow.
- No core simulation rules, source records, save schema, badge pixels, full-page routes or historical archive are modified.

## Verified local QA
- 1280×800, 1366×768, 1440×900, 1150×720: full viewport with no horizontal/vertical document overflow, no detectable clipped Office rows, no overlapping nav labels, no Office list scroll, and no browser JavaScript errors in tested route flows.
- 1366×768 interactive: sidebar paging, message filtering and page 2, Stable shortcut, Horse Profile, Race Calendar shortcut, decision selection, and Save; Powerline status updated to `Entered Saturday maiden` via existing engine.
- Resolved outcomes: all 8 decision cases × 3 fact tabs × 3 widths/heights checked; no text clipping. Short 1093×614 focus layout checked.
- Note: tests were performed in a local rendered harness; real-origin Cloudflare Access, page refresh/history and externally loaded badge files were not independently reverified on the deployed site.

## Design scope
This v36 pass targets the **desktop Office**. Other asset pages (e.g. detailed Horse and Track) can still scroll; those must be separately adapted to page/tab navigation before claiming the entire game has zero scrolling. Prototype remains 2014 Office data, not production 1999 gameplay.
