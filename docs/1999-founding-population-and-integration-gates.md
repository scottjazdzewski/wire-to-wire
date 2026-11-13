# WIRE TO WIRE — Clean founding world: January 1, 1999

**Last code checkpoint:** November 13, 2026  
**Repository:** `scottjazdzewski/wire-to-wire`  
**Scenario:** `FOUNDING_1999`  
**Ownership:** Website/Office UI and its connected read-only world projection. Gameplay rules, payouts, economy, save semantics and AI simulation belong to the separate gameplay-engine window.

## Nonnegotiable reset rule

The new 1999 starting world is built only around the 37 founder-selected operations and their specifically connected historical animals. The 325,000-horse synthetic world, 3,308 generic owners, previous demo state and 39 B01-generated opening runners are NOT available as new-game participants. Historical horses, parent nodes, stakes results and source information remain immutable *archival reference material*, not playable 1999 race entries. Do not silently restore old test records to make the Stable screen look full.

The previously selected 39 B01 runners all have the boundary `B01_APPROVED_1999_GENERATED_OPENING__NOT_1998_RACER`. They were retired from the founding projection on November 13. Their source records remain outside the starting world for integrity and troubleshooting only. Six former trainers employed only by those B01 horses were also excluded from the active people directory.

## Verified founding-world opening inventory

| Component | Current clean state | Authority boundary |
|---|---:|---|
| Founding organizations | 37 | 23 established IDs, 14 scenario-only provisional |
| Organization principals | 33 accepted/established, four empty | Unapproved replacements live ONLY in offline proposal docs, not playable people or principal displays |
| Named source + game-world people | 41 | Existing approved principals, secondary directors and Magic Johnson as non-operating investor; no pending identities |
| Generated professional candidates in playable world | 0 | 68 former unit-test fixtures remain isolated in offline code only; no employment or payroll |
| Total people exposed | 41 | No generated staff, no nonapproved person identities |
| Verified playable racing horses | **0** | No B01 racers carried forward; no new registrations certified |
| Founding Facilities organization references | **30** | Five studs, 15 farms, 10 racing-stable institutions. No facility assets, capacities, staff or costs inferred |
| Training centers / breaking facilities / phantom barns | **0 / 0 / 0** | Track inventory does not spawn facilities |
| Activated sales catalogs | **0** | Prior 12 placeholder catalogs absent |
| Approved logos loaded | **0** | 37 ID-specific slots in a new manifest; old 108-logo roster excluded |
| Connected standing stallions | 18 | Existing source IDs and 1999 farms only |
| Connected broodmares | 55 | Existing source IDs and 1999 farm/boarding references only |
| Total living animals in active World | **73** | 18 stallions + 55 mares, no other source horses |
| Retired opening B01 racers | 39 | Quarantined, not playable |
| Proposed 1997–98 youngstock | **84** | 41 born 1997, 43 born 1998, all **read-only**, no registered name, owner, transaction or historical foaling claim |
| Historic horse–organization associations | 67 records / 61 horses | Read-only historical ancestry; do not infer breeder vs owner roles from yearbook summaries |
| Known geographical track references | 102 | Not 102 active simultaneous race meets |
| Certified opening cash, expenses and owner payouts | **None** | Only the gameplay engine can approve opening ledgers |

**Important:** There is currently no meaningful playable racing competition. This state is *correctly reset* but **not finished**.

### Names and ancestry

The independent WTW horse-name research v4.46 is explicitly **NOT DEPLOYED** and is not an approved production registration engine. A race-ready horse must be given a unique, registered name by a game-authoritative registration transaction. Unnamed 1997–98 new-fiction juveniles/yearlings should remain `registeredName:null` and may display pedigree-based labels, not pretend-registered names.

`public/1999/engine/founding-youngstock-candidates-1999.mjs` produces deterministic, individually ID'd prestart *proposals* using only the source stallions and mares. It does **not** prove breeding or foaling actually happened in those years. The 1999 residence of a mare cannot be falsely copied as a certified 1997/98 foaling site. It proposes **no breeder or owner IDs** and does not create a player/AI finance event or registered racehorse. Those relationships must be authored and approved in a *new clean scenario data layer*, not inferred from a mare's later residence.

The separate `founding-ancestry-1999.mjs` traces up to five generations from the actual 73 retained breeding animals and 61 linked historical horses. Unrelated ancestors are not playable; contradictory or missing parent evidence stays visibly unresolved.

### Existing Office integration

