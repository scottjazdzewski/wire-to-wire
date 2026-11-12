# WIRE TO WIRE — January 1, 1999 founder-world pilot: proposed identity inventory v0
**STATUS: REVIEW CANDIDATES ONLY — NOT AN APPROVED CANONICAL WORLD, NOT A NEW ENTITY MASTER, NO GAMEPLAY RULES.**

As-of: 2026-11-12. Site-derivative source: `public/data/wtw-1999-world-directory-v33.json`.
Sole identity and historical authority: [WTW CANON REGISTRIES — 1999 START v3.3](https://docs.google.com/spreadsheets/d/1Lhpe6DG1foQ2-zayQBg4bKpTtu4MP_itpM1zo2GRSEA/edit). Existing `docs/HISTORY_SINGLE_CANON_SOURCE_POLICY.md` remains authoritative.
This is a website-window read-only proposal for the world-building / gameplay owners. Do not import it as a new Google Sheet, merge it into the current game save, or allocate replacement IDs.

## What exists in the current *website projection*
- Organizations: **137**, of which **72** use the original `O-000001`–`O-000072` foundation range and the remainder are extended organization references; not all are separate physical properties.
- People: **154**, including **41 trainers**, **37 jockeys**, **15 racing secretaries** and additional principals/owners/agents.
- Horse rows: **317** = **267 opening**, **29 breeding stallions**, **21 broodmares**. These are identity rows, not a proven complete living/ancestral population.
- Tracks: **118** (102 indicated operating in directory; 16 historical). A nominated course must also have a valid 1999 meet window; `OPEN` in the registry does not mean racing on January 1.
- The separately built **325,000-world horse directory** is a large modeling/test population, not proof that historical pedigrees, contracts and transactions are complete. Preserve its source IDs while selecting a better-tested opening snapshot.
- Historical organization economic backstory has **108 derived tab rows**, whereas the current website organization projection contains **137**. Reconcile coverage and status before declaring all organization financials present. Never substitute invented cash or profit for source-verified transaction history.

## The correct scope: close the graph, not just hit a count
**No replacement IDs.** Existing horse, person, organization and track IDs must remain stable. A physical facility must be linked by its actual facility ID to an owning/operating organization; an `O-` record is not automatically a farm property or racing barn. Barns are facilities' infrastructure, not independent organization categories.

Pilot entities are accepted only when their January 1 relationships resolve:
- `horse -> sire/dam -> ancestors` (minimum five generations *where credible records exist*, with explicit ancestor-only references), plus foaling location, sex, age and racing/breeding status.
- `horse -> current owner(s) and shares -> trainer -> physical racing stable / farm -> track / location` with effective dates.
- `stud -> standing farm -> breeding agreement / mare covering -> broodmare -> owned offspring`, with realistic reproductive ages and clear unbred/unraced states.
- `person -> employer or contractor, role ratings, birthplace/base, availability, contract, compensation`; a jockey is not assigned a ride simply because they are in the roster.
- `organization -> principal / assets / physical facilities / horses / financial accounts / outstanding obligations`.
- `race -> course / legal conditions / valid 1999 calendar / entries / officials`; unrun races never have fabricated official results.
- Distinguish **known fictional canon**, **verified historical claims**, **generated test values**, and **missing/not yet promoted**. Do not turn approximations into facts.

## Proposed first 16 named breeding/bloodstock anchor organizations
The locations below are **the existing registry's operating/locality descriptions**, not newly verified parcel addresses. The last column is not meaningful for breeding records unless they own one of the 14 selected owners' horses.

| Immutable Org ID | Existing name | Current locality | Selected-owner opening horses |
|---|---|---|---:|
| `O-000001` | Wetherby Plain | Versailles, Kentucky, USA | — |
| `O-000002` | Lattice Farm | Paris, Kentucky, USA | — |
| `O-000003` | Four Corners Farm | Glyndon, Maryland, USA | — |
| `O-000004` | Sundial Stud | Lexington, Kentucky, USA | — |
| `O-000006` | Ninety Acres | Ocala, Florida, USA | — |
| `O-000008` | Bright Harbor | Santa Ynez, California, USA | — |
| `O-000061` | Kingsmere Farm | Versailles, Kentucky, USA | — |
| `O-000062` | Crescent Mile Farm | Paris, Kentucky, USA | — |
| `O-000063` | Ironweed Farm | Henderson, Kentucky, USA | — |
| `O-000065` | Santa Ventura Stud | Santa Ynez, California, USA | — |
| `O-000066` | Aurelian Stud | Lexington, Kentucky, USA | — |
| `O-000068` | Bellwether Stud | Versailles, Kentucky, USA | — |
| `O-000069` | Blue Lantern Farm | Georgetown, Kentucky, USA | — |
| `O-000070` | Little Fork Farm | Frankfort, Kentucky, USA | — |
| `O-000071` | Empire Valley Stud | Saratoga Springs, New York, USA | — |
| `O-000072` | Maple Crown Stud | Oshawa, Ontario, Canada | — |

## Proposed first 14 ownership and racing organizations
The last column counts opening horses already linked by `ownerId` in the website's 267-horse opening roster. These are not synthetic horses.

| Immutable Org ID | Existing name | Existing base description | Direct linked opening horses |
|---|---|---|---:|
| `O-000010` | Firehouse Row Stable | New York; winter Florida, USA | 10 |
| `O-000011` | St. Alloy Partners | Kentucky; distributed strings, USA | 10 |
| `O-000012` | Kettle & Cutlass Racing | Mid-Atlantic, USA | 9 |
| `O-000015` | Morrow Pike Racing | Chicago / Midwest, USA | 8 |
| `O-000016` | Queen Street Racing | Toronto, substantial U.S. campaigning, Canada | 9 |
| `O-000017` | Carson Bell Stable | Hot Springs, Arkansas, USA | 7 |
| `O-000021` | Alderbrook Stable | Atlanta, Georgia, USA | 4 |
| `O-000022` | Palm Crest Racing | Oldsmar, Florida, USA | 6 |
| `O-000031` | Holloway Street Racing | Charles Town, West Virginia, USA | 7 |
| `O-000045` | Northbank Racing | South Ozone Park, New York, USA | 7 |
| `O-000048` | Rainshadow Stable | Auburn, Washington, USA | 5 |
| `O-000052` | Isla Norte Racing | Canóvanas, Puerto Rico, USA | 4 |
| `O-000056` | Marcus Vale | Southern California, USA | 6 |
| `O-000058` | Ocotillo Star Stable | Southern California / Desert Southwest, USA | 1 |

**Exact-ID linkage now available:** these 14 owners have **93** opening horses and **15** distinct trainer IDs assigned to those horses. Those trainers must join the pilot even when their home jurisdiction is outside the main test tracks.

## People automatically included by these 14 owners' existing opening horses
| Immutable Person ID | Existing trainer name | Existing 1999 operating base | Linked pilot horses |
|---|---|---|---:|
| `P-000023` | Gabe Larkin | Charles Town, West Virginia, USA | 16 |
| `P-000040` | Dr. Elias Venn | South Ozone Park, New York, USA | 16 |
| `P-000042` | Malcolm Pease | Cincinnati, Ohio, USA | 10 |
| `P-000052` | Dane Whitlock | Toronto, Ontario, Canada | 8 |
| `P-000047` | Morris "Mo" Danvers | Cicero, Illinois, USA | 8 |
| `P-000043` | Ike Benton | Lexington, Kentucky, USA | 7 |
| `P-000045` | Tomás Alvarado | Oldsmar, Florida, USA | 6 |
| `P-000048` | Shay Nakamura | Arcadia, California, USA | 6 |
| `P-000050` | Evelyn "Ev" Rourke | Auburn, Washington, USA | 5 |
| `P-000076` | Miriam Cole | Canóvanas, Puerto Rico, USA | 4 |
| `P-000068` | Curtis McRae | Atlanta, Georgia, USA | 2 |
| `P-000041` | Renata Solis | Elmont, New York, USA | 2 |
| `P-000079` | Héctor Saravia | Phoenix, Arizona, USA | 1 |
| `P-000044` | Nora Keating | Miami Gardens, Florida, USA | 1 |
| `P-003395` | Edward Sayer | South Ozone Park, New York, USA | 1 |

**No jockey bookings have been inferred.** There are 37 source-named jockeys in the people registry. Start with 24–30 only after their bases, booking agencies, licenses, availability, tactics attributes and riding arrangements are integrated. Also reconcile existing farm principals, agents, veterinarians, farm managers and race officials by ID rather than inventing substitutes.

## Eight proposed pilot racecourses (all already in the registry)
Some of the 93 ownership-linked horses are based at **14** distinct tracks. Outside these eight, their original track IDs must remain intact as reference-only or as later circuits. Do not silently transfer horses into the pilot.

| Immutable Track ID | Existing name | Geographic location | Total opening horses based there in 267 records |
|---|---|---|---:|
| `T-0001` | Aqueduct | South Ozone Park, New York, USA | 19 |
| `T-0008` | Laurel Park | Laurel, Maryland, USA | 1 |
| `T-0012` | Charles Town | Charles Town, West Virginia, USA | 32 |
| `T-0014` | Keeneland | Lexington, Kentucky, USA | 11 |
| `T-0017` | Gulfstream Park | Hallandale Beach, Florida, USA | 2 |
| `T-0020` | Tampa Bay | Oldsmar, Florida, USA | 11 |
| `T-0028` | Santa Anita | Arcadia, California, USA | 11 |
| `T-0039` | Woodbine | Toronto, Ontario, Canada | 8 |

These eight allow Kentucky breeding, Northeast/Mid-Atlantic, Florida winter racing, West Coast and Canada to be represented. Actual Jan–Dec 1999 fixture windows are separately subject to calendar authority.

## Target sizes — a TESTABLE, closed starting universe, not arbitrary caps
| Entity class | First complete pilot target | Already in source / action |
|---|---|---|
| Breeding, bloodstock and breed-to-race organizations | 16 named anchors | All 16 named/ID-backed above |
| Racing owners, syndicates and stables | 14 named anchors | All 14 named/ID-backed above |
| Physical facilities (not organization aliases) | 16–24 actual sites | Link existing categories: racing stable, farm, stud farm, breaking/training; property IDs/geography/capacity must be established |
| Trainers | 20–24 | 15 must be included by actual horse links; supplement with existing trainers, not duplicate names |
| Jockeys | 24–30 | 37 named sources available; bookings and agent contracts must be valid |
| Farm/owner principals & key managers | ~20 | Select and reconcile roles from existing 154 people; no forced principal assignments |
| Race secretaries | 8 | 15 recorded; link to specific pilot tracks through confirmed employment records |
| Essential staff & service providers | 15–25 | Add only if needed for tested management actions and not already present, using the personnel engine with stable IDs |
| Playable tracks | 8 | Exactly the course IDs above; others stay available as references, not deleted |
| Living 1999 horses | **~750–1,000 total** | Protect all 317 existing rows; add only relationship-closed supporting stock to sustain realistic competition, breeding and auctions |
| Historical ancestors | As many as pedigree closure requires | Reference historical IDs; ancestors are **not** duplicate living 1999 horses |
| Auction / bloodstock operators | 2–3 active arrangements | Start by reconciling existing Morningstar and Argosy entities; do not equate agencies with auction venues |

`~750–1,000` is a sizing **proposal**, not an approved forecast or gameplay requirement. If 8 courses cannot field realistic races with selected horses, increase the supporting population or reduce live meet volume rather than faking results.

## Release gates — how to know the pilot really works
1. **Identity and geography:** Every active entity has one permanent ID, type, physical home/base, valid dates and no conflicting identity. An organization may own multiple properties. No generic missing-parent placeholders.
2. **Pedigree closure:** Sire/dam links always resolve to a matching, age-possible biological parent. Ancestors referenced from older records are linked, not regenerated. Preserve breeding strategies, ownership and covering evidence.
3. **Operating roles:** Every stable horse has valid owner(s), trainer/boarding facility and rest/health state. Jockeys, employees and agents have appropriate contracts or explicit free-agent status.
4. **Economic opening balance:** The game engine accepts complete, internally balancing assets, debts, contracts, stud fees, staff wages and commitments; no fake historical payment is settled at opening.
5. **Live test:** Controlled January 1 → January 31 session with properly filled eligible race fields, breeding plans/coverings, sales, shipping, health, owner consent, trainer/jockey decisions, invoices, payroll, purses and expenses. Every action receives an authoritative engine event or explicit refusal.
6. **Every-entity QA:** Static closure tests run on 100% of pilot IDs; gameplay tests cover every action type and negative case, plus each role/status class. Verify that no entity loses its links after save/reload.
7. **Scale test:** Re-run the identical test suite with ~5k, ~25k, ~87.5k and up to ~325k total horse profiles **without changing core rules or silently remapping IDs**. The engine window owns simulation, financial settlement, save/replay and load testing. This website window owns profile/render/navigation checks.

**Approval gates:** User must confirm the anchor roster and any omitted preferred major players before the world owner promotes a seed. The full Drive v3.3 remains the source authority, and the website must not display generated claims as sourced historical evidence.
