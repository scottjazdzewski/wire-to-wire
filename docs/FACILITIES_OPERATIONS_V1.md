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
## V2: 1999 property opportunities, staffing, maintenance, and P&L
The source-linked converter is src/game/facility-market-1999.js.
make1999FacilityOffers(universe,{limit,startIndex}) builds a small deterministic market selection from existing F-TEST-FARM-* farm nodes, retaining 1999 world name, locality, capacity, acreage and source facility ID. The fact that an asset is offered, its price, projected operating costs and wages are SIMULATED_TEST, not historical real-estate evidence.
The adapter excludes already-operated trainer race barns and track training centers. The browser generator supplies farm subtypes (STUD_FARM or ordinary FARM); the older Node generator omits the subtype, so those records remain general farms rather than inventing a stud classification.
make1999FacilityMarketCommands(...) returns trusted system FACILITY_LIST_PROPERTY commands, to be applied through the existing kernel. Duplicate source facility IDs cannot be listed twice.
Purchased operations inherit modeled staff headcount. New builds open without workers and require a staffing action before boarding contracts can be booked. FACILITY_SET_STAFFING cannot cut staffing below active/future contracted capacity.
FACILITY_SET_MAINTENANCE chooses ECONOMY, STANDARD or PREMIUM with different running costs and monthly wear. Daily wages and maintenance use the same game ledger and clock.
getFacilityFinancialReport(state,world,operationId,{from,to}) reports boarding revenue, payroll, overhead, maintenance, operating profit, property purchase/development capital spending and net cash flow without confusing purchases with P&L losses.
AI opponents obey the same purchase, staffing, construction, and upgrade costs. A new-build AI property staffs only if financially able.
The current /next/ UI is still driven by a separate 1999 browser game-run transport. This module does not overwrite or automatically mount the UI. The authorized UI/game window must connect these commands and read-only selectors for player interaction.