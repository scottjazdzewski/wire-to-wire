# WIRE TO WIRE — Offline 1999 Horse-Specific Race Placement Advice

## Scope

This **read-only** gameplay module ranks actual locally simulated 1999 horse-racing opportunities for an owner without creating a second race engine, making an entry, spending funds or inventing a finish. It is built on top of the existing `get1999HorseRaceOpportunities` and `quote1999PlayerRacePlan` selectors, the real saved horse fitness and condition record, and the existing postrace trainer campaign plan.

### Existing race and horse facts it uses

- The horse's actual registered permanent ID, current trainer and player-controlled owner; current fitness, fatigue, readiness and modeled workload risk from funded training; source-specific surface and distance aptitudes.
- Source-conditioned **opened game races**, actual surface/distance/age/class, saved runners and their existing modeled current ability, and realistic physical location.
- Existing postrace trainer return date, preferred surface/distance and proposed class, when that horse has completed a real race. An owner may still choose an alternative when allowed, but the trainer warns against premature return.
- Actual available jockeys, staffed receiving barns and shipping feasibility; for each promising source-open race, the original `quote1999PlayerRacePlan` computes precisely whether the owner can currently confirm the race and what the immediate charge is. No separate fee calculator or fictional odds exists.
- Unopened source condition-book proposals retain a distinct `PROPOSAL_NOT_OPEN` tier, with no confirmable jockey or implied booked horse.

A documented bounded `suitability_index` allows players to rank currently eligible options, but it is **not a win probability** or a commitment. The recommendation distinguishes the exact `can_confirm_now` from the trainer's `trainer_recommends_entry` based on fitness, workload risk, actual modeled return date and race match. Any `actionable_plan` contains the *real* exact horse, open race, jockey and receiving site IDs with the existing current game revision and maximum authorized immediate price. The only writer remains the canonical `CONFIRM_1999_RACE_PLAN` command; no duplicate entry logic.

The approved management UI remains unchanged. The existing locally executing career service adds a thin `getRacePlacementAdvice(horseId,opts)` read selector for future Personnel/Horse/Race views owned by the UI workstream. No new layout, CSS, page or parallel simulation.

## Desktop compatibility assessment

- **Local runtime and data:** one local JavaScript engine, locally bundled 1999 game source identities, source-conditioned future race generator, actual saved horses/jockeys/physical barns, actual training and current ledger; deterministic game model and no required web calls.
- **Save compatibility:** this milestone is read-only and writes **zero new save fields**. Existing portable `.wtwsave`, owner cash/horse identities, race results, trainer policies and idempotent command journal remain unchanged. Even its executable quote cannot write without an explicit player-authorized command through the unchanged engine. Existing older saves remain valid and have no new migration needed for this selector.
- **Network dependencies:** **none introduced.** No Cloudflare, D1, internet, hosted sign-in, third-party data service, external AI or remote race predictor. The current browser smoke adapter still uses its inherited local JSON path and IndexedDB; those are not dependencies added by this gameplay feature.
- **What remains for desktop migration:** dedicated desktop workstream still owns bundled content certification, Windows application-data saves and backups, IndexedDB-to-local/portable import, offline signed installer, installed reboot/upgrade testing and full source-backed historical archive migration. No launcher, `desktop/` or artwork is modified.
- **Actually tested:** pure selector stability and permission boundaries, consistency with actual race booking quote/command, real jockey and optional physical destination IDs, no fake enterable proposed race, high-risk trainer warnings and saved career roundtrip. Existing source/browser mirror parity, full Node suite, source/Chromium and desktop build workflows remain required merge gates.
- **Status: NOT YET DESKTOP CERTIFIED** unless the dedicated release process separately verifies a fully installed, network-disconnected Windows EXE including actual career start, local save, close/reopen and installer upgrade. A packaged unsigned EXE or Chromium test does not establish that.

## Rollback and next step

Revert this read-only module, engine export, browser mirror/service and test/documentation; no game save or race record needs editing. After this, the next meaningful race milestone is to make actual AI trainers use analogous field-aware pace/tactics instructions while preserving exact source and saved race validity. Do not replace the original racing simulator.
