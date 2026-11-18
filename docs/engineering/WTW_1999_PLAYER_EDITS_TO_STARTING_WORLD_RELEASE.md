# WIRE TO WIRE — Player World Changes Into the Official 1999 Starting Release

## This is an ACTUAL release-source workflow

An exported `WTW_WORLD_EDIT_REVIEW_V1` JSON is **not** by itself part of the game. The integration manager must receive the exported JSON, validate and approve it, convert the supported edits to a versioned source-release pack, test that pack against the genuine 300,000-horse generator, merge the source PR, and ship a new Windows EXE. Only then are the promoted changes defaults for newly created 1999 careers.

### What the player does

1. Open the V10 playable game, choose an actual working career, and edit a horse/person/organization/track using **Edit This Record**.
2. Save the career. In World or the Career Manager, click **Export World Changes for ChatGPT**.
3. Upload that JSON to the WIRE TO WIRE integration conversation, stating that those exported changes are approved for the next **1999 starting-world release**.
4. **Back up the complete career separately** using Export Shared Career. The review JSON is only your changes, not your game save.

### What integration does (not optional)

1. Validate `source.worldId`, seed, 300,000-census and original source snapshot SHA. Match entity IDs to the *actual generated world*. Never use a fuzzy horse/owner name match or 73-record research index.
2. Run `npm run world:promote:1999 -- /path/to/WTW_WORLD_CHANGES_FOR_REVIEW.json --dry-run` for a summary, and assess duplicate names, histories and identity references. The compiler refuses exports from a different seed or world fingerprint.
3. Approve metadata changes explicitly with `npm run world:promote:1999 -- /path/to/WTW_WORLD_CHANGES_FOR_REVIEW.json --approve`. This updates `public/1999/engine/approved-1999-world-release-data.mjs`, a source-controlled reviewable pack. Any structural `reviewNotes` are tracked separately in `data/1999-world-structural-requests-pending.json`; they do NOT pretend to change ownership, racing ratings or finances.
4. The official 1999 generator checks the approved pack and chooses a distinct immutable world ID with suffix `-RELEASE-R<source-hash>`. It applies validated name/biography changes **before saving the actual horse/person/farm/track batches and source snapshot**, so new careers show the released records. It fails generation if an exported ID is missing or a new name collides with an existing entity.
5. Review the generated records, the real Kingsmere stable (not just the founding source list), and the saved relationships. Run the unit/Canon Desk, full-world Chromium save/reopen, Windows portable/installer offline and UI checks. Merge the changes into `main` and publish a NEW official release EXE from that merge.
6. Only then tell the player that the 1999 release contains the changes. Never call a draft pack or the user's local career overlay a shipped starting-world change.

### Important protections

- Existing `WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H300000` world files, frozen May 29 reference and player saves remain unmodified, because a newly approved source pack creates a NEW world ID.
- Initially the approved pack has zero records. Until the player uploads an actual export and the integration manager approves it, no game defaults have changed.
- Approved text changes: `name`, `biography`; IDs and existing relationships are immutable.
- Structural requests: ownership transfers, trainers, physical care/barn placements, staffing, horse ratings, pedigrees and finances. They require engine, ledger and roster changes in a separate verified source PR; they cannot be automatically applied from a text note. Do not silently ignore these requests—report them.
- The existing packaged engineering-career file can continue to open its frozen V10 world. To ship a new 1999 *default starting world*, regenerate the bundled starting-world snapshot from the newly approved release ID as part of the final release packaging. The source pack and generator alone do **not** change an already bundled legacy career.
- Edits remain independent from game-day progression and from other careers. A source pack is a baseline for **new** careers only, never an automatic migration of existing saves.

### Release evidence

Record the count and immutable IDs of promoted records, any pending structural changes, approved pack revision, chosen new worldId, source snapshot SHA, actual new-world census, functional Kingsmere profiles and QA screenshot, plus the official Windows EXE release tag and GitHub commit.
