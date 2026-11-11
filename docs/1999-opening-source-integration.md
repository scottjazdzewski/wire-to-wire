# WIRE TO WIRE — January 1999 source integration

**Checkpoint: 2026-11-11. This is a VERIFIED OPENING-SOURCE HANDOFF, not a complete playable game engine.**

## Authoritative provenance
- Canonical January registry: https://docs.google.com/spreadsheets/d/1Lhpe6DG1foQ2-zayQBg4bKpTtu4MP_itpM1zo2GRSEA/edit
- Historical horse master, 1864–1998 horse and human season totals, historical awards, and v3.84 E/W/M are existing unmodified historical result authorities.
- Horse identity/pedigree joins reconcile both the January Horse_Registry and Historical Horse Master by immutable IDs; the latter supplies nine of the 267 historical opening identities. 267 featured horses, all 534 parent IDs, and 1,066 recorded grandparent references were checked.
- 108 existing January foundation organizations; only 10 origins are approved for publication and 98 organizations remain identity-plus-source-evidence only. Source horse-year trainer/owner links do not prove race-day personnel, contracts, earnings or finances.

## Changed canon and source-ready game data
- Corrected the existing Stallion_Career_Model: two duplicate evidence rows for Palace Musician and Saint Nobody no longer count as additional living stallions. The previously omitted existing Proviso and Parliament stand at Four Corners Farm and Aurelian Stud respectively, from already locked Stallion_Chronology and Horse_Geography. **31 distinct source-active Jan 1 stallions / 31 exact recorded stud locations.** Come October remains PENDING and unbookable.
- The new guarded opening-world read-model has **267 featured named January horses**, **108 foundational organizations**, **154 people with source birthplace/operating-base records**, **134 known race tracks**, **2,876 pedigree nodes**, **31 source-active stallions**, **20 foundation broodmares**, **2,036 B01/P2500 production broodmare boarding records**, **93 stakes options**, **38 preauthored calendar events**, and **49 historical yearbook years**.
- The full **87,500-horse** production opening population belongs to the retained P01–P08 production authorities and is NOT loaded by this featured source bridge. Never substitute 267 for 87,500.
- No invented stud fees, bookings, fertility, future foals, current pregnancy, horse ability, 1999 starts/results, or guaranteed player purchases.
- The existing 223 nonactive/quarantined historical editions remain excluded. No protected past race result was edited.

## Integration branch only
GitHub branch: feature/1999-canon-opening-handoff-20261111, repository scottjazdzewski/wire-to-wire.

Files:
- src/1999/opening-world.v1.mjs: deterministic source-only JavaScript dataset.
- src/1999/opening-readmodel.mjs: Access-protected January 1999 data lookup routes for horse, pedigree, people, farms, stud stallions, broodmares, mare boarding, tracks, calendar, queued events and yearbook.
- src/1999/entry-gate.mjs: shared player-AI hard age/sex, overlapping race, shipping, border, closed meet and jockey double-book guards. Unknown health, works, rest, cost, conditions and stall capacity HOLD until real evidence exists.
- src/worker.js: guarded API routes plus a POST-only **noncommitting** entry-screening endpoint; supplied observations are unverified and do NOT create a runner.
- tests/1999-opening-world.test.mjs, tests/1999-entry-gate.test.mjs: source joins and physical rules.

No production main-branch UI or Cloudflare deployed state changed.

## Still required for fully PLAYABLE Jan 1, 1999
1. Load and persist the complete retained **87,500 production horses**, source-authorized actor/stable/owner inventory, finances, geographic assignments and observable versus hidden information.
2. Execute the actual 38-event January queue via STG7 deterministic lifecycle and append-only ledgers; source events existing in a sheet is not game-loop execution.
3. Run authentic condition books from committed horse/fitness/market state, actual bookings and shipping, trainer decisions and independent race-performance engine. Player and AI face identical rules.
4. Perform save/reload, Day/Week/Month advancement, race scheduling, finance, claim and result generation/replay acceptance. Do not script 1999 winners.
5. Promote the running game to the Office UI only via its **separate canonical UI authority**, which currently has a 2014-dated interactive prototype. This branch does NOT touch its HTML, CSS, images, layout or behavior.
6. Do not mark 1999_Playability_Gate green until verified on the real environment. Never claim approved historical stories beyond 10 approved origins.

## Verification and limits
Source-matched 267 featured horses; 31 unique standing stallions; 2,056 January broodmares; 2,876 ancestors; 93 dated stakes; 38 preauthorized, not executed events. In-memory JavaScript module compilation and **19 direct source/entry invariants** passed. This is not a substitute for full repository npm test, GitHub CI, Cloudflare Access/D1 testing, or STG7 production gameplay acceptance.
