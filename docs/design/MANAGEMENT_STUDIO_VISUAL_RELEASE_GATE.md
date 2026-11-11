# WIRE TO WIRE — VISUAL RELEASE GATE

Status: **NOT APPROVED / DO NOT PRESENT AS FINISHED**
Established: 2026-11-10
Design references: user-provided Football Manager, Out of the Park Baseball, and hockey-management screenshots.
Target: commercial-quality desktop game at 1536×864 (also 1440×900 and 1280×800).

## Governing decision
A green build, responsive CSS, a screenshot artifact, or feature presence does not constitute visual approval.
**The actual rendered, playable screen is the deliverable.** A reviewer must reject weak iterations internally rather than asking the user to identify obvious dead space or repeat their references.
The current clean-sheet Management Studio V2 is a working development baseline, not an approved commercial UI.

## Recorded rejection of the first Management Studio V2 browser captures
Artifact: GitHub Desktop Visual Audit run 42944862098, `manager-v2/screenshots/`.
- People Profile: compact information only in the upper portion; the lower portion of the desktop workspace remains broadly empty. The role/professional information should be organized into a strong athlete/employee dossier that naturally occupies the screen without filler.
- Stable roster: eight listed horses and a generic Management Context column occupy only part of the workspace; the lower majority is dead area. Replace the generic context explanation with sourced, actionable racing operations, entries, assignments or other live data rather than padding.
- Racetracks: a very short table and generic context panel leave most of the page empty. Use legitimate track/racing information and appropriately sized layouts rather than a full-height blank surface.
- Horse Profile: the four-group attribute table is real and substantially closer, but the identity is underpowered compared with premium athlete profiles; source gaps in career, racing form and pedigree still require intentional presentation. Demo ratings must remain clearly fictional and never enter approved gameplay records.
- Directory/Search: compact roster direction is worth preserving; continue checking text legibility, sorting, owner identity, and opening actions.
- Racing Office: retain live decision actions and the reference-photo approach, but review the entire 1536×864 viewport for balance.

## Mandatory acceptance checks — every Tier 1 screen
1. **Side-by-side visual review.** Compare the fully rendered screenshot with the supplied FM/OOTP/hockey examples. Evaluate hierarchy, type scale, usable viewport, color restraint, identity art, table density, and integrated rather than card-like composition.
2. **No sprawling dead space.** Do not allow entire lower half-panels that say almost nothing. When data is genuinely missing, show a concise source-backed empty state in an appropriately sized region; never create fake records or scores to fill a rectangle. Solve layout issues structurally.
3. **First-screen completeness.** Core attributes, current assignments, status, reputation, organization and historical context belong on the primary Overview. Deep tabs only for genuinely additional content. Avoid forcing repeated clicking to understand an asset.
4. **Desktop legibility.** Check 1536×864 and 1280×800 in a real browser. Compact rows may not become unreadable microtext. Font sizes and the number of visible rows should be balanced, not optimized to maximize row count at all costs.
5. **A coherent application.** Use one shared design vocabulary across Racing Office, Search, Horse/People, Farms, Tracks, Sales, Calendar, History and other department pages. Do not build a new visual language for each page. Preserve original racing-specific brand assets and identity badges.
6. **Live functionality.** Back/forward, global search, profile links, roster actions, management choices, save/load/continue, and source-linked data must work in browser interactions, not just pass static string tests.
7. **Data discipline.** UI-only fictional previews may be used only if clearly marked and isolated from real saves. Missing canonical identity, reputation, career or race data must not be silently invented.
8. **No CSS patch stack.** Rebuild components in their authoritative source instead of writing trailing overrides. Maintain a single canonical Manager V2 stylesheet and preserve the original gameplay engine.
9. **Screenshot gate.** Render the entire route set. Reject and revise before seeking user approval if any high-priority screen fails the preceding checks. Keep screenshot-based review separate from code/unit test status.
10. **One approval package, not a stream of near-identical iterations.** Present a coherent set of polished screenshots and usable live links only after the material visual defects have been resolved. Do not label an intermediary build "finished".

## Release review record
Current result: **REJECTED** after inspecting real Desktop Visual Audit screenshots.
Unresolved material visual blockers: People, Stable, Racetracks, and other source-sparse departments require structural layout redesign.
No final sign-off recorded. Testing/deployment success must not override this status.


## Ongoing implementation checkpoint — November 11, 2026

**Release status: IN DEVELOPMENT — NOT FINAL VISUAL APPROVAL.** This checkpoint is for continuity across production windows, not a claim that every page meets the commercial-quality references.