- The approved Office FM interface remains in `public/next/next.js` and `public/next/1999-ui-source.mjs`; do not redesign it. Leadership profiles now distinguish approved principals, four pending names and non-operating investors.
- New-game API requests default to `FOUNDING_1999`. Full synthetic population benchmarks require an explicit engineering-only mode.
- Personnel opening list now includes ONLY the 41 selected approved identities. No generated jockeys, trainers, workers, contracts or payroll are available. Magic Johnson remains at immutable `P-910018` as a non-operating investor. Grooms and exercise riders remain absent.
- Live finances show **NOT CERTIFIED** rather than copying invented balances from the retired 3,308-owner experiment.
- Stallion profiles and broodmare views show their actual historical source IDs; UI does not duplicate the breeding population.
- The Office Stable can legitimately be empty during initial world creation. Clicking between departments must work even with zero racehorses.
- New read-only API `/api/1999/sim/new-youngstock-proposals` is a *candidate review list*, not a racecard or active game roster.
- Saved careers are isolated under `wtw1999FoundingStateV1`; the gameplay-engine owner must confirm future world-seed/save migration compatibility.

## Next implementation steps, strictly in order

1. **Leave four principal slots empty until approval**: proposed Graham Kincaid, Hugh Radcliffe, Sebastian Pryce and Daniel Calder remain documents-only. All other accepted principal and secondary identities are loaded. Magic Johnson is a major NON-OPERATING Ledbetter investor.
2. **Authorize the new birth and ownership foundation**: for each fictional candidate, decide the correct original breeder, foaling site, retained-owner or sale/transfer path, and later racing stable. No false historic pre-1999 transactions and no aliases; use game-approved new entity IDs.
3. **Create the new 1999 horse population** using the actual released and screened naming/registration rules. Aim initially for a few hundred properly linked horses across the chosen farms and owner groups; 250–400 racing horses is a useful *planning estimate*, not approved canon or an excuse for arbitrary injection.
4. **Create verified 1999 barns, staff appointments and jockey bookings**: distinguish farm operations from racing barns; every working horse must have one actual owner and one current barn, trainer, state and travel program. Professional staff contracts remain off until an approved employment transaction occurs.
5. **Certify opening owner accounts** through the gameplay engine, with coherent assets, cash, liabilities, payroll, boarding and standing-fee agreements. Never insert fake numbers from the old experiment.
6. **Run one small, truly playable pilot circuit** with compatible entries, complete racecard fields, correct age and distance eligibility, trainer and jockey availability, real costs and payouts, valid save/reload and no AI/player asymmetry. Expand to 4–6 regions only after this works.
7. **Expand the world after the whole pilot is proven**, not before. Keep founder names, legacy race results, pedigree IDs and source archive stable.

### Blockers not to disguise as successes

- 37 organizations have **no registered opening racehorse**. The scenario is clean but cannot yet run a player/AI race.
- No accepted naming-engine release is connected to the live registration workflow. The 84 juvenile/yearling records are only unregistered proposals.
- Only four revised name proposals remain unapproved; 33 of 37 primary leadership identities are now approved/established. The 27 approved newly proposed people are not historical evidence.
- New youngstock births, 1997–98 breeding outcomes, historic sale events, foaling locations, 1999 owner contracts and cash balances remain uncertified.
- Some existing browser, training and visual regression suites were built around nonempty old B01 starting stables. They need QA designed for a deliberately empty opening world, not bogus horses added to pacify tests.
- Performance tests using 325k synthetic animals are *engineering diagnostics only*, not the playable game world.

## Source of truth and working assets

- Game-facing scenario: `public/1999/engine/founding-world-1999.mjs`
- Founding source World registrar: `public/data/wtw-1999-founding-directory-v1.json`
- Leadership: `public/1999/engine/founding-leadership-1999.mjs` (V2), `docs/1999-founding-leadership-roster.md`
- New unregistered offspring candidates: `public/1999/engine/founding-youngstock-candidates-1999.mjs`
- Ancestor view: `public/1999/engine/founding-ancestry-1999.mjs`
- API / player Office: `public/1999/engine/local-api.mjs`, `public/next/1999-ui-source.mjs`, `public/next/next.js`
- Original historical record: `public/1999/engine/canon-mini.mjs` (read-only)
- Tests: `tests/1999-founding-youngstock-candidates.test.mjs`, `tests/1999-founding-world.test.mjs`, `tests/1999-management-screen-data.test.mjs`, `scripts/1999-management-browser-smoke.sh`
- Working 1999 World Bible: https://docs.google.com/document/d/1zBmtdFenkeP70odONetitXFcruPc0qwt485JAR8lDDs/edit
- Founder logo design brief: https://docs.google.com/document/d/1tA-4NLG7QoZ4qhugnku40QkV_PsvuWP1tAO81jze0z8/edit

**Release certification:** Recheck the latest GitHub CI suite on the exact final commit; don't cite passing checks from earlier commits as if they certify subsequent changes.
