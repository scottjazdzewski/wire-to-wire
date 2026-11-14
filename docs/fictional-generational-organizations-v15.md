# Wire to Wire — V15 generation-aware ownership, farm and racing-stable names

## Scope: naming machinery, not population

V15 extends fictional racing-industry organization names across game years 2000–2099. **No existing owners, people, horses, farms, barns, ownership relationships, racecourses, historical records, game saves or UI are populated or modified by this release.** The approved 1999 naming engine and complete 1999 identity outputs remain frozen.

The pre-existing regional naming vocabulary remains foundational. Racing organizations can have a straightforward family or individual principal, a landholding identity rooted in a real geographic market, or a limited formal racing partnership. The name generator does not invent new human partners, family relationships, legal incorporation, or ownership of any horse.

## V15 period styling

- **1999 — FROZEN_1999:** the original V7/V8 contextual organization names, manifests and identity order are retained byte-for-byte.
- **2000–2019 — EARLY_21ST_CENTURY:** conservative landholding names, family racing operations, private thoroughbred businesses, and limited named clubs and syndicates.
- **2020–2049 — CONTEMPORARY_EDITORIAL:** established racing language, diversified family and private racing firms, concise stable names, and a controlled share of formal group labels.
- **2050–2099 — FUTURE_EDITORIAL:** deliberately restrained, plausible future racing-business terminology. This is an editorial continuation, not a prediction about future company registration law, business popularity, or naming fashions.

The period model is `WTW_GENERATIONAL_RACING_ORGANIZATIONS_V15`. Period boundaries change the **style mix**, not an organization's actual founding date. The established personal principal's primary surname is passed to the owner and trainer/stable naming routines; a family operation is only identified as a family business when its principal's surname matches. A farm may have a proposed namesake surname, but that is *not* proof of a link to an owner or manager.

## What is generated

- **Owner businesses:** individuals, real-principal-surname operations, family racing businesses, private racing firms, occasional company-form labels, and a limited number of formally named partnerships.
- **Racing stables / barns:** use the trainer's established real fictional name or primary surname, sometimes combined with a geographically appropriate landholding root. The module does not create a new trainer just because it creates a stable label.
- **Farms:** stay tied to farm purpose — general farm, stud, broodmare nursery or bloodstock facility — and the existing actual operating market. Stud names include a suitable stud/stallion ending, nurseries a nursery ending and bloodstock operations a relevant term.
- **Breaking and training facilities:** use geography-appropriate roots and descriptions such as Training Center, Pre-Training, Young Horse Training or Horse Development.

These are generated name *proposals*, not new game entities. All candidate names pass through the existing cross-category normalized-name and organization-root collision index, protected historical-name checks and disallowed awkward-phrase rules.

## Partnership economy and persistent reuse

The V8/V11 on-demand naming API and V12 durable registry remain the authoritative layer for identity reuse, permanent owner IDs and accumulated partnership limits. **V15 does not introduce a partnership per horse or per new stable.** It only diversifies candidate names before the existing `maxPartnershipGroups` limit and registry safeguards are applied.

Once the partnership name cap is reached, owners can still have individual, private, family and non-partnership organization names. Previously generated owner and group identities remain available for reuse through `listOwners` and `listGroups`. A generator request that asks for new names does not automatically assign them to horses.

## API

The existing `createFictionalWorldNameEngine({year,worldId,seed,roles,owners,facilities,ownerNamingPolicy,...})` factory now chooses V15 organization styles only when year is later than 1999. Calling it with omitted year or `year:1999` follows the original name-generation path. Later-era results include `generationalOrganizationNameModel`, `generationalOrganizationPeriod` and organization-level `organizationNamingPeriod` and `organizationNamingModel` provenance fields.

All formerly supported `generateIndexedFictionalNames({registry,cursor,year,...})` and V12 durable `naming.generate({year,...})` calls pick up V15 automatically for **new** names after 1999. Existing records already stored in the registry are not renamed, migrated or reassigned. Both services still use a small cursor with the index maintained separately.

## Verification

Run `node --test tests/1999-fictional-generational-organizations-v15.test.mjs` for 1999 fingerprint, direct candidate, period/style, principal surname, naming-region, facility terminology, legacy compatibility and corrupt-record regression checks.

Run `npm run bench:names:generations` for the shared V10 + V14 + **V15** quality gates on disposable 1999–2099 naming batches. The benchmark checks naming consistency, identity integrity, generation-appropriate people, business records and partnership caps without writing any playable world or browser save.

Independent QA uses `auditGenerationalOrganizationNames(world,{expectedYear,partnershipLimit})` to verify the generated business period, owner archetype, family-name/principal integrity, trainer/stable links and partnership budget. This is not legal company-name clearance or a census of real racing organizations.

## Explicit limits

The style periods and candidate templates are curated fictional-game rules, not scientifically measured growth of family businesses or predictions of how a racing industry may organize in 2075. The generator does not claim a real company exists, does not populate the active world, does not draw or edit images, and does not create any new person/horse relationships.
