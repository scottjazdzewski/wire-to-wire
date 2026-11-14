# WIRE TO WIRE — PRODUCT-WIDE SOFTWARE RELEASE CONTRACT
Effective: November 14, 2026. Applies to EVERY engineering window, every file, branch, PR and release in this repository.

**This is a commercial software product, not a series of separate chat mockups.** Work must preserve what has already been approved and the one real saveable management game.

## Universal rule: nothing solved gets silently undone

1. Start from the newest `main` and use a small, isolated branch. Recheck main and retest before merging; other windows are working concurrently.
2. Approved screens, controls, layouts, badges, logos, trophies, colors, names, dates, identity links, source data, historical records, saved-game behavior and player commands are contracts. Changing an approved behavior requires a specifically reviewed replacement. Bug fixes must add regression tests.
3. There is ONE playable management interface under `/next/`: one global rail, date/Continue/Save controls, shared route/history, rosters, sorting/filtering, profiles and shell. Retired Office/Manager layouts may not return. A hidden legacy data bridge is not a second presentation layer.
4. Historical source identity and the clean January 1999 founding world are protected. The provisional 38-horse game test is isolated, not a legitimate replacement population. Never invent source pedigree, racing outcomes, money or personnel connections to fill UI gaps.
5. Gameplay and save authority are single-writer: durable game clock, actions, decisions, transactions, races, finance and journal; UI reads authorized projections and submits approved commands. Save errors must fail closed, not reset the career.
6. **Every shipped visual asset is byte-locked** in `ops/approved-visual-assets.lock.json`, including logos, trophies, hero art, badges and flags. Additions, replacements or removals must be explicit in a PR, with approval of the actual art and exact entity identity. Editing the lock file is not itself approval.
7. Every pull request, whether art, naming, geography, history, racing, facilities or UI, must run product-wide invariant checks. Test failures block release. Keep separate real Chromium checks and screenshots for visible UI.
8. Compare affected screens against previously approved actual browser rendering at desktop and laptop widths. Passing unit tests is not visual approval. No clipping, wrong logo, missing stake races, prototype panels, hidden controls or changing navigation conventions.
9. Preserve saved careers and source IDs across updates. New schemas require explicit tested migrations, backup/recovery and old-version reopen tests before release. Never silently coerce a damaged or incompatible save.
10. Record actual checks, evidence, commit, approval, failures and rollback point. Never merge on pending tests or claim a test cohort is production-certified.

## New automatic release gate

`.github/workflows/product-release-integrity.yml` runs on EVERY PR (no changed-path filter), on every main push, by manual dispatch and weekly. It verifies:
- Every `public/assets` image file path and Git-blob content hash against the complete lock (383 images at first baseline);
- Single visible current UI, retired UI absent, stable approved Track/Stakes/History, exact immutable organization-logo identity, source and browser save parity;
- 10,000 deterministic kernel serialize/reopen cycles: exact save bytes, date, run ID, revision and journal; corruption rejected;
- Actual Chromium process close/relaunch against the SAME IndexedDB-backed career and browser profile (3 processes in regular CI; 12 in weekly/manual certification), comparing exact saved SHA-256, identities, money, roster and rendered UI shell;
- Existing UI, art, source and gameplay tests and browser module parity. Existing `npm test`, management-browser smoke and screenshot workflows remain mandatory.

**Do not describe kernel roundtrips as 10,000 real app launches.** Neither test proves zero future bugs. Before public sale, extend the matrix to long-session and 10,000 actual launch endurance, interrupted writes, OS crashes, backup/restore, disk quota, version migrations, platform combinations, network loss and recovery drills. Confirm real release builds, not just a test fixture.

## Authority and safeguards

- UI workstream: maintain approved shared UI, not revise engine outcomes.
- Logo/art workstream: use exact immutable entity IDs and reviewed files; update visual lock deliberately.
- History/naming/geography workstreams: preserve canonical source provenance, IDs and linked facts.
- Gameplay workstream: sole transactional logic for actions, outcomes, finances, simulation and saves.
- Cross-domain changes must pass all affected contracts, not just the local workstream's tests.

Existing current documents remain authoritative: `docs/design/WTW_UNIFIED_SCREEN_INTERACTION_LOCK_2026-11-13.md` and `docs/design/WTW_TRACK_PROFILE_PERMANENT_LOCK_2026-11-14.md`. Obsolete documents or archived HTML are never licenses to resurrect legacy UI.

## Important operational gap

On November 14, 2026, `main` was reported by GitHub as **unprotected**. Running required-check workflows exposes failures, but does not prevent a person with write rights from merging/pushing despite red checks. Before commercial release an administrator must enable branch rulesets: required status checks, no direct main pushes, pull requests and review for approved-UI/asset changes. This gate does not claim those repository settings have been changed.
