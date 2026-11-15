# WTW V487 — offline foaling-name editorial screening and reservation safety

**Workstream:** Horse naming. **Baseline main at branch creation:** `aedd94673c9e0667c660c979032ec8c8ecd03132`.

## Scope and live owner
- The one existing `src/game/horse-naming-local-v485.js` source and its exact browser-game mirror remain the ONLY local name writer; the existing Naming Desk is unchanged.
- V485 response schema is unchanged. New deterministic algorithm revision: `WTW_LOCAL_NAMING_RULES_V487`; pin revision when the gameplay/save workstream persists generated names.
- This PR changes only future local foal naming and tests; it does not insert horses, alter canonical historical identities, alter pedigree, write to registry/game/save, or create an alternative UI, model provider or desktop shell.

## Specific defect removed
In V486, the local foaling path retained the first two apparently distinct authored suggestions **before** applying `auditPopulationNamingResults`. An owner-reviewed/rejected or otherwise editorial-held name could consume one of those two slots, be added to `nextRecentNames`, and appear in `newCandidateNameKeys` even though the independent audit held it. Later authored and valid alternatives were never considered.

V487 obtains the full deterministic story-backed authored pool, skips names already in the complete caller-provided registry, applies the existing independent source/owner-reviewed-name audit across the remaining alternatives, then selects at most two **READY_FOR_INDEPENDENT_EDITOR** candidates per foal. Only these final audited candidates are returned as the reservation-key delta. Failure to find any qualifying names produces an explicit held foal, not a fabricated or auto-registered name.

## Desktop, save and network contract
- **Fully local:** pure deterministic JS, supplied actual foaling-event narrative, existing 520 previously reviewed-name exclusions, full external caller-supplied issued/reserved names; no AI, Worker/D1, HTTP, credentials or inference.
- **Registry integration still required:** the gameplay/save authority must atomically persist the global issued/pending name keys and the pinned algorithm revision between cohorts and across quit/reopen. The last 60 recent names are a style/fatigue window, not a duplicate-proof ledger.
- **Saves:** no existing save/portable `.wtwsave` schema change; no state writes. No migration was attempted. Names already registered in saved careers must never be regenerated because the algorithm revision changes.
- **Capacity/quality:** a finite authored catalogue cannot be certified for 55,000 unique names per year or 1999–2099 population scale. Name suitability/90% owner acceptance remains unproven. Holds remain intentional.
- **Desktop milestone status:** **NOT YET DESKTOP CERTIFIED** until the installed Windows EXE is actually tested offline for name generation, save/reopen and cumulative registry behavior.

## Verification, regression, rollback
- Dedicated V487 tests verify alternative fallback after first suggestions are pre-reserved; all reservation keys correspond exactly to final editorial-ready proposals; reviewed-name exclusion; duplicate-free two-foal cohorts; deterministic browser/source parity; no network calls; and complete hold when catalogue is exhausted.
- Run existing V486 and older naming tests plus product-wide tests and GitHub workflows; inspect CI before merging.
- Rollback is to revert the isolated V487 PR after accounting for other merged work; historical data, saves, UI, artwork and their locks are untouched.
