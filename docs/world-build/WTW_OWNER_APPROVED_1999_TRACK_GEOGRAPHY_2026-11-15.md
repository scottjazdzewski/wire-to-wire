# WIRE TO WIRE — OWNER-APPROVED 1999 RACING GEOGRAPHY REBALANCE
**Decision date:** 2026-11-15  
**Status:** OWNER APPROVED — IMPLEMENTATION NOT YET COMPLETE  
**Applies to:** the optional historically grounded, alternate-history **1999 test world / legacy track-registry overlay** and as geographic market guidance for the fully fictional default world.  
**Not a substitute for:** `docs/engineering/WTW_FICTIONAL_WORLD_GENESIS_AND_CUSTOMIZATION_CONTRACT.md`. The commercial launch world remains fully fictional with editable/generated identities and no real-history results mixed into its base.

## 1. Five owner-approved fictional expansion venues

| Final proposed name | Metropolitan / geographical anchor | Intended racing role | Illustrative game meet (design, not historical fact) |
|---|---|---|---|
| **Bluff City Downs** | Collierville / eastern Shelby County, **Memphis, Tennessee** | Major Mississippi Valley dirt-and-turf regional anchor | Spring and fall; ~70–90 days |
| **Lowcountry Racecourse** | Johns Island, **Charleston, South Carolina** | Turf-led Carolina seasonal heritage program, shorter dirt course | Spring; ~45–60 days |
| **Live Oak Park** | Pooler–Bloomingdale, **Savannah, Georgia** | Coastal Georgia dirt-and-turf meet coordinated with Charleston | Autumn and limited spring; ~35–50 days |
| **Red River Downs** | **West Fargo / Fargo, North Dakota** | Northern-plains dirt and fair/regional horseman circuit | Summer; ~25–35 days |
| **Bitterroot Downs** | Lolo / Bitterroot Valley, **Missoula, Montana** | Mountain West summer dirt meet, real training/shipper economy | Summer; ~25–35 days |

All five are **fictional track entities**, with clearly labeled modeled dates, purses, grades (none invented as authentic), conditions and source provenance. Set unique canonical IDs through the authoritative owner-controlled registry; **do not invent or reuse permanent IDs in a UI-only projection**. These are regional anchors, not evidence-backed surveyed build parcels. They must produce horses/jobs/entries/shipping rather than empty facility cards.

## 2. One historical operating survivor out of original fourteen

| Canonical ID | Track | 1999 WTW decision |
|---|---|---|
| **T-0106** | **Sheepshead Bay Race Track** — Brooklyn, NY | **Keep OPEN** as an intentionally alternate-surviving short spring/autumn boutique turf-oriented meeting; preserve historical provenance separately |

## 3. Thirteen historical venues: permanently historical-only in the 1999 world

Keep **all IDs, historical races, old winning records, relationships, track-history dossiers and known source evidence**; remove them only from *new* 1999 race calendars, operational directories, current shipping destinations, condition-book generation, workforce and purse allocation.

| Track ID | Venue | Location | Rationale |
|---|---|---|---|
| T-0103 | Jerome Park | Bronx, NY | Original site lost; Belmont serves its successor role |
| T-0104 | Morris Park | Bronx, NY | Belmont superseded its major racing role |
| T-0105 | Gravesend Racetrack | Brooklyn, NY | Overlaps metro New York's modern circuits |
| T-0107 | Jamaica Race Course | Queens, NY | Aqueduct/NYRA consolidation |
| T-0108 | Empire City Race Track | Yonkers, NY | Thoroughbred era superseded by harness venue |
| T-0109 | Kentucky Association Track | Lexington, KY | Keeneland developed after the original course ceased |
| T-0110 | Chester Park | Cincinnati, OH | River Downs/Turfway metro competition |
| T-0111 | Maple Heights Park | Maple Heights, OH | Thistledown holds Cleveland racing role |
| **T-0113** | **Jefferson Park** | **Jefferson / New Orleans, LA** | **Owner explicitly rejected retaining it; Fair Grounds sufficient** |
| T-0114 | Old Woodbine / Greenwood | Toronto, ON | New Woodbine's successor racing role |
| T-0116 | Cranwood Park | Warrensville Heights, OH | Racing dates moved to Thistledown |
| T-0117 | Randall Park | North Randall, OH | Thistledown was located across the road |
| T-0118 | Original Latonia Race Track | Covington, KY | Later Latonia/Turfway successor role |

Already **HISTORICAL_ONLY** and unchanged: **T-0042 Atlantic City Race Course**, **T-0112 Bainbridge Park**, **T-0115 Aurora Downs**. Atlantic City's actual 1999 race days remain documented and must not be reinterpreted as a pre-1999 closure.

## 4. Pacific Northwest: one more historical survival, one more archive

