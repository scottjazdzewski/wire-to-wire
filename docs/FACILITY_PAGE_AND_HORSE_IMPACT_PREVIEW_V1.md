# Wire to Wire — Facilities Roster and Horse-Impact Design V2

**Status: FM/OOTP ROSTER LAYOUT LOCKED; HORSE-IMPACT AND PROFITABILITY ENGINE PROPOSED, NOT ACTIVATED.** The user rejected the standalone split-list/right-inspector workbench on November 13, 2026. The only approved Facilities list is the **existing full-width sortable Facilities roster** under `/next/?world=1999`, visually identical in structure to Personnel, Stable and Sales: one `VIEW` dropdown, find-records search, sortable configurable columns, and the existing column/status filter controls. The rejected HTML preview and visual-audit route were deleted. This document **does not create facilities, modify horse fitness, assign staff, establish profits or change the founding roster.**

## Locked user direction

1. Combine shared facility basics, specialized capabilities and real horse benefits/detriments into one connected system. Facilities affect the horse through its actual residence, services and staff; they do not grant genetic or ability points merely because an owner bought upgrades.
2. A horse's **OWNER** (O-ID) can differ from its **TRAINER** (P-ID), **PHYSICAL BARN** (F-ID) and **HOST TRACK** (T-ID). Horses trained at Belmont may live in a trainer-operated barn at Belmont, even if their owning O-ID is a partnership based elsewhere. Do not presume a horse resides at its owner's namesake farm, stable or headquarters.
3. Add a **track-based trainer barn** as a *location/tenancy subtype* of a racing-stable facility, not as a new racetrack, horse owner or one-to-one default barn at every track. A trainer barn is approved individually with separate stall capacity, condition, care, staff coverage, financial operator, track lease, training access and horses currently housed.
4. **Every real facility is a distinct profit center**, with its own F-ID, site budget, operating income, costs, maintenance and capital improvements. Track barns may pay track rent. Do not force a new O-ID for every building. Profit center ≠ new legal ownership organization.
5. **LOCKED VISUAL AUTHORITY: the current Facilities · Overview screenshot supplied by the user**, which uses the same *full-width* sortable roster system as Stable, Sales and Personnel. **Do NOT add a persistent right inspector, split-screen workspace, tile dashboard, or separate preview URL.** Keep the existing `VIEW` dropdown for category selection, field/contains/status filters, search, sortable headings and scrolling rows. Player sees high-density operational data on the roster itself; opening an individual facility is optional, not required to learn its main status.
6. **Prestige ≠ physical quality**. Prestige comes from recorded achievements and history; care, training environment, maintenance, staffing, space and condition are separate and can be poor even at famous facilities. The same rules and costs apply to AI and player.

## Identity and tenancy contract (proposed fields; not authoritative data yet)

- `organization_id: O-...`: ownership entity / employer / contracting party. One organization may control many physical facilities; a trainer may manage horses owned by several O-IDs.
- `facility_id: F-...`: unique property or trainer barn as the operational unit, **only created by an authorized transaction**. Its `site_type` is FARM, STUD_FARM, RACING_STABLE, BREAKING_FACILITY or TRAINING_CENTER. `racing_stable_subtype: TRACK_TRAINER_BARN` is valid when the physical housing is at a track. This does not add a sixth top-level market class.
- `host_track_id: T-...` for track barns. This is **location, venue access and landlord**; it is NOT horse ownership or an automatic race entry. Track official status and date gates remain authoritative.
- `facility_owner_organization_id`, `operator_organization_id` and `leaseholder_organization_id` distinguish owner, manager of P&L, and lessee. `head_trainer_person_id: P-...` identifies the trainer for a racing barn; they are not assumed to be the site's owner.
- `horse.current_residence_facility_id: F-...` points to exactly one accepted physical residence on a given game day. Horse's `owner_organization_id` and `trainer_person_id` remain independent. A stable without a valid F-ID cannot claim it physically houses a horse. Every transfer has time, location, capacity and finance checks.
- `stalls_total`, `stalls_operational`, `stalls_occupied`, `condition`, `care_environment`, `staffing_required`, `staffing_present`, `services`, `maintenance_policy`, `track_training_access`, `location`, `residence_since`: live site-specific readings; no invented opening numbers.
- Site ledger: fees from boarding, training, breeding and services; expenses for staffing, veterinary support, bedding, feed, utilities, upkeep, track rent and capital improvements. Expenses do not post twice. A consolidated owner company removes internal transfer-price revenue when aggregating its subsidiaries/facilities.

## Proposed horse-impact channels (one source per effect)

The horse-development engine already tracks fitness, fatigue, readiness, speed/stamina condition, gate schooling, confidence, stress, soreness and a modeled risk. A facility should **modify the inputs/daily change** in these quantities, never overwrite a horse's pedigree, inherited potential or earned results.

