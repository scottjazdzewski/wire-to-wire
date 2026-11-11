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
