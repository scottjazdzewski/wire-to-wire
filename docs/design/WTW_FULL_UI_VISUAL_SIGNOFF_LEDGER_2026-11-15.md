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

## Second screenshot inspection — 43 rendered captures, November 15
**Actual evidence:** [Expanded Chrome route screenshots](https://github.com/scottjazdzewski/wire-to-wire/actions/runs/43685619314), artifact `wtw-fm-ootp-desktop-screens`. All automated visual/geometry checks passed on that run; **human FM/OOTP release signoff still fails**.

### Logo correctness improved — do not mistake this for whole-page approval
- **Santa Anita:** the actual approved mark is dark green with a bright green element. The latest browser DOM confirms `data-wtw-identity-source=logo-pixels` and `wtw-hero-dark-ink`; new ivory neutral spotlight makes its genuine dark-green wordmark visible. The page is **CLOSER / NO** because its stakes rows still expose truncated internal condition/status strings and large empty areas.
- **Aqueduct:** authentic cyan wordmark is now visible against a neutral dark logo well while the header inherits genuine cyan ink; **CLOSER / NO** until complete track context and text-density review.
- **Belmont:** genuine approved green, not a universal default; good context but missing/uncertified detail areas remain.
- **Gulfstream:** the legacy approved source still appears on a rectangular white matte; need approved transparent display derivative, never recolor or invent its navy identity.
- **All logos:** one validated pixel-derived source, no selected burgundy or house palette. Neutral is required when a logo is unavailable.

### Additional route verdicts
| Newly captured route | FM/OOTP? | Observed issue | Workstream |
|---|---|---|---|
| Sales Overview | **NO** | Entirely empty auction/market roster and nearly full-screen unused stage | Gameplay market data + UI empty state |
| Sales Auctions | **NO** | Same empty view, no differentiated auction experience | Gameplay + UI |
| Naming Desk | **CLOSER / NO** | Meaningful local naming tools/gates exist, but huge empty proposal area dominates until proposals generated; not polished enough as a working desk | UI + naming |
| Office Messages | **NO** | Screenshot used generic connected-record dashboard. Fix applied so direct route retains 'Messages' and can restrict to decision records; real inbox-specific layout still needed | UI |
| Office Decisions | **NO** | Same generic dashboard bug; route-context fix applied; must differentiate actionable decisions from general record search | UI |
| Office Career | **NO** | Generic dashboard shown instead of genuine job/career progression | Gameplay career + UI |
| Stable Training | **NO** | Generic whole-world connected-directory screen, not training-specific schedule/assignments | Gameplay + UI |
| Racing Calendar | **CLOSER / NO** | Real calendar grid plus condition-book table useful; controls/row text still too small and busy | UI |
| Racing Entries | **NO** | No committed entries and almost full-page blank roster | Gameplay race flow + UI empty state |
| Breeding Foals | **NO** | Very little actual supported foal data, underfilled management screen | World/breeding + UI |
| Personnel Jockeys | **CLOSER / NO** | Genuine jockey roster is present; most ability/financial fields unassessed, identity weak | Data + UI |
| Facilities Stud Farms | **CLOSER / NO** | Credible sourced subset, but very sparse columns and unused space | Data + UI |
| Finances Cash Flow | **NO** | Only uncertified opening-account context; no genuine cash-flow series yet | Gameplay finance + UI |
| World Organizations | **CLOSER / NO** | Populated canonical organization list with source-backed context; branding differentiation in roster still weak | UI |
| World People | **CLOSER / NO** | Populated personnel list, but dense low-contrast type and missing portraits/role hierarchy | UI |

**Human verdict:** Still **ZERO YES**. The game is structurally closer to an OOTP/FM management system, but the sparse market/roster screens, generic department pages, blank financial content and incomplete race-specific presentation remain unacceptable. The all-screen signoff ledger stays OPEN.

## Mandatory not-yet-captured routes — NOT APPROVED
No screenshot signoff until each family and critical subview is actually seen. This includes:
- **Front Office:** Calendar routing, Reports, Save/Continue panels (Messages, Decisions and Career captured but NOT approved).
- **Stable:** Horses, Health, Race Plans, Barns (Training and Naming Desk captured but NOT approved).
- **Racing:** Results, Stakes, Race Planning, actual race-detail file, jockey/transport workflows (Calendar and Entries captured but NOT approved).
- **Breeding:** Stallions, Broodmares, Pedigrees, Stud Farms (Foals captured but NOT approved).
- **Sales:** Sale Calendar, Sale Companies, Catalogs, Watchlist, Private Offers (Overview and Auctions captured but NOT approved).
- **Personnel:** Trainers, Owners, Principals, Staff; individual people and linked histories (Jockeys captured but NOT approved).
- **Facilities:** Training Centers, Breaking Facilities, Racing Stables, Farms, Trainer Barns; organization/facility detail and editing (Stud Farms captured but NOT approved).
- **Finances:** Operating Costs, Budgets and transaction details (Cash Flow captured but NOT approved).
- **World:** 1999 Horses, Major Races, any edit dialog, import/export (People, Organizations, Tracks, Meets, News captured but NOT approved).
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

## Complete route-capture register — 79 canonical routes + 2 narrow desktop variants

Source: [full browser capture run, 81 screenshot files](https://github.com/scottjazdzewski/wire-to-wire/actions/runs/43686976832), with all route captures driven by the existing shared shell and `scripts/desktop-visual-audit.sh`. The run passed automated screenshot/geometry assertions. Contact-sheet review has identified the issues above; **individual, full-resolution human FM/OOTP visual signoff has NOT been given**. Latest PR changes to matte rendering and Stable-specific operations have not yet cleared their own visual gate.

| Captured screenshot | Does it look like a fully finished FM/OOTP screen? | Outstanding review focus | Priority |
|---|---|---|---|
| `stable-roster.png` | **NO — unapproved** | Sparse, generic or no verified game records | P0 |
| `world-directory.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `world-tracks.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `world-meets.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `world-news.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `office-news.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `opportunity-board.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `racing-roster.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `global-search.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `horse-profile.png` | **NO — unapproved** | Individual premium UI review pending | P0 |
| `people-profile.png` | **NO — unapproved** | Individual premium UI review pending | P0 |
| `founder-owner.png` | **NO — unapproved** | Real-logo contrast/identity acceptance | P1 |
| `founder-facility.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `racing-office.png` | **NO — unapproved** | Editorial hierarchy, inbox detail and actionable daily state still require premium OOTP/FM signoff | P0 |
| `aqueduct-track.png` | **NO — unapproved** | Real-logo contrast/identity acceptance | P1 |
| `belmont-track.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `gulfstream-track.png` | **NO — unapproved** | Pending latest UI rerender | P0 |
| `santa-anita-track.png` | **NO — unapproved** | Real-logo contrast/identity acceptance | P1 |
| `kingsmere-farm.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `northbank-stable.png` | **NO — unapproved** | Real-logo contrast/identity acceptance | P1 |
| `personnel.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `facilities.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `finances.png` | **NO — unapproved** | Sparse, generic or no verified game records | P1 |
| `breeding.png` | **NO — unapproved** | Sparse, generic or no verified game records | P1 |
| `sales-overview.png` | **NO — unapproved** | Sparse, generic or no verified game records | P1 |
| `sales-auctions.png` | **NO — unapproved** | Sparse, generic or no verified game records | P1 |
| `naming-desk.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `office-messages.png` | **NO — unapproved** | Pending latest UI rerender | P0 |
| `office-decisions.png` | **NO — unapproved** | Pending latest UI rerender | P0 |
| `office-career.png` | **NO — unapproved** | Sparse, generic or no verified game records | P0 |
| `stable-training.png` | **NO — unapproved** | Pending latest UI rerender | P0 |
| `racing-calendar.png` | **NO — unapproved** | Individual premium UI review pending | P0 |
| `racing-entries.png` | **NO — unapproved** | Sparse, generic or no verified game records | P1 |
| `breeding-foals.png` | **NO — unapproved** | Sparse, generic or no verified game records | P1 |
| `personnel-jockeys.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `facilities-stud-farms.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `finances-cash-flow.png` | **NO — unapproved** | Sparse, generic or no verified game records | P1 |
| `world-organizations.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `world-people.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `stable-health.png` | **NO — unapproved** | Pending latest UI rerender | P0 |
| `stable-race-plans.png` | **NO — unapproved** | Pending latest UI rerender | P0 |
| `stable-barns.png` | **NO — unapproved** | Pending latest UI rerender | P0 |
| `racing-results.png` | **NO — unapproved** | Sparse, generic or no verified game records | P1 |
| `racing-stakes.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `racing-race-planning.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `breeding-stallions.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `breeding-broodmares.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `breeding-pedigrees.png` | **NO — unapproved** | Sparse, generic or no verified game records | P1 |
| `breeding-stud-farms.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `sales-sale-calendar.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `sales-sale-companies.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `sales-catalogs.png` | **NO — unapproved** | Sparse, generic or no verified game records | P1 |
| `sales-watchlist.png` | **NO — unapproved** | Sparse, generic or no verified game records | P1 |
| `sales-private-offers.png` | **NO — unapproved** | Sparse, generic or no verified game records | P1 |
| `personnel-trainers.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `personnel-owners.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `personnel-principals.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `personnel-staff.png` | **NO — unapproved** | Sparse, generic or no verified game records | P1 |
| `facilities-training-centers.png` | **NO — unapproved** | Sparse, generic or no verified game records | P1 |
| `facilities-breaking-facilities.png` | **NO — unapproved** | Sparse, generic or no verified game records | P1 |
| `facilities-racing-stables.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `facilities-farms.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `facilities-trainer-barns.png` | **NO — unapproved** | Sparse, generic or no verified game records | P1 |
| `finances-operating-costs.png` | **NO — unapproved** | Sparse, generic or no verified game records | P1 |
| `finances-budgets.png` | **NO — unapproved** | Sparse, generic or no verified game records | P1 |
| `world-1999-horses.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `world-major-races.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `tracks-overview.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `tracks-active-meets.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `tracks-all-tracks.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `tracks-stakes.png` | **NO — unapproved** | Individual premium UI review pending | P1 |
| `office-reports.png` | **NO — unapproved** | Sparse, generic or no verified game records | P1 |
| `history-vault.png` | **NO — unapproved** | Individual premium UI review pending | P2 |
| `history-horses.png` | **NO — unapproved** | Individual premium UI review pending | P2 |
| `history-people-farms.png` | **NO — unapproved** | Individual premium UI review pending | P2 |
| `history-tracks-facilities.png` | **NO — unapproved** | Individual premium UI review pending | P2 |
| `history-calendar.png` | **NO — unapproved** | Individual premium UI review pending | P2 |
| `history-coverage.png` | **NO — unapproved** | Individual premium UI review pending | P2 |
| `history-year-review.png` | **NO — unapproved** | Individual premium UI review pending | P2 |

Additionally, the audit captures `founder-facility-1280.png` and `history-year-review-1280.png` at 1280×800. Both are **NO — not yet signed off** until individual legibility/clipping verification. All `79` canonical routes have a screenshot; this is evidence coverage, not approval.

**Live source-backed content deficit:** Breeding Foals/Pedigrees/Overview, Facilities Breaking Facilities/Training Centers/Trainer Barns, Finances, Sales Auctions/Catalogs/Watchlist/Private Offers, Personnel Staff, Racing Entries/Results and the player Stable currently show essentially empty source-backed roster tables. We cannot fill these with fabricated records or make page completeness claims. The engine/world workstreams must deliver the meaningful source data, while UI ensures honest empty-state workflows.

**Design consistency deficit:** Career/Reports and several Stable subviews were near-identical generic World directories in the captured screenshots. Dedicated Stable Health/Race Plans/Barns have been implemented on PR #221 and require fresh screenshot acceptance. The Office Inbox/Decisions had already received dedicated case-file views. The History Vault has a distinct editorial UI and needs visual-quality consistency without merging its historical data into the fictional gameplay world.

**Logo acceptance:** Source palettes must always be derived from true displayed logo pixels, never designer-selected team colors. Gulfstream's source opaque white canvas is a P0 defect and has a presentation-only matte treatment under test. Santa Anita needs stronger contrast for its actual dark green wordmark (not burgundy). No protected original logo source files were changed.

## Source-logo forensic and empty-state QA follow-up

The **actual approved local WebP sources**, copied without any modification from `public/assets/places/track-logos/`, were inspected in the desktop visual audit. Gulfstream `T-0017.webp` is **1600×1200**, has fully opaque white RGBA corners, and approximately **97.24% near-white opaque pixels**; Aqueduct `T-0001.webp` is also 1600×1200 with approximately 87.02% near-white opaque pixels. These are original export mattes, not designer-selected identity colors. The actual code's alpha edge-removal algorithm was independently exercised at a 768-pixel maximum dimension on both original sources and returned a usable logo mask. No source logo assets were edited.

- Profile logo transitions have persistent per-image load/error listeners to restore the **actual logo-derived** color after swapping to a temporary transparent derivative. The earlier browser run proved the original one-shot listener lost the Aqueduct theme during this swap; a later run verified Aqueduct restored its theme when the listener was fixed.
- The current source-code revision converts approved matte-backed legacy marks to lossless alpha PNG **in memory**, not through the delayed lossy WebP blob encoder; the latter caused an unapproved wide white/gray logo haze. The browser gate requires both a transparent display and `identitySource=logo-pixels`, not merely `mix-blend-mode:multiply`.
- The off-white detection and removal use the same near-white criteria. Neutral off-white export backgrounds are cleared fully rather than left at about 10% alpha, avoiding a rectangular gray afterimage.
- The player Sales/Breeding/Racing/Facilities/Personnel/World zero-row rosters now display a source-honest working state and links to registered existing VIEW tabs. The roster default criteria object is **not** an active filter; the screenshot previously showed an erroneous “NO MATCHING RECORDS” on the unfiltered Sales Auctions view. That classification and its hidden-actions regression now have direct tests.

**FM/OOTP judgment: still NO overall.** No blank ledger, missing race entry, unverified horse, absent logo or insufficient management view may be scored as finished. A new screenshot and actual visual review must prove the Gulfstream plaque is gone and the page palette still comes from its original navy ink. All 79 routes remain individually unapproved until observed and signed off. The PR stays DRAFT and unmerged. Other engineering windows own missing game/economic source records.


## November 15 latest completed 81-capture contact-sheet review (PR #221 head `8d8ca446`)

Evidence: [Desktop Visual Audit run 43706856072](https://github.com/scottjazdzewski/wire-to-wire/actions/runs/43706856072), artifact `wtw-fm-ootp-desktop-screens`. All three audit jobs passed, and the screenshot archive contains 81 PNGs. All 81 were inspected in three labeled 27-image contact sheets. Contact-sheet review is useful for layout and whitespace, **not** a substitute for full-resolution line-by-line clipping or interaction signoff. **81/81 NO for release approval; zero YES.**

- **P0 empty workspaces — NO:** Breeding Foals, Pedigrees and Overview; Sales Auctions, Catalogs, Watchlist, Private Offers and Overview; Facilities Breaking Facilities, Training Centers and Trainer Barns; Finances Budgets, Cash Flow, Operating Costs and Overview; Personnel Staff; Racing Entries and Results. These have real navigation and honest empty-state copy, but a huge dark unused area still dominates. Missing underlying records belong to the relevant world/gameplay workstreams; no invented rows.
- **Player Stable — NO:** Health, Race Plans and Barns now render a centered zero-horse explanatory panel and route buttons instead of an unframed blank table; this is a verified visual improvement, not a populated management view. Stable Roster remains near-empty; Training has contextual copy but limited real assignments.
- **Logos and profiles — NO:** Gulfstream's former white rectangular matte is no longer visible in the screenshot; the logo now has a narrow subdued light treatment, though its small navy wordmark and surrounding hierarchy still require full-resolution contrast acceptance. Aqueduct cyan and Santa Anita green marks are present and visibly distinct, but not yet premium profile signoffs. Founder owner/facility, Kingsmere, Northbank, horse and person profiles have recognizable identity and compact grids; large underfilled lower panes and repetitive unknown fields remain.
- **Useful dense tables — CLOSER / NO:** World Horses, World Directory, World Tracks/Meets, Personnel Trainers/Owners/Jockeys, Racing Stakes/Planning/Calendar, Facilities/Farms and Breeding Stallions/Broodmares show credible management density. Their very small typography, generic repeated roster composition, uncertain fields and unverified row-level controls prevent YES.
- **Office and History — CLOSER / NO:** Racing Office has a photographic decision story and operational sidebar; Messages, Decisions, Reports and Career now have distinct panels. Yet Career and Opportunities are sparse, and World/Office News have underused lower space. History Year in Review is visually rich, but its separate styling and narrow-screen legibility need detailed checks.
- **1280×800 — NO pending detailed inspection:** Founder Facility and History Year in Review captured and structurally fit, but contact-sheet scale cannot certify all text, focus states or clipping.

**CI is not visual acceptance.** All seven PR-head workflows reported success for `8d8ca446` (including Desktop Visual Audit, Product-Wide Release Integrity, 1999 source integration, Canon Desk, Windows Desktop EXE and commercial contract). A separate main commit `ec960e1c` landed after the PR base, modifying the commercial career manager and its test. PR #221 was **draft and non-mergeable** at this inspection; rebase/reconcile the newer career work before any merge, and rerun checks after reconciliation. No code/asset changes are authorized by this contact-sheet assessment.