- **Retire T-0033 Longacres (Renton, Washington)** from active 1999 racing; keep its entire historic record. Emerald Downs at Auburn is its physical/market successor, and remains active.
- **Add Playfair Race Course (Spokane, Washington)** as a **real historical track with a deliberately alternate-continuous 1999 racing operation**. It was inactive in real 1998–1999 and had a brief real 2000 reopening. Do not misrepresent our 1999 racing as real. Model roughly **50–70 seasonal days**, subject to scheduling and economic testing; allocate a new immutable track ID through the canonical registry.
- Retain Portland Meadows, Grants Pass, Les Bois Park, Hastings Park, and Emerald Downs; coordinate Playfair with Bitterroot Downs and Boise.
- Do **not** revive Longacres as a second operational Seattle track.

## 5. Western roster reaffirmation and physical venue deduplication

- **Texas** retain Lone Star Park (Grand Prairie/DFW), Sam Houston (Houston), Retama (San Antonio), Manor Downs (Austin): **four** active.
- **Arizona** retain Turf Paradise (Phoenix), Yavapai Downs (Prescott Valley), Rillito Park (Tucson): **three** active.
- **New Mexico** retain **Sunland Park T-0061** (Sunland Park/El Paso), real since 1959 and still operating in 2026. Sunland is not fictional and does not require a West Texas duplicate. Retain other New Mexico venues already in canon.
- **California** retain five major tracks Santa Anita, Hollywood Park, Del Mar, Golden Gate Fields, Bay Meadows; fair circuit retains individual meet identities. **San Mateo County Fair T-0075 is a meeting using Bay Meadows T-0032 physical venue**, not a second independent facility; reconcile unique physical track capacity, shipping, entries and asset IDs rather than delete the fair's original record.
- **Colorado** and already-approved game expansion tracks (Atlanta, Nashville, Charlotte, Denver, Las Vegas, Salt Lake City, Kansas City, Milwaukee, Havana) remain as established; no extra Colorado facility.
- Oregon, Idaho and British Columbia operational roster unchanged.

## 6. Proposed numerical reconciliation (not a completed world)

Current 1999 North American *registry* has **118 IDs, 115 playable IDs** (three already historical-only), with 16 international venues tracked separately:
```
115 current playable
 -13 additional retired historical survivors (retain Sheepshead Bay)
  -1 Longacres retired
  +5 new fictional tracks
  +1 Playfair alternate-history restoration
=107 proposed playable registry entries
```
A fair meeting alias (San Mateo County Fair) remains a **calendar/meeting entity** but not an additional *physical facility*. Avoid double-counting its track capacity; the authoritative generator's physical venue count can therefore differ from 107. Do not add facilities that conflict with already-assigned metro racing programs.

## 7. Engineering integration acceptance requirements

1. Follow `AGENTS.md`, product-wide release, desktop, and fictional-world genesis contracts. This owner-approved track discussion **does not supersede** the all-fictional launch default or start optional real-history ingestion.
2. Canonical ID source of truth, and geographical/travel nodes must be updated by assigned world/data workstream before any UI index or calendar projection; no ghost entries/ID reassignment and no deletion of historical sources.
3. For archive tracks: `trackOperating="HISTORICAL_ONLY"`, `playableIn1999=false`; no new 1999 race card, entry, stakes, season jobs, shipping destination or purses, but historical profile/search and saved references remain valid.
4. For new tracks: distinct registry IDs, cities/metro/geo, legal racing state and circuits, realistic modeled local meet and surface, age/sex/class/distance/conditions, purse/facility economics, staffing and horse inventories; horse/trainer/owner/jockey routing and costs must work in the actual simulation.
5. Playfair is a *real* historic identity with *alternate* 1999 meet; do not fabricate or rewrite actual historic results. Do not silently shift any historical stakes to another course; require separate explicit source- or owner-approved mapping.
6. Physical venue deduplication: preserve Bay Meadows and fair meeting identifiers without duplicate facility or physical racing surfaces.
7. Leave career saves, player names/media overrides, old history records, approved logos, other parallel workstreams' changes and 1999 active-world snapshots compatible; version and test any schema migration.
8. The first commercial game remains a generated, **entirely fictional** world, in which the geographic market structure/ratios can inform generation but real historical track identities/results cannot silently enter that default.
9. This specification alone makes **no runtime change**. Implement in small tested PRs by canonical world/genesis and gameplay owners; verify both generated new-world and legacy-1999-browser projections, historical archive visibility, and real desktop offline installation. **NOT YET DESKTOP CERTIFIED.**

## 8. Owner acceptance
User explicitly approved *all preceding track expansion, retirements and western coverage proposals* on 2026-11-15, additionally stating **"scrap Jefferson too."** No separate approval is implied for invented historical results, track grades, opening dates or specific parcel sites. The five proposed track names and Playfair survival are approved geography identities; precise canonical ID allocation and race-calendar economics still require engine integration and testing.
