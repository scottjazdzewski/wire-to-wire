# WTW — Desktop Office pixel/geometry and route audit (v33)
Date: 2026-11-09
Scope: 1280×800, 1366×768, 1440×900 at 100% zoom; visual CSS, active Office UI, and supported prototype routes.

## Baseline problems found
1. Top navigation had inherited spacing between the primary and secondary rows: the second row began 10px late and ran into the Office main canvas.
2. Decision Desk photo/feature used an oversized visually empty lane and left too little room for narrative or pressure/risk context.
3. Pressure, Primary Risk and Best Read labels/values were cut off despite apparently large parent grid rows. Legacy fixed 32–34px fact-box heights and internal line clipping caused it.
4. Opportunity Board internally requested >330px even when the right rail was 264px wide, truncating its own cards offscreen.
5. Inbox text was being forced into cramped rows rather than a scrollable fixed-height inbox.
6. Stable, horse, track, news, sales and calendar links opened narrow modal overlays with a shaded/blurred Office background rather than dedicated application screens.
7. Original approved badge artwork was only consistently allocated in existing asset profiles, not in every page header.
8. Back/Forward controls displayed placeholder history instead of restoring actual browser pages.

## Changes implemented
- Exact two-level header: 49px primary + 35px secondary = 84px, no inherited gap.
- At 1366×768, content columns are 296px Inbox / 758px Desk / 272px right rail, 10px gutters, 10px outer padding.
- Decision Desk has expanded narrative and full-height grounded risk/read facts; Intel Stack and Your Move remain side-by-side at the bottom. No new game outcomes or scores.
- Messages have 74px minimum row height with independently scrollable container; 12.9px subjects.
- Opportunity Board grid now uses minmax(0,1fr) and cannot force content outside the right rail.
- Existing route UI is full-window application page beneath the persistent header, with no dark modal backdrop. Browser URLs use ?page=...&name=... for deep-link routes, pushState and popstate. The current model has canonical track IDs but not certified horse/person IDs in these Office records, so it does not invent IDs.
- Every route page reserves a 58×58px image slot for the matching approved 512px no-text badge, preserving source PNGs. Profile identity badges use a separate 85px slot. Badge section illustrations are 32px.
- Added real current-Office Sales, News and Opportunity full-page views; created source-constrained Race Profile page links from existing track stakes rows, without inventing entrants/results.
- Replaced placeholder Back/Forward history with actual browser Back/Forward.
- Core v30 decision-state engine, local save namespace and event sources were not duplicated or changed.

## Measured browser checks
1280×800 — document 1280×800, header 49+35px, center panel width 700px; no horizontal overflow.
1366×768 — document 1366×768; left 296px, center 758px, right 272px; Decision Desk width 758px; no horizontal overflow.
1440×900 — document 1440×900; center width 816px; no horizontal overflow.
All three: no JavaScript page errors during Office render.
Interactive local tests (1366): Stable (6 horses), Race Calendar, Sales, World, News, Horse, Track, Race, return to Office, decision effect and Save (Powerline changes to Entered Saturday maiden).

## Limitations
The local QA browser blocked navigation to test HTTPS and filesystem origins, so URL state was simulated for click tests. Production refresh/deep-link, protected Cloudflare Access behavior, browser Back/Forward history, and real hosted Save/Load need browser confirmation.
The screenshots do not fetch external /assets images, so full-page header shields may appear blank in the local screenshots even though all 12 approved v2 PNGs exist at the published paths.
The existing Office game date is still the inherited 2014 prototype, not verified 1999 gameplay.
Mobile/tablet adaptation remains a follow-on and is not certified by this desktop audit.

## Deployment guardrails
No changes to historical archive or production data; pages use the original UI game state. Keep approved square WTW logo and forest-green/black/red/ivory/gold color palette. Do not promote new badge art without current manifest approval.
