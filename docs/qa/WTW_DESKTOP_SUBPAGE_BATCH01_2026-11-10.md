# Wire to Wire — Desktop Subpage Batch 01
**Date:** 2026-11-10
**Scope:** UI and routing only; main Racing Office layout remains locked.
**Code authority:** `public/next/next.js` and `public/next/next.css` on `main`.
**Source authority:** Existing Office v30 save and route handlers; the canonical historical and organizational databases remain independent upstream authorities.

## Delivered
### Connected entity pages
- Horse Profile: prior approved first-pass horse overview, career record, pedigree, achievements, owner/trainer/farm connections and source-backed decision/follow-up links.
- People Profile: compact identity and role, present stable connections, source-backed reputation/wins, Stable Horses/Career/Connections/History tabs.
- Farm Profile: compact identity, linked horses, operating context and sourced recorded activity, Connected Horses/Operations/Connections/History tabs.
- Track Profile: track/location identity, meet facts, source-backed stakes table with four comparable columns (race, date, grade, purse). Selecting a race triggers the original race-profile handler. Meet Schedule and Major Races remain separate tabs.
- A shared approved entity-photo slot now accepts real horse/person/farm/track media pointers when they actually exist, but does not display any unverified photograph as a named subject.
- Fixed the `$()` vs `$$()` collection issue that made horse achievements and multiple source-action indexes unsafe. Removed redundant organization-image fallback handling.

### Screen scrolling and navigation
- Profile identity and tabs retain their place while the data region scrolls inside the desktop viewport.
- Cards with larger source records have independently scrollable interiors and consistent sticky card headers.
- Repainting the same source route preserves the route, active tab and applicable panel scroll offsets, avoiding an unexpected return to the top after state refresh.
- Navigating to a distinct record changes the route key, so old scrolling is not inappropriately carried forward.

### FM-style stable management directory
- Compact source-backed stats, live horse search, sortable horse/activity/race/status columns.
- Status filters distinguish entered horses, known targets and no-target horses. A target is not misrepresented as an entry.
- Selected horse, race target and horse-named Office decision open their existing source-backed handler.
- Real racing commitments and related Office files replace the old explanatory sidebar.
- Table and sidebar content scroll separately within the desktop screen.
- No new roster or race/decision ledger.

## Current limits
- These are live improvements to the **existing 2014 Office prototype**, not completion of the playable 1999-world or historical import.
- Some primary sections and tabs still use source-reserved placeholders; this batch does not call them complete or pretend missing details are available.
- No fake horse form, cash balance, career achievements, dates, person stats or historical results were introduced.
- No mobile design pass was attempted.
- Automated GitHub tests and Cloudflare deployment are required; authenticated pixel-level desktop screenshot inspection remains a separate manual acceptance gate.

## Next desktop batches
1. **Racing:** event/individual race profile, entries, meet schedule, stakes and results; source-backed year and track navigation.
2. **Other management directories:** personnel, breeders, stallions, broodmares, farms and sales catalog; reuse the Stable directory's compact table/search/filter family.
3. **Decision workbenches:** training, campaign planning, breeding and auctions with actual actions/evidence and meaningful spatial/calendar graphics only when supported.
4. **Finances + historical world:** source-backed financial records and the existing History Vault's integrated year, race and entity browsing.

**Do not redesign the approved Office shell, create new save namespaces or copy the historical corpus into a second UI database.**
