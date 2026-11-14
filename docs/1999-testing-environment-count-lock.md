# WIRE TO WIRE — JANUARY 1999 TEST ENVIRONMENT COUNT LOCK

**Checked:** 2026-11-13. **Status:** engineering count contract; not authority to seed animals.
**Superseding gameplay authority:** [FOUNDING_1999_SINGLE_SOURCE_HANDOFF_CURRENT.md](FOUNDING_1999_SINGLE_SOURCE_HANDOFF_CURRENT.md).
**Existing implementation:** `gameplay/1999-horse-registration-gate` (registration still requires a real accepted naming release and valid physical home).

## Three distinct populations — never merge

1. **Immutable founding source, January 1 1999:** **ZERO registered racehorses**, **ZERO physical barns**, **ZERO active entries**, **ZERO automatically generated professionals**, **ZERO opening operating balances**. The source may contain 73 protected *breeding* animal identities; none become registered racing entrants by implication.
2. **Initial live gameplay pilot:** source handoff authorizes **24–40 candidate names** as a *review staging range*, **not an admitted count**. First race aims at approximately **8–12 eligible starters**. The first *exact* registered count is the number of accepted names passing the explicit registered-horse manifest, owner, trainer, facility, pedigree and receipt gates. No automatic population. Number of staffed physical barns is the **minimum needed based on actual authorized stall assignments**, not a hardcoded 4, 6, 28 or 37. Pilot starters and barns remain **unlocked pending an accepted manifest and valid facilities**.
3. **Separate engineering-scale benchmark:** **5,000 fictional horses** is the previously user-fixed 30-day campaign *test scale*, not the clean January 1999 founding roster, not a registration authorization and not a pre-existing save. This benchmark must be generated in an isolated fixture and never silently imported into a playable clean career. Former 87,500/325,000 synthetic worlds and 400-unapproved-runner experiments are superseded.

## Verified founding-source counts (read from versioned source files)

| Measurement | Count | Exact source / interpretation |
|---|---:|---|
| Founding organizations | 37 | `public/data/wtw-1999-founding-directory-v1.json` |
| Founding people | 41 | Same founding directory; **not all employed staff** |
| User-selected jockey identity pilot | 26 | `public/data/wtw-1999-jockey-pilot-v1.json`; no accepted mounts/contracts yet |
| Existing-ID trainer identity pilot | 20 | `public/data/wtw-1999-trainer-pilot-v1.json`; no active contracts yet |
| Protected living breeding animals | 73 | 18 stallions + 55 broodmares in founding directory |
| Registered opening racing horses | **0** | Founding directory `counts.openingHorses` |
| Institutional facility references | 30 | 5 stud operations + 15 farms + 10 racing stables. References are **not buildings** |
| Registered physical barns | **0** | Founding directory `counts.approvedOpeningPhysicalFacilities` |
| Founding directory operating tracks | 102 | `public/data/wtw-1999-founding-directory-v1.json` `tracks.length` |
| Broader track directory | 118 | Current gameplay handoff: includes 16 closed historical tracks; never schedule a 1999 meet there |
| Active auctions and race entries | **0** | Current founding handoff |

**Facility vocabulary:** Barn is a physical racing-stable residence, **not a separate top-level facility type**. Farms and stud farms remain distinct. Facility references do not create stall capacity.

## Binding test checkpoints

- Opening snapshot validation must keep exact zero-racer/zero-property regression.
- The first career registration manifest must contain every explicitly accepted `horse_id` and `name_release_id`; its exact count supersedes the 24–40 *candidate estimate*, not the source opening.
- All registered training horses must resolve to an actual available, staffed site with a valid owner/trainer; zero invented sites or employees.
- One real first-race field (target 8–12) must pass eligibility, rider availability, deterministic settlement, ledger reconciliation and save/reload **before** expanding to a complete card.
- The 5,000-horse benchmark must be isolated, opt-in, reproducible and never shipped as default game content.
- **No claims of completed playable test** until end-to-end execution and saved second-day continuation pass.

## Non-authorization

This contract locks **verified existing counts** and preserves the previously selected **5,000-horse isolated benchmark**. It deliberately does **not** lock a fabricated number of barn properties, accepted names, contracts or fully race-ready horses before those entities exist. No cohort or property is added to the gameplay registry by writing this file.
