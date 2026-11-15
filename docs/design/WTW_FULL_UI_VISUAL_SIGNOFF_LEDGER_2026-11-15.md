# WIRE TO WIRE — Every-Screen FM/OOTP Visual Signoff Ledger
**Opened:** November 15, 2026. **Scope:** one canonical `public/next/` game UI plus the separate History Vault. **State:** OPEN, PRODUCT NOT VISUALLY APPROVED.

## Non-negotiable acceptance question
> **Does this ACTUALLY look and operate like a premium OOTP / Football Manager desktop management screen?**
>
> If the answer is **No**, do not mark the route done, do not equate green tests with design approval, and continue refining the existing shared renderer until real screenshots are acceptable.

This does not authorize copying either game's copyrighted graphics or UI. It establishes professional density, profile identity, information hierarchy, interactive tables, useful on-screen workflows, legibility, no wasted area, and uniform navigation as quality references.

## Evidence
Visually reviewed all 27 production screenshots (including narrow desktop variants) from the passing initial screenshot capture:
- [First screenshot collection](https://github.com/scottjazdzewski/wire-to-wire/actions/runs/43684438809), downloadable artifact `wtw-fm-ootp-desktop-screens`.
- [Follow-up screenshot collection including Santa Anita](https://github.com/scottjazdzewski/wire-to-wire/actions/runs/43684689350); browser reported Santa Anita's approved actual dark-green artwork, but the color theme remained neutral. This is a REAL failed visual check, **not** a valid signoff.
- `public/next/identity-themes.mjs` now uses only sampled colors from approved exact-ID logo pixels. No designer-selected colors and no house-brand hashes. The dark-green artwork specifically requires contrast protection.
- These screenshots represent an incomplete January 1999 test world. Missing live data must remain explicitly missing; none of these UI reviews authorizes invented purse, salary, race result, foaling, financial or health values.

## Review key
**NO (blocked)** = doesn't meet FM/OOTP-quality product acceptance. **CLOSER / still NO** = right structural family, but insufficient visual quality/content hierarchy. **UNCHECKED / NO** = mandatory route not yet individually screenshot-reviewed. Only **YES** permits release acceptance after human inspection of actual screenshot at 1536×864 and 1280×800, content and interactivity validation.

| Screen | FM/OOTP? | Screenshot-grounded problem / required next fix | Priority |
|---|---|---|---|
| Racing Office / Today | CLOSER / NO | Credible inbox + photographic decision card; lower area and story/decisions need tighter editorial hierarchy and fuller operational information without false data | P1 |
| Global Search | CLOSER / NO | Dense, sortable directory is correct direction; too monochromatic and tiny at a glance, category/identity recognition weak | P1 |
| Stable overview / roster | NO (blocked) | Zero horses in active opening stable creates essentially an empty full-screen table; real world integration required plus useful honest empty-state / onboarding | P0 world + UI |
| Racing overview | CLOSER / NO | Track-meet roster works, but page lacks stronger relationship to upcoming entries, condition book and decisions; don't invent races | P1 |
| Breeding overview | NO (blocked) | Entire huge roster empty despite source-world breeding references elsewhere; integrate real registry or clearly explain distinct counts, then add useful empty-state | P0 world + UI |
| Personnel overview | CLOSER / NO | Many blank rating fields, limited person identity and overly small information scan; Quick View must make a deliberate sensible default | P1 |
| Facilities overview | CLOSER / NO | Solid source-backed roster; too many unknown columns and little facility-logo recognition; preserve genuine unknowns | P1 |
| Finances overview | NO (blocked) | Almost entirely empty with one pending opening-ledger line; must display meaningful verified financial context as engine becomes ready | P0 gameplay + UI |
| World directory | CLOSER / NO | Functional broad searchable directory; entity type and active relationships could be much easier to scan | P1 |
| World Tracks | CLOSER / NO | Dense track roster, but looks like generic copy of Racing; differentiate with actual historical identity, source facts and stakes relationships | P1 |
| World Meets | CLOSER / NO | Another near-identical large roster; clarify distinct operational meet purpose using supported records | P1 |
| World News | CLOSER / NO | Honest internal report feed, but too much unused space and weak news-item hierarchy | P1 |
| Office News | CLOSER / NO | Same reports as world view, minimal distinction and large blank lower zone | P1 |
| Opportunity Board | NO | Sparse three-item action board floating in enormous empty work area; add useful real tasks/context without fake offers | P1 |
| History Vault | CLOSER / NO | Useful data density, but separate styling differs from canonical desktop shell; maintain independent history source while tightening visual continuity | P2 |
| History: Year in Review | CLOSER / NO | Strong visual hierarchy and variety; typography / color system diverges from desktop app; refine cross-product consistency, keep distinct editorial character | P2 |
| Horse dossier | CLOSER / NO | FM-like definition grids exist but all-unassessed attributes dominate; stronger distinction of known/unknown and actionable race context needed | P1 |
| Personnel dossier | CLOSER / NO | Similar full attribute grids but too repetitive, less distinctive person-specific context and visual hierarchy than premium target | P1 |
| Aqueduct track | NO | Real cyan wordmark lacked adequate separation from cyan profile glow; require neutral dark ink-well behind cyan logo | P0 UI |
| Belmont Park track | CLOSER / NO | Identity styling stronger; cannot claim complete with truncated planned-condition strings or mostly unknown history facts | P0 UI + data |
| Gulfstream Park track | NO | White-background logo presentation looks like a pasted rectangle; approved transparent derivative / optical matte conversion needed, preserving the logo | P0 art + UI |
| Santa Anita track | NO | Approved mark is dark green/neon green, not burgundy. The page rendered dark logo on dark background and neutral palette; sample dark saturated ink and apply neutral ivory contrast halo | P0 UI |
| Kingsmere Farm | CLOSER / NO | Distinct approved crest and violet ink feel more club-like; lower workspace largely empty and right info too small for premium standard | P1 |
| Northbank Racing | NO (asset blocked) | Temporary NO monogram and only a few rows; real matching approved O-ID artwork unavailable; never invent a matching crest | P1 art |
| Argosy Bloodstock founder owner | NO (asset blocked) | Temporary AB monogram, large blank evidence area; verify exact approved O-ID logo, don't substitute | P1 art |
| Bellwether Stud founder facility | CLOSER / NO | Real mark brings stronger identity; right panels cramped and left pane underfilled | P1 |
| 1280-wide founder facility and year review | CLOSER / NO | Test exists and basic geometry passes; must inspect text clipping, label legibility and action placement at narrow desktop before acceptance | P1 |

## Mandatory not-yet-captured routes — NOT APPROVED
No screenshot signoff until each family and critical subview is actually seen. This includes:
- **Front Office:** Inbox, Decisions, Calendar routing, Reports, Career, Save/Continue panels.
- **Stable:** Horses, Training, Health, Race Plans, Barns, Naming Desk.
- **Racing:** Calendar, Entries, Results, Stakes, Race Planning, actual race-detail file, jockey/transport workflows.
- **Breeding:** Stallions, Broodmares, Foals, Pedigrees, Stud Farms.
- **Sales:** Overview, Auctions, Sale Calendar, Sale Companies, Catalogs, Watchlist, Private Offers.
- **Personnel:** Trainers, Jockeys, Owners, Principals, Staff; individual people and linked histories.
- **Facilities:** Stud Farms, Training Centers, Breaking Facilities, Racing Stables, Farms, Trainer Barns; organization/facility detail and editing.
- **Finances:** Cash Flow, Operating Costs, Budgets and transaction details.
- **World:** 1999 Horses, People, Organizations, Tracks, Meets, Major Races, News, any edit dialog, import/export.
- **History:** Race Results, Horses, People & Farms, Facilities & Tracks, Historical Calendar, Coverage; real year and race navigation.
- **Entities:** Every profile type, exact approved identity artwork, backward/forward record paging, sorting, filter reset, image/biography editing.

## Decision gates required of EVERY route
1. One existing shared shell/renderer; no duplicate navigation, no stale Office page.
2. Recognizably FM/OOTP-quality information hierarchy at 1536×864 AND 1280×800; no huge blank work area, tiny unreadable table or hidden main action.
3. Approved logos genuine and exact-ID, no invented or manually selected palette. If missing/unusable, neutral and honest.
4. At least one genuinely useful primary action / roster / information block visible; no fake records to cosmetically fill a panel.
5. Full source-backed factual content or explicit unknowns; avoid showing internal machine enum values such as `PLANNED_WTW_N...`.
6. Data sorting, searching, filtering, back/forward, edit controls and state transitions actually work.
7. All text and identity media readable (especially dark-on-dark logos and pale/white box exports), with keyboard focus, appropriate scrollbar, and no overflow/clipping.
8. Screenshot reviewer must record **YES or NO with reason**. Automated tests and screenshots alone never turn NO into YES.

## Immediate engineering queue
1. **Logo-first**: Santa Anita dark ink, Aqueduct cyan contrast, Gulfstream matte/approved transparency, plus other actual art samples. Keep approved files locked.
2. **Consolidate** enhanced shadows and stage contrast into the ONE authorized `next.css`, not a dated patch pile; respect existing 315,000-byte legacy CSS size budget rather than disabling its test.
3. **Evidence first**: expand route capture beyond first-tier views and inspect every department/subview before claiming release parity.
4. **Operational completion**: world/gameplay streams must supply real stable/breeding/finances/transaction/race information; UI must never invent records. The appearance failure is visible even when the engine cause belongs to another workstream.
5. **Repeat** screenshot acceptance and visual review after fixes. Keep PR #221 draft until review signoff and all CI green.

## Status rollup (as of this authored inspection)
**YES: zero screens approved. CLOSER but still NO: numerous. Blocked / missing: multiple.** The one-shell architecture is substantially improved, but **the answer to “Does the product visually look like OOTP or FM?” is NOT YET.**