- The clean-sheet `public/manager/` game shell is active. Existing Office game state and approved read-only geography are consumed without creating any parallel master record.
- All 16 Tier-1 routes render and pass desktop screenshot smoke tests. Functional browser navigation covers Search → Gabe Larkin → Racing → Finance → Office cash case → Back/Forward, source-track navigation, and exact immutable-ID historical person opening.
- The global Search table is dense and displays source identifiers for people and tracks, rather than a largely empty Owner column. Person-name links and last-column opening actions resolve the same immutable person ID.
- `public/data/person-geography-ui-v33.json` exposes 1,308 historical people; `public/data/track-geography-v33.json` exposes 134 track sites. Active Office roles remain distinct from historical biography/geography. No source-unknown person is silently assigned a gameplay role.
- Racecourse profiles with no source-linked active race records show a genuinely usable full 134-course register (current circuit first) rather than an enormous empty Stakes panel. Historical OPEN/CLOSED status is compact but keeps full raw source state in a tooltip.
- Racing World now has a 26-circuit navigation index sourced from the approved directory, instead of an empty lower-right panel.
- Stable roster shows horse-specific case/status and race target from the active Office state and fixture DOM. It does not borrow another horse's race target if no exact fixture is found. The compact stable staff panel links to the full Personnel directory.
- The portrait component now accepts approved photo pointers keyed by immutable entity ID or exact entity name from `public/assets/office/decision-photo-index.json`, while using clearly differentiated identity badges if no approved photo exists. Approved logos can be read from `organization-logo-index.json`; neither file creates entity records.
- **1280×800** is now an enforced desktop viewport. Actual browser geometry for Horse and People Overviews measured `scrollHeight=clientHeight=698` in both cases, with no document overflow. Four 1280 screenshots are captured alongside the 1536×864 suite.
- Unit tests and Cloudflare Pages checks pass for this implementation checkpoint. Passing geometry does **not** constitute artistic sign-off.

**Still open before release:** Profile-specific photography and organization logos are not available for all entities; source-backed racing performances, lineage, full facilities and owner assignments remain limited in the small Office window; the legacy History Vault still needs a consistent in-game management presentation and authoritative history-data connection. Do not fabricate records to fill visual gaps.

The next UI effort should attack the remaining sparse or legacy screens using reusable source-backed layouts, then compare real screenshots against the provided Football Manager/OOTP references before requesting user approval.

## Cross-screen visual-system pass — November 11, 2026

**Development checkpoint, not commercial sign-off.** The active presentation remains `public/manager/`, not the old Office stylesheet. This pass was performed across the game shell and screens rather than as isolated Horse Profile CSS edits.

- Rebuilt the **shared** Management Studio palette to neutral charcoal/slate surfaces and restrained racing-green/gold; changed the canonical panel-heading, roster/table, hover, selected/navigation, button, profile-identity and divider rules in place.
- All `compactTable` rosters now share one visible sortable-header implementation, with ascending/descending toggle, numeric-aware ordering, keyboard Enter/Space, `aria-sort` feedback, and **DOM-only** ordering that never alters the race databases or save state.
- Stable & Horses now uses a full-height, source-backed horse management dossier for each of the eight active records. Every horse can open its real profile and shows verified owner, current file, exact horse-specific fixture/target, and linked decision when present. No fixture or owner is inferred from another horse.
- The Stable operations sidebar retains six calendar entries, all **three** linked personnel rows (the initial design clipped the third; the final composition was visually inspected), and eight active case files. The final 1536×864 screenshot shows the full Stable roster and all three staff visible without scrolling their panel.
- The actual 16-route desktop Chromium audit passed, including **33 browser interaction steps** across Search → People → Stable → Racing → Finance → original Office decision → Back/Forward → native historical person profile. Source-backed readonly geography and data constraints remain unchanged.
- Screenshot authority: GitHub Actions Desktop Visual Audit run **43023910066**, artifact `wtw-fm-ootp-desktop-screens`, with 20 management screenshots including the 1280×800 checks. The screenshot is the acceptance evidence; test passes alone are not design sign-off.
- GitHub unit tests pass at the implementation checkpoint. **Cloudflare Pages has reported deploy failures** for these latest changes despite successful GitHub tests and screenshots. Do not claim the new UI is publicly deployed until Cloudflare confirms the actual successful build.
- **Unresolved:** The current Office window still has source-sparse horse pedigree, results and approved photography/owner identifiers; its rich recent-history presentation depends on the official data/historical authority. Some panels remain intentionally compact or source-empty rather than fabricated. The legacy History Vault still needs seamless native management presentation. Commercial UI sign-off is **NOT YET GRANTED**.

Keep all future styling changes inside the single canonical `public/manager/manager.css` ruleset. Do not restore older CSS layers or invent profile values to fill blank areas.
