# WIRE TO WIRE — FICTIONAL WORLD GENESIS AND PERMANENT PLAYER CUSTOMIZATION CONTRACT
**Owner decision: November 14, 2026. Applies to all active game, history, naming, gameplay, UI, data and desktop windows.**

## Product identity — confirmed

**The first commercial Wire to Wire release uses a fully populated fictional thoroughbred racing universe with convincing, internally consistent fictional history.** Re-creating or importing **real racing history is NOT required**. Do not mix authentic real racing results, identities and lineages into the default fictional universe. An opt-in real-history module is a possible far-future expansion only, not a blocker for a complete enjoyable fictional game.

Previously built real-history research datasets, IDs, sources, modules and existing saves must not be erased or broken as an incidental side effect. Keep them isolated from the shipped fictional foundation; migrate consumers deliberately and test old-save compatibility. Do not misrepresent generated fictional outcomes as authenticated history.

The owner prioritizes shipping and iterating on an enjoyable, coherent product over guaranteeing high sales or endlessly adding scope. **Finish the first complete and playable January 1999 fictional racing season**, preserving one authoritative engine and one approved management UI.

## Mandatory New Career / Create World function

From **Save / Load**, offer **New Career / Start from Scratch**. In the first integrated version, one button creates and saves the entire selected *active* fictional racing world before the player enters the world, with scalable presets and measurable resource requirements. Next extend to different supported start years and custom geography/world size.

World creation must generate:
- All selected region/track/race-calendar/stakes/purse and historical-fictional record structures;
- A full participating horse population with valid age cohorts, persistent pedigrees and unique identity;
- The farms, stud farms, owners, racing stables, trainers, jockeys, breeders, staff and their relationship/financial state;
- Prior fictional champions, iconic races, historical track records, plausible dynasties and established regional rivalries;
- Consistent employment, ownership, stable placement, foaling, geography/travel, schedule/entry and economic/simulation links.

**Every created entity must be queryable and usable by gameplay at genesis.** Fast indexed/demand-paged *reads* are allowed; only displaying the directories as large while the simulation operates a small legacy test pool is prohibited. A generated-world commit is atomic and resumable or safely fail-closed, and an existing career is never overwritten.

Maintain stable immutable IDs, seed, frozen generator revision, world profile and complete source/generator manifest. Never recalculate past race results or overwrite permanent history when the generator changes. Results and lived outcomes belong in the exact durable career ledger.

## Mandatory edits, replacement photos and logos

Every generated profile must offer a consistent supported **Edit / Save** path. The player can change an entity's display name, allowable biographical/gameplay fields and relationships. This must affect the actual engine's identity-linked world state and all linked profiles and results, not only one front-end text string.

Player may upload new photos, portraits and organizational/track/stable logos. Store safely by immutable entity ID with a validated, private local media library, never in the application installation folder or portable extraction directory. An uploaded player image takes precedence over the bundled/default artwork across every relevant display. Name/photo/logo edits survive future game dates, save/load, program restarts, generator changes, installation upgrades and exported/imported backup saves. An official asset update may never silently erase or replace them.

Use an ordered resolution layer: **player career overrides > explicitly adopted player world template > frozen generated base**. History and finance/event commits remain the authoritative source for gameplay mutations, and edits must not silently rewrite committed race outcomes or sire/dam lineage relations. Validate all changes and commit them transactionally, with restore-original and an edit audit trail.

Default override scope is **the active career**; reusable world templates or user asset libraries must require explicit save/export/import/adopt actions. Worlds are isolated; no surprises between unrelated careers.

## Integration and rollout rules

1. Preserve the already working portable Windows EXE, desktop launch, UI and existing saved-game reopen behavior.
2. Make fictional genesis and its entire world consistent with the **real simulation**; don't prematurely count directory rows as operational racing population.
3. Finish a playable 1999 career season with durable results and plausible fictional prehistory, then broaden arbitrary start years and scale.
4. Implement true per-user desktop-owned transactional save and media storage plus lossless `.wtwsave` backup/import/export. Existing IndexedDB/localStorage edits are transitional, not product completion.
5. Make user customizations permanent and source-of-truth for any supported editable field. All subsequent generated entities and AI decisions must honor stable identities and allowed overrides. Never overwrite edits during routine generation.
6. Keep the program playable offline after installation. No external AI/API or web access needed for names, population, art or edits.
7. Commercial distribution only after signed installer, recovery/migration, full season gameplay and multi-year quality tests. No required authenticated race-history database for first release.

## Acceptance tests (actual Windows portable EXE + installer)

- Generate two distinct fictional 1999 worlds (different seeds/sizes), inspect entire industry and plausible invented history; verify race scheduler/AI/breeding/finances use the same world populations that directories show.
- Rename a horse and trainer, change an owner/stable association, upload a horse picture and farm logo. Save and observe their values *immediately* in every indexed, linked and simulated screen.
- Play race days through the end of a season; check winners, purses, stakes, breeding, finances, titles, foaling, identity histories and named records for consistent results.
- Exit, relaunch, upgrade, export/import, move saved world to another Windows computer; verify exact same records, images, assets, results and relationships.
- Create a second career: no leakage of first-career edits. Use an explicitly exported custom world template in a third career and confirm only chosen customizations apply.
- Force close during save, corrupt an input or exceed a resource limit: no destructive reset or partially rewritten world.
- Show real progress and bounded CPU/RAM/disk while generating full worlds; index and page read operations without inventing members later.

## Where this applies

- **Issue #185:** whole fictional world generation and believable fictional past.
- **Issue #189:** durable in-game create/edit/name/photo/logo customization.
- **AGENTS.md and product-wide release rules** take this direction as the default for every workstream.
- Previous historical-source contracts apply only to preserved **legacy research/optional future real-history material**, not as launch requirements for the fictional player world.

**Current status: this document defines requirements; no one-button complete world generation, universal editor, custom-media portability, or full commercial certification is being claimed as already implemented.**