| Channel | Physical source | Proposed consequence when good | Proposed consequence when poor |
|---|---|---|---|
| Recovery | stall condition, bedding, ventilation, staff + adequate rest | more fatigue relieved per recovery day | slower relief; soreness accumulates if workloads persist |
| Stress and confidence | turnout, noise, care and stable routine | less background stress; more reliable adaptation | higher stress and slower confidence-building |
| Workout quality | ACTUAL track/training-center access, surface, qualified trainer and staff | slightly better execution of the selected fitness/speed/stamina session | less effective work; increased fatigue or setbacks |
| Schooling | verified breaking/gate infrastructure and specialist coverage | more consistent early training, gate composure and handling | slower progress and more behavioral setbacks |
| Breeding/foaling care | verified stud services, maternity staff, veterinary/foaling capability | better care and lower avoidable complications | breeding/foaling services restricted; higher modeled avoidable risk |
| Overcrowding/staff gap | occupied vs operational stalls, staffing ratios | normal care and permitted bookings | block new intake; degrade welfare, condition and recovery if exceptional crowding persists |
| Cost and business | ownership/operator ledger, rent, staff, service rates | sustainable margins allow care and upgrades | budget shortfalls constrain capacity/maintenance, not automatic random horse ability loss |

**No duplicate benefit:** trainer talent, training venue surface, horse constitution, horse genetics, facility care and track weather each have their own factor and bounded contribution. A horse receives care/residence effects from *one actual barn that day* and training-surface effects only when a recorded workout uses the approved venue. Track status must still gate access. The AI must run the same ledger and training mechanics.

## Horse-effect model vs implementation

The rejected standalone preview once showed hypothetical Well Maintained / Typical / Neglected coefficients for recovery, training, stress and avoidable setbacks. Those were **illustrative balancing targets, NOT APPROVED OR ENGINE-CALIBRATED VALUES**. Do not display them as live data or activate them. Actual horse effects must be tested against `public/1999/engine/horse-development.mjs` and the facility operating engine with authoritative staff, residence, workout venue, finance, daily timing and care rules.

The existing game facility engine (`src/game/facility-operations.js`) already supports property purchases, stall and staff caps, maintenance, three upgrade types, boarding fees, operating site reports, time-based costs and equivalent AI rules. The **live 1999 Office is not automatically bridged to these commands**, and no current founding F-ID properties may be fabricated from 30 O-ID institution references or from the 118 preserved North American/Cuban tracks.

## Locked Facilities roster and dropdown architecture

The **actual existing Facilities roster** is the approved screenshot. Preserve all current Overview columns: **FACILITY, TYPE, CITY / STATE, CAP, USED, FREE, COND, QUALITY, STAFF, MONTHLY COST, OWNER, STATUS**. Keep the exact same font, column-filter controls, sort indicators, roster scrolling, and full-width grid. Do not add a permanent pane.

The current `VIEW` dropdown contains Overview, Stud Farms, Training Centers, Breaking Facilities, Racing Stables and Farms, plus the newly added **Trainer Barns** subcategory. Overview remains the default with **30 existing O-ID founding institution references** (five stud operations, 15 farms, ten racing-stable organizations). These are **NOT 30 certified physical F-ID properties**. Trainer Barns, Training Centers and Breaking Facilities remain empty until site records are actually authorized; never create demonstration data just to fill the grid.

**Later, once engine data exists**, expose horse care/effects and individual facility financial performance as compact **sortable roster columns or alternate views using the SAME dropdown**. A facility can be filtered by type/track/owner/staff/condition/operating profitability without leaving the roster. A row can still open the existing Track-style facility detail profile for deeper history, but all actionable status should be understandable from the list. Never force the player to click through multiple pages to compare barns.

## Next actual game-engine work

1. Create only the authorized controlled test sample of genuine F-ID facilities, including explicitly located trainer barns at T-ID racecourses (not automatic barns at all 118 tracks); do not change the tracks.
2. Give each site its own capacity, occupancy, care, staffing, services, rental/lease obligations, operator, and P&L with no duplicated postings. Horses retain separate owner O-ID, trainer P-ID and actual residential F-ID.
3. Model tangible positive/negative **daily horse** consequences with bounded and testable effects on recovery, fatigue, stress, soreness, schooling and training progress, keeping inherited talent separate.
4. Feed these actual site values into the existing **sortable Facilities roster** with columns and the View dropdown, maintaining player/AI parity.
5. Test ages, horse travel, facility admission, staffing, workload, weather/venue effects and financial transactions. No unverified numbers on current 1999 opening roster.

**OOTP / Football Manager is the non-negotiable guiding design principle:** high-density sortable management lists for choosing/comparing entities; individual detail profiles only when requested.
