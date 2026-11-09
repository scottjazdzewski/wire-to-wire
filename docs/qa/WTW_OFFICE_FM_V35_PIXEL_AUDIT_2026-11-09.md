# WTW Office / v35 visual-and-interaction acceptance (2026-11-09)

Status: desktop implementation verified locally at 100% zoom; GitHub checks / protected Cloudflare runtime require separate confirmation.

## Reference target
User-supplied, clean Football Manager-style portal mockup: a legible two-level header, left inbox, dominant central action/information area, narrow right utility panels, consistent spacing, restrained racing-image accents, and no clipped or overlapping text. Preserve WTW's **actual dark forest-green, charcoal, red, ivory and gold** identity (not the reference's blue or magenta), original WTW logo, and 12 approved v2 no-text gold/green badges. The fictional horses, winnings, tracks and results in the reference image are NOT data sources.

## Structural changes
1. v34 reorganizes the existing six primary menus and the operational controls into independently allocated 50px/38px navigation rows; Back/Forward, Save/Load, Export/Reset and Continue remain distinct working controls.
2. v35 **moves original live DOM nodes** for the Decision Desk, its three source-based Decision Factors, the Intel Stack and the three action choices into a deliberate center grid (rather than cloning content or introducing a second game state). The layout has an Office identity banner, a Decision Brief/Factors row, and a paired Intel/Your Move row.
3. Inbox now has a date separator derived from the current in-world clock; category tags based on actual existing source-case classification; author, subject, metadata and time all have their own columns. Message content wraps naturally and the list scrolls.
4. The right rail retains Race Schedule, Stable Board, and Opportunity Board with aligned 44px section headers, consistent padded rows and internal independent scrolling.
5. Toast notifications live in unused primary-header space and do not obscure the right-side actionable entries.
6. Existing v33 full-screen route pages and approved badge placement are preserved; the new Decision Factors header also uses the approved Connections badge.
7. All underlying decision inputs, outcomes, source horse information and storage keys are retained unchanged. The site remains the 2014 interface prototype, NOT a certified playable 1999 simulation.

## Measured viewport acceptance
- **1280×800**, **1366×768**, **1440×900**: document footprint matches viewport; zero horizontal page-level overflow. No overlapping adjacent navigation buttons across both header rows. Zero textual client/scroll-box clipping on the audited navigation, inbox, center decision, factors, Intel, choices, and sidebar key text selectors.
- Eight live desk cases tested at all three desktop widths: powerline, lastmatch, saratoga, pieta, cash, newsbuzz, entries, cedar. All rendered their current titles/summary/facts/intel/choices with **zero measured text overflow**, three intact original choices, and no browser page exceptions in the default Office state.
- Additional layout probe at 1093×614 (approximately 125% browser-zoom geometric footprint): no page-wide overflow or adjacent-nav overlaps, but responsive/full content work requires later QA.
- Switched from Powerline to The Last Match: headline, risk and choices updated as expected. Clicking an existing choice from Powerline updated the established roster and schedule and wrote the existing `wtwOfficeStateV30` storage key with a local test-storage shim.
- Full-page routes exercised: Stable (six original roster horses), Horse Profile through the actual **Open Horse** control, Race Calendar, Sales, World, News, and Office return. Existing JS code emits `history.pushState` errors under a `null`/`about:blank` sandbox origin; on-site URL history and full-origin Save/Load remain a **production verification requirement** (not claimed certified by local QA).

## Release guardrail
Deploy only if the live repository branch still matches the inspected head, all four source JS/CSS files are exactly byte-verified against local reviewed assets, and the GitHub workflow succeeds. Do not overwrite Drive authoritative v30 and do not alter game/canon databases. Use the new v34/v35 presentation files in addition to existing v33 page-routing layer; no changes to older JS engines.
