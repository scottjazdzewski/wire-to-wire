# WTW Office v37 — four always-visible areas and badge retirement

Date: November 9, 2026
Scope: Desktop Racing Office UI, single canonical gameState. Original decision engine and saved-state schema unchanged.

## Permanent Office composition
1. Inbox and existing priority filters, accessible via pagination without page scrolling.
2. Decision Desk, case context, color-coded Intel Stack and original choice actions.
3. All six horses in the current Stable Board, each clickable for its dedicated Horse page. The activity subtitle is sourced from the current Office messages/fixtures or an explicit 'No current Office activity recorded' state, with canonical gameState status updates taking precedence.
4. Upcoming Races: only the existing actual racing-target rows (Churchill Downs / Keeneland / Saratoga), not unrelated sales/works/owner obligations. Clearly label targets as targets rather than confirmed entries; after the genuine 'Enter Saturday' decision changes Powerline's state, the screen changes to '1 entered · 2 targets'.

Opportunities is a one-click shortcut with its existing three items (private Powerline offer, Aqueduct claiming lead, Saratoga sale prospect). The full Opportunity Board route remains available; it is no longer a permanent tall side panel.

## Approved imagery
The 12 exact v2 transparent 512px no-text green/gold badges in the previously verified APPROVED CURRENT Drive manifest remain the only deployed profile/section badges. Retire the four old v1 public PNGs and replace all their known CSS/office-route references to v2 assets. Do not remove the separate approved Wire to Wire horse-and-jockey game logo. Do not delete canonical source art or historic Drive records.

## Local visual and interaction QA
- Rendered 1366×768, 1280×800, 1440×900, 1150×720; no document-level horizontal or vertical overflow; all 6 stable horses and 3 racing targets visible on each normal desktop.
- Interactive: clicked Hardtack profile, returned to Office, opened Opportunities full page, returned, opened Saratoga track page, selected Powerline's first authorized decision. State propagated to stable as 'Entered Saturday maiden' and the race summary changed to '1 entered · 2 targets'.
- Tested CSS/JS syntax. The browser's local about:blank page restricts browser history and localStorage, so real-origin Save/Load and deep-link reload remain deployment QA gates.
- Existing 2014 prototype data remains a prototype; no claim that a connected 1999 game run, live race results, or actual trainer schedules have been created.
- Short-height/125% zoom continues to use accessible v36 panel focus tabs rather than claiming every panel fits simultaneously.

## Next design and engineering stages
- Build all approved Office/Stable/Racing/Breeding/Sales/Personnel/Facilities/Finances/World navigation destinations as functioning canonical pages, with real URLs keyed by source identity.
- Extend stable activity from the current prototype's limited messages into the certified horse/trainer/barn/feed data when connected.
- Introduce authenticated data-sourced race entries and appropriate event provenance before calling tentative targets confirmed entries.
- Keep desktop no-scroll and adapt tablet/mobile independently without separate game state or clipped controls.
