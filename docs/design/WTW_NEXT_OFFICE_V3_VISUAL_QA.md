# WTW Next Office v3 — Premium Office rebuilding pass

Date: 2026-11-09. Scope: ONLY the /next/ Office design and shared application chrome. The production root is unchanged.

## Visual and structural change
- Rebuilt the primary menu, masthead, contextual tabs and dashboard regions using one cohesive charcoal/forest/ivory/gold/red desktop UI stylesheet, not another layered stylesheet.
- Made the Decision Desk the primary focal surface, with source-based case heading, grounded decision factors, existing generic stable photo and direct action links.
- Rebuilt Messages as a paginated management inbox. All original messages remain source-driven and accessible.
- Rebuilt the six-horse stable roster as legible two-line rows with no name ellipsis at laptop widths; clicking a horse opens the existing canonical Horse route.
- Rebuilt the three-race schedule as a compact management list showing target versus confirmed entry from the same original game state. Clicking a racecourse opens its route.
- Kept four color-coded Intel boxes and all actual decision choices on the Office screen. Each selection still invokes the frozen original decision resolver.
- Used scalable line-art SVGs for the small interface controls and the 12 existing approved v2 badges for all routed profile identity artwork.
- No invented horse records, budgets, historic race results, or duplicated state stores. The prototype remains the Office July 2014 dataset.

## Local browser acceptance checks
Chromium at 1366×768, 1280×800, 1440×900, 1150×720 and 1093×614. At all sizes: no full-page overflow, no nav overlap, 6 horses, 3 racing targets, 6 of 8 inbox messages per page, all three decision buttons accessible, and no JavaScript page errors on tested flows.
At 1366×768: select The Last Match inbox item then return to Powerline, resolve Enter Saturday, confirm horse state and Churchill Downs race become Entered, open The Last Match Horse Profile, return Office, open 14-day Race Calendar.
At 1093×614 reduced height: hide decorative photo and reflow decision text so actions remain on screen.

## Gates remaining
- Cloudflare live-origin reload/history, durable Save/Load (opaque local-browser test uses a localStorage shim).
- Design acceptance against reference screenshots and profile-wide visual rollout after Office is approved.
- Later integrate 1999 authority data, rather than representing the existing 2014 prototype as final gameplay.

Preview: https://wire-to-wire.pages.dev/next/
