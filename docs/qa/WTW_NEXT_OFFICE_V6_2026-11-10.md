# Wire to Wire v6 — Office-only visual and overlap audit
Date: November 10, 2026. Production root and /next/ use the same approved code.

## User direction
Do not expand secondary pages before the Racing Office visual standard is locked. Eliminate overlaps and widget-like presentation, preserve inbox, all decisions/choices, all six horses, all race targets, four source-colored Intel items and approved category badges/flags. Desktop Office should fit without document scrolling or text clipping.

## Verified corrections
- Replaced three separately bordered center cards with **one continuous command workspace**: a dominant photo-led Decision Desk, integrated analyst intelligence and management choices beneath it.
- Replaced independently boxed Stable/Race/Opportunities cards with **one operations rail** divided by subtle internal rules; all six horses and three known race targets remain visible.
- Fixed demonstrable race-table header overlap. The 51px column previously rendered "0 ENTERED" on two lines, spilling into the first race row. Replaced it with "STATUS", gave that column adequate width, and retained live Entered/Target text on each row and the entry count in top status summary.
- Replaced unreliable US-flag emoji in the Office schedule with a small CSS-rendered US flag, useful on Windows where regional indicators may display as "us".
- Fixed image stacking so the authorized generic horse photograph renders behind the Decision Desk, with a dark readability scrim and a composition that presents the horse's head on the right. No claim that the photo depicts Powerline.
- Retained distinct colored source identities for Trainer (green), Pace (red), Owner (gold) and Long View (blue).
- Ensured completed decisions fill the full action panel rather than compressing outcomes into a short unreadable strip. Effect, Barn Reaction, Follow-up and Next Open Case preserved.
- No second stylesheet: source remains **public/next/next.css**; no new store, game engine or page routing introduced.

## Browser checks
Chromium rendered embedded local copy at 1536×760, 1366×768, 1280×720, 1150×720 and 1093×614:
- no document-level scrolling, horizontal overflow, browser page errors or blocked Office sections in local test;
- every width retained 6 stable horses, 3 race targets, 4 Intel sources and 3 decisions;
- no measured overflow in headers, stable rows, race rows, choices, and Intel reading area;
- visible source photo loaded, title remained readable, status header remained within its allotted space;
- first real original engine choice changed Powerline to Entered and updated the corresponding race entry row;
- tested completed-decision panel at both 1366×768 and 1093×614: entire outcome text visible with no internal scrolling needed.
Existing v4/v5 case-routing tests remain in GitHub CI. This release is an Office visual refinement; not a claim of final FM/OOTP-quality lock.

## Scope and limitations
- No edits to historical archive, game records, results, source data or approved 12 v2 badge files.
- Other profile/asset pages intentionally left unchanged until Office sign-off.
- Cloudflare-origin authentication, persistence, browser history and final live screenshot still need manual production review.
- Current Office continues to show the inherited 2014 prototype; no unsupported 1999 gameplay is fabricated.
