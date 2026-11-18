# Wire to Wire Office v38 — Single Active Visual Layer
Date: November 9, 2026. Production site: https://wire-to-wire.pages.dev/

## Purpose
Retire all SIX linked cumulative versioned Office stylesheets from the active site HTML and publish ONE canonical runtime stylesheet: `/office-visual-system-v38.css`. The legacy files remain in source history for rollback, but are no longer linked or loaded by the active Office page.

## Fidelity and refinement
- Compiled from last-approved v37 Office screen; preserved live data binding, stable, calendar, opportunities and decision controls.
- Contains approved WTW forest-green/charcoal, restrained red/gold, verified original logo and approved v2 badge links.
- Added a focused typography/surface pass: Inter/system font hierarchy, subtle panel depth, precise borders, richer hover/focus states, and improved selected-message and decision treatments.
- Restored the existing approved racing photo as a subtle, editorial-style image surface for the Decision Desk; it is decorative and not identified as Powerline.
- No simulation or historic source record changes; 2014 remains the current Office prototype.

## Local browser QA
1366×768, 1280×800, 1440×900, and 1150×720: exactly one stylesheet, no document-level horizontal/vertical overflow, full six-horse Stable Board and 3 race targets present; no JS errors on initial Office render.
Clicked Stable and Race Calendar and returned to Office in a local opaque-origin browser. A pushState error occurs only because about:blank has an opaque origin; hosted-origin history and Save/Load remain a separate browser QA gate.
The premium local screenshot may not show the hosted decorative photo because file-relative `/assets` URLs are unavailable on the opaque test origin; original approved v2 badge images were injected into screenshot tests without modifying the deployed CSS assets.

## Design-system rule
There must be exactly ONE active Office stylesheet, with no @import, inline style tags, or second linked visual layer. New typography/panel/navigation changes must be edited inside this file and tested as a unit; future source cleanup should eliminate accumulated obsolete selector overrides inside the file rather than piling on unrelated sheets.

## Next
Continue actual modern visual polish and context navigation on the same source, and verify Cloudflare-origin asset loads, Save/Load, and full-page Back/Forward.
