# WTW Racing Office v7 — Structural redesign and QA

Date: 2026-11-10. Scope: **main Office only**; the homepage and /next/ share one UI source.

## A genuinely different composition
The Office command workspace has been rebuilt from a wide hero-over-two-widgets layout to a **two-column command screen** on standard desktops. The left combines the case briefing (with a source-identified reference photo) and four numbered color-coded analyst reads; the right is a full-height three-option decision column. Each decision now includes its previously hidden explanatory sentence, read directly from the original **deskCases** record. The new interface creates no separate data store.

Inbox, all six stable horses, and all three race targets remain visible and clickable alongside the central decision screen. The 12 approved gold/green badge files, actual game state, case routing, save schema, source flags, and historical /archive remain untouched.

## Narrow laptop behavior
The two-column command view switches back to a horizontal briefing/decision-and-intel arrangement under 1280px. This preserves meaningful text widths instead of compressing fonts to make two tiny columns fit. Below 660px height, right-rail rows and outcome text reorganize to avoid overlap and hidden descriptions. The new layout is in **the same public/next/next.css file**: only one linked stylesheet; no additional CSS import.

## Local actual-browser QA
- Chromium screenshots at 1093×614, 1150×720, 1366×768 and 1536×760: no horizontal/vertical document overflow, no page errors, all six stable horses, three race targets, four analyst reads and three choices visible.
- Measured main, row, choice and header containers for text overflow. The initial 1093×614 stable/race collision was fixed with a taller roster allocation; follow-on checks returned no overflowing monitored Office rows.
- Verified all eight existing decision cases expose three source-derived move descriptions each. Executed one actual decision per case and visited Effect, Barn Reaction, Follow-up—24 outcome readings without JS errors. In one continuous session, the Horse Profile and Race Calendar opened through original handlers, with six displayed calendar events.
- A 1093px completed-decision clip was detected and repaired by reallocating padding/row space, with subsequent measured clipping check empty.

## Honest limitations
- The prototype date is still July 2014; v7 does not claim to implement the canonical 1999 racing simulation.
- Browser tests used a local opaque-origin preview and a localStorage/history shim; Cloudflare-origin Save/Load and navigation refreshing need hosted verification.
- Visual lock is **not claimed**. The user has asked that the Office reach FM/OOTP quality before secondary pages are refined.
- The original core Office visual system still has legacy rules, though only one stylesheet is active. Further internal CSS cleanup is warranted after user accepts the structural direction.
