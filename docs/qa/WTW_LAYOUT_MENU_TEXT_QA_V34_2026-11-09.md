# WTW Office layout / menu / text audit v34 — 2026-11-09

## What changed
- Rebuilt primary header allocations so the brand has its own fixed width instead of overlapping the six primary menus.
- Moved Back and Forward into the secondary toolbar so game navigation labels fit fully.
- Kept all approved primary page names: Office, Stable, Race Calendar, Sales, World, News.
- Fixed the Opportunity Board heading and linked All action so it no longer collides with carousel arrows; full Opportunity Board page title remains unchanged.
- Adopted one coherent 86px two-level game shell, with 48px primary navigation and 38px secondary navigation.
- Removed inbox title and metadata truncation; content wraps within independently scrollable Messages.
- Reworked the Decision Desk's fact column so Pressure, Primary Risk, Best Read, Open File and Horse Profile are visible without being cut off at 1366x768.
- Balanced three-column page spacing and made message, Intel, Move, schedule and opportunity panels internally scroll when content exceeds available height.
- Preserved approved forest-green, black, ivory, gold and red color language and all existing approved badge slots and asset routes.
- Consolidated the prior v32/v33 UI CSS into a single v34 stylesheet, with no changes to the v30 source records, core decision logic, Save/Load namespace, or profile data.

## Tested local browser layouts
- 1280x800: viewport dimensions matched document, 0 identified clipped/overflowing UI text items, no brand/nav overlap, 0 page JavaScript errors
- 1366x768: viewport dimensions matched document, 0 identified clipped/overflowing UI text items, no brand/nav overlap, 0 page JavaScript errors
- 1440x900: viewport dimensions matched document, 0 identified clipped/overflowing UI text items, no brand/nav overlap, 0 page JavaScript errors
- 1150x720: viewport dimensions matched document, 0 identified clipped/overflowing UI text items, no brand/nav overlap, 0 page JavaScript errors
- 1092x615: viewport dimensions matched document, 0 identified clipped/overflowing UI text items, no brand/nav overlap, 0 page JavaScript errors

## Interaction coverage
- Six main menu items present and accessible.
- Full-page Stable, Race Calendar, Sales, World and News destinations opened via current UI routing.
- Stable 6-horse roster; Horse and Track linked pages navigated.
- One decision selected and Save verified against the existing `wtwOfficeStateV30` state namespace.

## Important verification limits
- The sandbox blocks navigation to a hosted browser origin; query-string route navigation was tested by intercepting history pushState in the local browser, not by production refresh/deep-link or true popstate.
- The CSS text-overflow scan was targeted to critical navigation/header/decision/message/right-rail elements. It is not a claim that every possible future record is certified.
- Current Office still uses the 2014 prototype demonstration world; no 1999 racing model data was changed.
- On-site Cloudflare Access deployment, logo/badge image fetches and real-origin Save/Load across reload must be checked by a browser with access.
