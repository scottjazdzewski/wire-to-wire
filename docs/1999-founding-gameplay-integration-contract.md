# WIRE TO WIRE — Founding 1999 world to gameplay-engine handoff

**Date:** November 13, 2026  
**Website owner:** Office/FM UI and read-only founding source adapter  
**Gameplay owner:** The separate authoritative gameplay-engine window  
**Purpose:** Give the gameplay engine an exact, nonduplicated starting-world contract. This is **NOT** a second game-state database or a new simulation ruleset.

## Read these authoritative inputs

- `public/1999/engine/founding-world-1999.mjs` — projected founding organizations, people, connected breeding stock, 1999 locations and read API.
- `public/data/wtw-1999-founding-directory-v1.json` — flat initial world identity reference: **37 approved operations; 41 admitted named people; four unfilled principal slots; 55 protected broodmares; 18 protected stallions; ZERO live racing runners**.
- `public/1999/engine/founding-leadership-1999.mjs` / `docs/1999-founding-leadership-roster.md` — existing IDs and four currently pending name reviews; 33 primary principals approved or established. Game-world approval never means historical ownership proof.
- `public/1999/engine/founding-ancestry-1999.mjs` — read-only source-connected five-generation parent lookup.
- `public/1999/engine/founding-youngstock-candidates-1999.mjs` — **84 UNCOMMITTED** parent-linked 1997–98 youngstock *proposals*; no owner, breeder, foaling site, actual birth event, racing registration or name.
- `docs/1999-founding-population-and-integration-gates.md` — current reset status and pilot requirements.
- The game world's canon legacy horses, parent IDs, stakes results and entities must remain stable; only legitimately linked historical horses may inform new pedigrees.

## Strict data boundary

`H-FNEW-1997/1998-xxxx` is a **proposal ID only**, NOT an approved permanent Horse_ID or registered foal. An authoritative, accepted prestart-world birth record must assign an immutable new Horse_ID once; every future owner, breeder, race, breeding event, injury, and page must refer to it. No duplicate people, organizations, horses or horse-name table.

No source proves these proposed mares were actually mated to these stallions in 1996–97, that they foaled successfully, or that a 1999 standing/boarding farm was their earlier foaling site. These are fiction candidates; the game-origin authoring process must make those scenarios internally credible, without backdating them as certified historical events.

The live game must never reimport any of the 39 excluded B01-generated old racers, six old B01-only trainers, the old 3,308-owner finances, or an incidental subset of 325,000 synthetic horses. The Office also admits zero generated workers, zero training centers/breaking yards/track-created barns, zero auction catalogs and zero inherited logos. The 30 founding Facilities records are *institution references*, not invented physical property; track data and historical archives are unchanged. The full generator may remain as an explicit engineering performance benchmark, not as 1999 game content.

## Required authoring transaction before a candidate enters game world

Each accepted new-fiction 1999 horse must have:

| Field | Requirement |
|---|---|
| `horse_id` | New immutable game-owned ID, never reused |
| `foaling_year`, `birth_location_id` | Specific plausible prestart event and actual location |
| `sex` | Fixed at creation; use age appropriate to Jan 1 1999 |
| `sire_id`, `dam_id` | Existing source breeder or accepted new founder horse IDs; check sire age, dam age, lineage and relatives |
| `breeder_organization_id` | Accepted breeder identity or explicitly scoped person, separate from current farm |
| `ownership_events` | Original owner and any legitimate transfer chain; owner on Jan 1 1999 must resolve exactly |
| `current_residence_id` | Foaling and CURRENT location distinct; correct farm vs race barn, city/state/country |
| `trainer_id` | One current trainer if entering training; may legitimately be null for a yearling in farm care |
| `current_racing_barn_id` | Required only if horse is race-training; no ghost trainer or barn employment |
| `registered_name` | **NULL** for unnamed non-race-ready horse; unique registered name granted only via certified race-ready/first-entry registration event |
| `attributes` | Engine-authored realistic age-based current/potential and all role/horse traits; UI consumes, never re-scores |
| `game_status` | Precise racing/farm/training/health state. No fictional 1999 race result or forced winner |

Only the gameplay engine may commit these records, contracts, owner-cash postings, breeding fees, sales, race payouts and date progression. The Office UI will read these records using canonical IDs once released. Current leader/person IDs and approved investor roles are preserved by the versioned read-only founding directory. Magic Johnson is a major **non-operating investor** at Ledbetter Calder, not its manager; Julian Voss directs Argosy Bloodstock, distinct from Argosy Racing Partners and its data-first financial partners.

## Pilot completion requirements

1. Exactly 37 intended founder organizations (until user approves additional entities); 33 primary principals accepted/established, four principal IDs explicitly NULL pending individual approval. Documents retain candidate names; no unapproved name may become a game entity.
2. Each of the selected racing organizations has a credible owned runner string, while pure stud/farm operations may be principally breeding/boarding operations.
3. A small first pilot offers a representative field of eligible horses across real Jan/Feb 1999 meets, with plausible geographic spacing and trainer decisions.
4. Every playable horse has complete lineage and ownership; every lineage parent lookup is read-only as appropriate for historical animals.
5. Stallion residence, standing book, broodmare residence, mating result, farm upkeep and boarding fees originate from engine events, not UI-generated fake transactions.
6. Jockey availability, fatigue, schedule and contracts are consistent. No grooms or exercise riders on player-facing personnel.
7. Every transaction posts against balanced new founder accounts; no inherited old cash. Save/reload and player/AI outcome parity tests pass.
8. Once approved, publish a **versioned engine release** to the designated gameplay Drive workspace and a contract manifest: exact seed version, immutable IDs, world counts, schema version and SHA-256; Office UI integrates it WITHOUT redesigning its approved screens.
9. Before scaling beyond the pilot, verify changing one live horse or principal updates the same exact-ID profile in Stable, World, Breeding, Entries, Racecards, Financial Ledger and logo index.

## UI acceptance tests / notes

- Main founding browser and source suite at November 13 checkpoint: 67/67 source checks and full 314/314 Node tests passed; latest browser smoke passed the complete old Office UI navigation for 73 source-stock animals with zero race-ready runners.
- Legacy training smoke expecting a named owned horse is intentionally not a gameplay certification for this empty scenario. It can meaningfully run again after newly approved, named, owned runners exist; do not manufacture a horse solely to turn the test green.
- User-approved logo and farm auras are in the existing World Bible and logo-designer brief; they belong to organization ID, never to a new duplicate owner row.

**World Bible:** https://docs.google.com/document/d/1zBmtdFenkeP70odONetitXFcruPc0qwt485JAR8lDDs/edit  
**Logo designer handoff:** https://docs.google.com/document/d/1tA-4NLG7QoZ4qhugnku40QkV_PsvuWP1tAO81jze0z8/edit
