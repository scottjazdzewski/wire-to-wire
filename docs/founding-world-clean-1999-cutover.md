# WIRE TO WIRE — Clean January 1999 founding pilot (isolated staging branch)

## Reset boundary
This branch is the NEW **founding scenario**. It is NOT the old 325,000-horse TEST generator with some names changed. The initial set is assembled by filtering the canonical 1999 opening records to user-selected organizations and their actual horses, stallions, mares, pedigree ancestors and associated historical records.

**The current live game is NOT yet reset by adding this data file.** A separate cutover is required. Stage validation comes before replacing any production world: this matters because concurrent work is underway on UI and game engines. No D1 race histories, canonical horse master, current-year season results, or local career saves have been deleted.

Current verified seed `public/data/wtw-founding-world-clean-1999-v1.json`:
- 36 founding organizations (the user-requested 26 concepts include a two-farm brother rivalry, plus 8 approved farms and Argosy Bloodstock as an established major rival).
- 22 organizations with existing permanent IDs, 14 with isolated `PILOT-ORG` temporary keys pending official registration.
- 35 existing opening racehorses, all with source owner IDs belonging to selected organizations. No horse was silently given a new owner.
- 18 active stallions physically standing at selected source farms, 11 foundational broodmares and 66 representative source boarding mares. Boarding != owning.
- 501 source-backed pedigree nodes, zero unresolved parent IDs after a source Historical Horse Master expansion.
- 14 historical role associations (e.g. Kingsmere bred Heyday, Whitcombe owned Heyday; Crescent Mile and Who Knows/Saint Nobody with a REQUIRED older racing-owner reconciliation).
- 25 relevant track identities and 49 pre-1999 historical yearbook years, all read-only.

## Safe cutover acceptance gates
1. Assign permanent organization IDs for provisional farms/stables and exact IDs for their principals, without duplication.
2. Resolve source-name aliases Harrowgate/Lattice, Midway/Barlow, Knight's Way/Avery Morning, Quickfire/Marcus Vale, Potomac Heritage/Cobb; change display name by immutable ID, not owner ID.
3. Resolve Miriam Vale's Virginia operating base and Ashby Vale current organization bridge. Preserve her older birth record separately.
4. Resolve Crescent Mile's retained homebred ownership of Who Knows and Saint Nobody against prior Meridian/outside client owner assignments. Preserve certified historical events and provenance until a deliberate role-level user-approved correction.
5. Add a **new world creation mode** with a new, isolated save schema/key and exactly this seed. Do not import existing saves or any unrelated owner/horse population.
6. Make all normal management routes (World, Stable, Sales, Breeding, Personnel, Race Calendar, profiles, owner-horses, pedigree/stud, track conditions, game saves) consume the SAME source-filtered seed with no fallback to 87,500/325,000 TEST populations.
7. Only once every route uses this world and all existing project tests pass, switch the default boot and retire the old world from **playable starting-state selection**. Retain the old source snapshots for historical evidence and rollback, not as automatic initial playable content.
8. No invented transfers or new future winning records. Add new 1999 horses through the separately developed naming/pedigree generation engine and link to owners, farms, trainers and geography before activating races.

## What remains to populate a playable world
The pilot is intentionally sparse: only six founding owner IDs actually own one of the 35 retained opening horses. The initial 16 existing people are only verified principals/trainers and some historical figures, not a full racing workforce. Build and test realistic owner portfolios, trainers, jockeys, grooms, exercise riders, bloodstock agents, farm managers, broodmare/foal teams, and racing-office staff. The first pass should emphasize complete linked records over sheer totals. Test farm operations, breeding, sales, training, entries, track scheduling, finances and AI choices at modest scale before authorizing broader expansion.

## Files
- `public/data/wtw-founding-world-clean-1999-v1.json`: verified clean filtered seed.
- `tests/founding-world-clean-1999.test.mjs`: no-duplication / history / source closure test.
- Narrative and logo design authority: https://docs.google.com/document/d/1zBmtdFenkeP70odONetitXFcruPc0qwt485JAR8lDDs/edit ; https://docs.google.com/document/d/1tA-4NLG7QoZ4qhugnku40QkV_PsvuWP1tAO81jze0z8/edit

**No UI redesign. No hidden background process. No simulated post-January 1999 race results committed.**
