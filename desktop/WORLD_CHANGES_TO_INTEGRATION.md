# V10 Saved-World Editor and Changes for Starting-World Review

This is one component of the **existing WIRE TO WIRE game**, not another world or parallel editor. It uses the official V10 300,000-horse saved career and permanent entity IDs.

## In-game player workflow

1. Open the official Windows portable EXE, let the V10 saved 1999 world load, and enter an actual player operation (such as Kingsmere Farm).
2. In **World**, open any horse, person, organization, or track. Select **EDIT THIS RECORD**.
3. Revise the display name or up to 800 characters of biography/editorial notes. Press **SAVE WORLD CHANGES**. The app commits the changed fields alongside that specific gameplay career run in the existing IndexedDB and verifies durable read-back before displaying a saved confirmation.
4. Close and reopen the game; use the same career. Edits are reapplied by exact original ID to the hydrated world. Advancing a day must retain the overlay.
5. Select **EXPORT WORLD CHANGES FOR CHATGPT** in World or the Career Manager. Upload the `WTW_WORLD_CHANGES_FOR_REVIEW_<date>.json` to the integration conversation. This contains only explicit changed field values, permanent IDs, world ID, seed, source snapshot SHA, run identity/date, and counts. It is **not a full game save** and does not include images.
6. Select **EXPORT SHARED CAREER** separately to back up game progression and customizations together.

## Protected rules

- Never mutate the base generated 300,000-horse world or the frozen engineering reference to satisfy an editor action.
- Only player-operation working careers accept edits; the untouched `canonicalRunId` baseline refuses modification.
- Rename consistency must reach active registered horses without overwriting registration receipts.
- Neither the current UI nor this overlay implements cash-backed ownership transfers, trainer contracts, physical barn changes, stud standing, pedigrees, race results, source dates or asset artwork. Those require separate transactional operations and source validation. **Do not mislabel a dossier edit as a completed transfer or rating change.**
- Uploaded JSON is a review request: source promotion is explicit, GitHub-reviewed and tested against the current generator. No automatic source edits, merges or releases.
- Existing saved careers with no `worldEdits` property remain loadable with an empty overlay.
- The current world authority SHA identifies the exact unedited source snapshot. Career edits are separate patches and must not be included in the snapshot fingerprint.
- Old V9 archived careers must not be silently interpreted as V10 nor merged into the current world.

## Release gate

Run the V10 World Editor integration tests, source Canon Desk, full 300k browser acceptance, desktop visual audit, actual Windows portable launch/reopen and installed-offline verification. Record failures explicitly and keep the code out of official main until passing, except an individually justified bounded failure with user approval. 
