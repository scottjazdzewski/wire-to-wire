# WTW V486 — desktop/offline horse naming compatibility note

**Ownership:** Horse naming engineering, not the Windows packaging workstream. Starting development base: `7f1442f4479fee6f37332d6f0a7ffa683361ae51`.

## What is local and unchanged
- The live, shared naming writer still lives in `src/game/horse-naming-local-v485.js` and its byte-identical browser game mirror. The existing `public/next/` Naming Desk remains the only on-screen UI; no second interface, internet route, Cloudflare requirement, AI runtime, or desktop launcher.
- Candidate generation is deterministic for the same foal/owner/story/attempt. **Algorithm revision `WTW_LOCAL_NAMING_RULES_V486`** is returned with proposed names, while the existing V485 wire schema is not changed. This helps a future save-authority record the exact naming generation revision; it does not yet persist that revision to a saved career.
- The shared name-screen, protected historic names, previous 520 owner-reviewed names, independent editorial gate, and owner authorization gate remain unchanged. No new horse identity, pedigree, history, artwork, or game transaction is created.
- The local foal cohort generator returns full **new candidate reservation keys** and explicit `exhaustedFoals` holds. A short recent-word window is **not** a permanent uniqueness registry. Future active foaling must reserve names in a durable, versioned local world/career registry before accepting a later batch.

## What was corrected
- Previously the single-horse generator scanned only the first eight authored alternatives, potentially holding a horse even if valid later alternatives existed. V486 screens successive pages of eight using the exact existing editorial gate, then returns up to eight screened results.
- Requests for 16 suggestions through the eight-item single-horse editorial screen now fail explicitly instead of silently returning fewer.
- Removed a stale Naming Desk statement that AI calls are budget-limited. The desk accurately states the 55,000/year aspiration is **not certified**; source-limited foals remain held rather than being assigned arbitrary filler.

## Migration and limitations
- **Save format:** unchanged. There is currently no live save migration for naming candidates. The desktop save-authority workstream must eventually persist the pinned naming revision, globally reserved-name ledger, owner decisions, and registration releases through its single-writer game commands and portable `.wtwsave` format.
- **Catalog capacity:** finite authored names with meaning tied to the story. Actual high-volume originality and 90% owner approval have not been established. Holds are correct behavior when unique names run out.
- **Offline desktop:** all modified naming logic runs in-process with no network calls; the separate Windows shell, local history pack, installed app-data saves and installer remain other workstreams' responsibilities.

## Verification gate
- Targeted V486 tests: fallback name screening, pinned revision and source/browser parity, multi-cohort reservation continuity, zero-network behavior, correct hold on exhaustion, unchanged game records.
- Repository CI: run all required GitHub checks; do not merge on failures or while pending.
- Windows packaged EXE install/launch/airplane-mode/save/exit/reopen: **NOT YET DESKTOP CERTIFIED**. Browser tests are not proof of an installed Windows game.

## Rollback
- Revert this feature PR only after preserving current main and any newer naming changes. No data migration or save mutation occurs in this revision.
