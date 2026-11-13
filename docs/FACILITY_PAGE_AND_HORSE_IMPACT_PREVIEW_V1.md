# Wire to Wire — Facilities Desk and Horse-Impact Preview V1

**Status: VISUAL / ENGINE DESIGN PROPOSAL, NOT APPROVED LIVE SIMULATION.** User asked to see the one-screen layout first, November 13, 2026. This document DOES NOT create facilities, modify horse fitness, assign staff, establish profits, or change the founding roster. The standalone preview is `public/next/facility-workspace-preview.html`; it does not mount the main Office or write a save. Preview URL: `/next/facility-workspace-preview.html`.

## Locked user direction

1. Combine shared facility basics, specialized capabilities and real horse benefits/detriments into one connected system. Facilities affect the horse through its actual residence, services and staff; they do not grant genetic or ability points merely because an owner bought upgrades.
2. A horse's **OWNER** (O-ID) can differ from its **TRAINER** (P-ID), **PHYSICAL BARN** (F-ID) and **HOST TRACK** (T-ID). Horses trained at Belmont may live in a trainer-operated barn at Belmont, even if their owning O-ID is a partnership based elsewhere. Do not presume a horse resides at its owner's namesake farm, stable or headquarters.
3. Add a **track-based trainer barn** as a *location/tenancy subtype* of a racing-stable facility, not as a new racetrack, horse owner or one-to-one default barn at every track. A trainer barn is approved individually with separate stall capacity, condition, care, staff coverage, financial operator, track lease, training access and horses currently housed.
4. **Every real facility is a distinct profit center**, with its own F-ID, site budget, operating income, costs, maintenance and capital improvements. Track barns may pay track rent. Do not force a new O-ID for every building. Profit center ≠ new legal ownership organization.
5. The Facilities main page should behave like the **Stable or Sales roster**: a dense, searchable, sortable *list on the left/center* and persistent right inspector. Minimal menu/page hopping. Keep the approved dark FM/OOTP style, top office navigation, logo style, and right-side card stack.
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

## Preview arithmetic vs implementation

The interactive preview offers Well Maintained / Typical / Neglected scenarios with visible example changes to recovery, training/development environment, stress and avoidable setbacks. Those values are **illustrative balancing targets**, NOT source-proven horse outcomes, calibrated probability distributions, or engine outputs. They do not write to the save. Actual values must be tested against `public/1999/engine/horse-development.mjs` and the facility operating engine, with engine-owned staff, locations, housing moves and daily finances.

The existing game facility engine (`src/game/facility-operations.js`) already supports property purchases, stall and staff caps, maintenance, three upgrade types, boarding fees, operating site reports, time-based costs and equivalent AI rules. The **live 1999 Office is not automatically bridged to these commands**, and no current founding F-ID properties may be fabricated from 30 O-ID institution references or from the 118 preserved North American/Cuban tracks.

## Preview acceptance and next step

The preview should load the **exact 30 eligible existing founding institution references** from the 37 approved organizations: five studs, 15 farms and ten racing-stable organizations. The additional Belmont Trainer Barn row is visibly labeled **CONCEPT ONLY** and points to the actual host `T-0002`; it creates no F-ID, trainer, horse, active meet or new organization. Training and breaking filters remain empty until approved properties exist.

After the user approves the look, the next steps are (1) wire a read-only Facilities list projection from the authoritative game state, (2) authorize a small test cohort of genuine F-IDs, including trainer-at-track housing, (3) connect residence/training/staff effects in the engine, (4) reconcile each site P&L and owner consolidated books, then (5) balance day/week outcomes on test horses with age, trainer, travel, injury and AI parity checks.
