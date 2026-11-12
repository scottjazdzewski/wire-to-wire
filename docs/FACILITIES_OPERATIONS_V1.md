# Wire to Wire — Facilities Operations V1

Status: integrated into the existing src/game command engine, save, ledger and clock. This does not mean the live /next/ Facilities UI is already connected.

## Owner growth
An O-* racing owner can continue operating a stable while purchasing or developing independent property. A general Farm can keep diverse horse types; a Stud Farm supports breeding; a Racing Stable runs active racing. Training Centers and Breaking Facilities are separate. Barns remain infrastructure rather than a separate business.

## Authority
Original world people, horses, bloodlines, locations and organization IDs remain unchanged. Newly developed properties have F-RUN-FAC-OFFER-* game-only IDs. Market price, contract demand and model funding carry explicit provenance and are never asserted as historical facts. The same game clock, finance ledger, command receipts, and event journal are used. No shadow game run or property database.

## Registered commands
- FACILITY_SEED_FUNDS (system only): source-labeled one-time organization cash baseline.
- FACILITY_LIST_PROPERTY (system only): property offer and location, type, price, capacity, upkeep, rate and build time.
- FACILITY_ACQUIRE (player or game AI): purchases property, checks cash and operating reserves.
- FACILITY_UPGRADE (player or game AI): stall block, care system, stud farm foaling wing.
- FACILITY_BOARDING_CONTRACT (system only): contracted stalls, never fabricated horse IDs; rejects overlaps over capacity.
- FACILITY_AI_CYCLE (system only): competitors can purchase and improve properties using player-equivalent costs and limits.
- ADVANCE_DAY: active site upkeep, boarding revenue, construction and upgrade completion; monthly NPC investment and wear.

## View adapters
getFacilityPortfolio(state,world,organizationId) and getFacilityMarket(state) are exported through src/game/index.js. Their data is read from the same state; no duplicate registry.

## Scope boundary for other active windows
The existing /next/ Office uses a separate active 1999 browser career implementation. This feature will not appear as operational UI until the authorized game bridge mounts these commands and the UI owner wires the Facilities page. Do not redesign or replace their page as part of facilities engineering.

Next: approved offer importer from 1999 test-world properties; explicit facility/source IDs, leases, hireable staff, construction/finance progression, horse occupancy through real horse movements, independent third-party contracts, and owner-level profit reporting.

Tests: tests/facilities-operations.test.mjs. Existing full CI may contain unrelated cross-window test failures.