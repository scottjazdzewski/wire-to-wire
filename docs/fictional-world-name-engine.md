# Wire to Wire — Fictional world name engine (V1)

## Scope
This is a standalone creation-time identity factory, not a new game save, history importer, or UI change.

Module: public/1999/engine/fictional-world-name-engine.mjs

Function: createFictionalWorldNameEngine(spec)

It proposes deterministically named people (trainers, jockeys, owners and support staff), owner organizations and linked principals, racing stables/barns, general farms, studs, nurseries, bloodstock farms, and independent breaking/training operations. It does NOT generate horses, racecourses, betting, gameplay events, or histories; other engines own those records.

**No game save, canon, database, API or screen is modified when this function is called.** Results are frozen in-memory JavaScript objects.

## Full-sized 1999 fictional world

    import {createFictionalWorldNameEngine}
      from './public/1999/engine/fictional-world-name-engine.mjs';

    const roster=createFictionalWorldNameEngine({
      worldId:'my-world-001', seed:19990101, year:1999
    });

    // roster.manifest, roster.people, roster.owners, roster.stables,
    // roster.farms, roster.trainingCenters; no save method.

Defaults: 11,202 people including 3,308 owner principals, 3,308 owner entities, 4,200 trainer-linked racing stables, and 900 breeding facilities: 490 general farms, 240 stud farms, 105 nurseries and 65 bloodstock operations. Independent breaking/training count is zero unless requested. These are identity proposals, not properties added to the live world.

## Custom fictional world

    const roster=createFictionalWorldNameEngine({
      worldId:'regional-001',seed:103579,year:1999,
      roles:{trainer:75,jockey:40,assistant_trainer:25,
             groom:90,farm_manager:20,veterinarian:6},
      owners:120,
      facilities:{generalFarms:18,studFarms:9,nurseries:3,
                  bloodstockFarms:2,breakingTraining:12},
      protectedNames:['Kingsmere Farm','Crescent Mile Stud'],
      markets:[
        {id:'lexington-ky',city:'Lexington',region:'Kentucky',
         country:'United States',code:'US',weight:3,breeding:true},
        {id:'ocala-fl',city:'Ocala',region:'Florida',
         country:'United States',code:'US',weight:2,breeding:true}
      ],
      originWeightsByRole:{jockey:[['US',50],['PR',30],['PA',20]]}
    });

## Contract

- Same seed + same configuration + same engine version means identical name, identity key, location, and relationship. A changed seed creates different names without renumbering the world's ID namespace.
- World IDs must be 2–48 characters, starting with a letter and containing only letters, digits and hyphens.
- Roles: trainer, jockey, farm_manager, veterinarian, farrier, bloodstock_agent, racing_secretary, assistant_trainer, jockey_agent, exercise_rider, groom. Owner people are created by the owners count.
- Geography: configurable real-world geographic markets for fictional operations; person's modeled country of origin is not necessarily their operating country. The engine does not claim a birthplace city.
- Each trainer-linked racing stable gets the trainer's market. Ownership entities link to their owner principal. Breeding farms prioritize markets tagged breeding:true.
- Farm/stud/nursery/bloodstock counts are exact. Breaking and training operations are distinct from racing stables.
- Protected names are reserved. Within each world, business and personnel name registries forbid exact duplicates and reuse the existing business-root similarity guards.
- Numeric person names, stacked middle initials, invalid input, and unsupported country pools fail closed.
- Supported naming era is presently 1999 only. Earlier/later cohorts and detailed regional statistical frequency tables must be added before claiming historical-era naming accuracy. International names are editorial models rather than census-derived frequencies.

## Future world-reload integration

The future atomic world-creation pipeline should combine these proposed identities with independently generated horses, tracks, pedigrees, event schedules, economics and gameplay relationships, validate all joins, and ONLY THEN save a completed world. The naming module itself intentionally does not import the current canon, touch the existing 1999 world or silently regenerate names under an existing saved game.

## Tests

    node --test tests/1999-fictional-world-naming-engine.test.mjs
    npm test

Coverage includes full size, small size, exact facility kinds, geography, protected names, deterministic reloads, cross-entity owner/trainer links, role-specific naming origins, and invalid settings.

## Relationship integrity and name quality — V2

The engine now verifies more than the uniqueness of identity keys:

- Named family ownership operations use the declared principal's surname, not a separately sampled family surname. Owners expose `principalRelationship` and (when applicable) `familyName`. These are business-identity links, not fabricated genealogy or legal documents.
- `owner.principalId` is reciprocated by `person.organizationId`, and `stable.trainerId` by `person.stableId`. Both pairs share a geographic operating market.
- Every available `farm_manager` is assigned deterministically to one farm when the world contains farms. Farm records carry `managerIds` and linked people carry `farmId`. A manager's operating location is that farm's locality. In a world with zero farms, managers remain unassigned (`farmId:null`) rather than receiving fictitious farms. Multiple managers can serve the same farm in a high-staff/low-farm scenario.
- The first-and-last-name pairing is limited to two uses in a generated fictional world, regardless of added initials or titles. Exact full-name collisions remain forbidden and identical given/surnames such as Thomas Thomas are rejected. Natural common first names and surnames remain possible.
- Role counts have canonical ordering, so semantically identical configuration objects with differently ordered JSON properties yield the same identities. Unknown facility purposes fail validation rather than being silently ignored.
- These safeguards apply to the **standalone fictional-world factory**. The existing January 1999 world remains untouched; its current naming APIs retain backward-compatible defaults.

Tested with full-size 11,202-person and 8,408-organization populations, with reciprocal link checks and zero family-principal mismatches. Horse pedigrees, track dates, owners of horses, player actions and actual world persistence remain responsibilities of the future higher-level atomic world builder.

## Jockey-colony authenticity (V3)

The standalone fictional-world naming engine now models **the rider's operating racing colony before selecting the fictional person's naming-origin pool**. This prevents 1,800 riders from drawing from one global country percentage or being assigned indiscriminately to stud-farm towns. Default modeled circuit hubs cover New York, South Florida, Southern California, Kentucky, Mid-Atlantic, Louisiana, and Ontario, with fallback profiles for other U.S., Canadian, and international markets.

### 1999 editorial defaults, not observed historical statistics

The modeled percentages assigned to Latin American/Caribbean birthplace/naming pools in the default jockey profiles are:

- South Florida: 67%
- Southern California: 61%
- New York: 60%
- Kentucky: 54%
- Mid-Atlantic: 51%
- Louisiana: 46%
- Ontario: 34%
- Other United States: 49%

**These percentages are deliberately selected *fictional population weights*, NOT sourced historical track-colony measurements.** They are informed qualitatively by the strong Latin American jockey pipelines described in:
- 1990 Associated Press / Los Angeles Times on Chilean jockey José Santos moving from the New York colony to California: https://www.latimes.com/archives/la-xpm-1990-11-07-sp-3941-story.html
- February 2000 Washington Post reporting on a Panamanian jockey entering the Gulfstream Park colony and Florida's Latin-connected racing workforce: https://www.washingtonpost.com/archive/sports/2000/02/26/looking-for-a-long-shot-jockey-there-is-good-reason-to-take-pitty/21d79be1-8a9b-4e02-aa15-fc528544ebc1/
- PBS historical account of Caribbean and Latin American jockey schools: https://www.pbs.org/newshour/nation/the-kentucky-derby-has-a-secret-latino-history

The mix supports Puerto Rico, Panama, Venezuela, Mexico, Colombia, the Dominican Republic, Peru, Chile, Argentina, Brazil, Uruguay, and non-Latin pools. There are separate curated Portuguese-language Brazilian naming pools. All origin country codes are geographical modeling inputs, not inferences about anyone's race, ethnicity, legal citizenship, or immigration status. **Puerto Rico is a U.S. territory**, not a foreign nationality.

### Configuration

A market may set `racing:false` to exclude it from jockey bases (e.g. breeding-only Ocala) while still allowing farms, owners, and other people to operate there. For custom markets, `racing` defaults to `true`; an explicit `jockeyColony` may override region/city inference.

Example:

    createFictionalWorldNameEngine({
      worldId:'florida-world',seed:19990101,year:1999,
      markets:[
        {id:'ocala-fl',city:'Ocala',region:'Florida',
         country:'United States',code:'US',weight:4,breeding:true,racing:false},
        {id:'hallandale-fl',city:'Hallandale Beach',region:'Florida',
         country:'United States',code:'US',weight:3,breeding:false,
         racing:true,jockeyColony:'SOUTH_FLORIDA'}
      ],
      jockeyOriginWeightsByColony:{
        SOUTH_FLORIDA:[['PA',25],['PR',20],['VE',20],['MX',10],['US',25]]
      }
    });

Priority is: specific `jockeyOriginWeightsByColony` override, then a caller-provided `originWeightsByRole.jockey` global override, then the default circuit mix. Every rider record includes `jockeyColony` and `riderOriginModel`; the manifest carries `jockeyColonyNameModel`, and all geography/profile configuration affects the deterministic fingerprint. An invalid colony, unsupported country code or world containing jockeys but no racing market fails before a roster is returned.

This change modifies **only the standalone generation engine**, not existing game rosters, canonical 1999 people, racing dates, track identities, horse names, UI layouts or persistence.

## Birth-generation first names for fictional 1999 US people (V4)

A 70-year-old trainer and a 20-year-old jockey now use **their modeled birth decades**, rather than a common 1990 national name list, when the generated person has U.S. origin. The first name is selected **after** the engine determines the person's age and birth year. Source: [Social Security Administration, U.S. popular birth names by decade](https://www.ssa.gov/oact/babynames/decades/), decade-specific top-30 ranks for the 1910s, 1920s, 1930s, 1940s, 1950s, 1960s, 1970s and 1980s.

- The new `person-birth-cohort-names.mjs` module contains the recorded top-30 *rank ordering* for each decade and the two SSA name-table sexes. Its drawing weights are an **editorial rank-biased approximation**, not recorded real-world first-name probabilities, professional gender distributions or population demographics.
- Each U.S.-origin fictional person exposes `givenNameDecade` consistent with `birthYear`. Their `nameOrigin` identifies the source/rank-draw method and the world manifest records `usBirthCohortNameModel`.
- People from outside the U.S. retain their country-specific curated name pools and their distinct `CURATED_COUNTRY_TEST_POOL_NOT_CENSUS` provenance. Do not present SSA names as a British, Canadian or Latin American birth-name source.
- Jockey-colony origin weights, country/geographic location, role-based age ranges, unique-name safeguards and protected historical names continue to work. The new age-specific selection does **not** assign different ancestry or citizenship based on a name.
- The feature is opted into by `createFictionalWorldNameEngine` **only**. All prior existing-world call sites to `createGeographicNameRoster` and `createPersonnelNameRoster` behave as before because the new birth-decade callbacks are optional.
- This feature is still only a name-generation improvement, not a horse, pedigree, racetrack, history or save loader. Support for validated non-U.S. birth-generation statistics is a future independent naming task.

Run `node --test tests/1999-fictional-birth-cohort-names.test.mjs` to validate decade coverage, exact cohort matching, source labeling and absence of current-world writes.

## Latin American and Caribbean fictional personal names (V5)

The standalone naming engine now includes **11 distinct curated geographical name ecologies**: Puerto Rico (U.S. territory), Panama, Venezuela, Mexico, Chile, Peru, Colombia, Dominican Republic, Argentina, Uruguay and Brazil. Jockey-colony location still determines the probabilistic origin mix; the chosen *fictional origin* selects a country-specific given-name and surname inventory. Names are not used to infer a real person's ethnicity, race, nationality or immigration status.

Source/evidence boundaries:
- The naming customs of two family surnames, the father's first surname followed by the mother's in many Spanish-speaking settings, are described in the [Associated Press explainer](https://apnews.com/article/1f4b916b737717ae8594b3ee22948694) and [U.S. DHS SSA name-documentation guidance](https://risos-apa-production-public.s3.amazonaws.com/DHS/DHS_554_.pdf).
- The [SSA Puerto Rico territory births table](https://www.ssa.gov/oact/babynames/territories.html) demonstrates that Puerto Rico has a separately published naming population. **The new Latin country pools and their age-band preferences are *fictional editorial approximations*, not extracted historical civil registry rankings or measured 1999 frequencies.** Brazilian given names are Portuguese rather than generic Spanish.
- All names preserve accents in their display forms while duplicate detection folds accents and punctuation. This avoids separate "José García" and "Jose Garcia" identities that visually refer to the same full name.

The engine's age bands distinguish people born **before 1960** from those born **1960–1989**; this is not a claim about precise decade-by-decade popularity outside the U.S. U.S.-origin persons continue to use their verified SSA top-30 birth-decade first-name corpus. Latin/Caribbean people expose `regionalNamingCohort` and a correctly labeled `nameOrigin`; their `givenNameDecade` remains null because it is reserved for the independently sourced U.S. SSA decade naming tables.

The optional fictional-world personnel style now generates a mixture of ordinary names, compound given names (such as José Luis), two-surname forms and compound-plus-two-surname forms. Spanish-pattern two surnames place the paternal surname first; the Brazilian Portuguese pattern places the primary paternal surname last when both are present. Every record retains `primarySurname` for correct owner-family and trainer-racing-stable naming regardless of the display name's word order. Personal and organization IDs are unchanged by these spelling conventions.

### Quality controls

`tests/1999-fictional-latin-caribbean-names.test.mjs` covers country-specific pools, age bands, Portuguese-specific Brazilian names, accents, 11 forced-country rider populations, full-size 11,202-person 1999 fictional identity generation, double surnames, family-principal names, deterministic seeds, protected names and isolation from current historical game records.

This is **a naming engine only**. It does not populate the early world, create jockey assignments or race outcomes, change the UI, or modify any existing playable name records.

## International racing professionals — V6 (1999 fictional-world naming)

The standalone fictional-world identity generator now has **separate, curated names for British, Irish, French, German, Japanese, Australian, New Zealand, Canadian, United Arab Emirates, and Hong Kong** personnel. Names reflect a coarse older (birth before 1960) / younger (1960–1989) first-name inventory rather than using a small universal English-language name list. The module `public/1999/engine/international-professional-names.mjs` is a **fictional editorial lexicon, not a source-certified national births database**. Canadian name pools cover Anglophone and Francophone usage. Irish surnames retain apostrophes, French/German accents are preserved, and Japanese personal names are displayed in English-language given-name-first order. Gulf names use plausible transliterated family names without automatically granting inherited or religious titles. HK is Hong Kong (a Special Administrative Region in 1999), not a sovereign-country assertion.

### Role-weighted international exposure

The default 1999 North American fictional naming distribution now distinguishes three internationally connected professions:

| Role | U.S.-origin weight | Selected added origin pools |
| --- | ---: | --- |
| Trainer | 61% | Canada, Britain, Ireland, France, Germany, Australia, New Zealand, Japan, UAE |
| Owner principal | 55% | Canada, Britain, Ireland, France, Germany, Japan, Australia, New Zealand, UAE, Hong Kong |
| Bloodstock agent | 40% | Britain, Ireland, France, Germany, Australia, New Zealand, Japan, Canada, UAE |

**These weights are editorial fiction-generation choices, not measured 1999 workforce statistics.** All three profession mixes preserve Puerto Rican, Mexican, Venezuelan and Panamanian naming representation alongside the added international pools; Latin American coverage is not restricted to jockeys. They reflect the qualitative reality of international breeding and sales activity, supported by contemporary reporting such as [September 1999 Thoroughbred Daily News international sales](https://www.thoroughbreddailynews.com/pdf/tdn/1999/tdn990929.pdf), [December 1999 TDN yearling-sales review](https://www.thoroughbreddailynews.com/pdf/tdn/1999/tdn991221.pdf), and a [1992 U.S. GAO report on international Thoroughbred competition and travel](https://gao.justia.com/department-of-agriculture/1992/10/international-trade-ggd-93-15/). These sources establish international relationships, **not the exact percentages in this model**.

Explicit caller-supplied `originWeightsByRole` override the corresponding editorial profession distribution. All previously supported 1999 jockey-colony rules remain independent, including Latin American rider representation and custom colony mixes. The new country pools are applied whenever that country is selected, including for other professions where the origin already occurs; the three new default international mixes apply only to `trainer`, `owner`, and `bloodstock_agent`.

Each fictional person retains its protected display name, `primarySurname`, stable/organization relationship and country source label. International names expose `internationalNamingCohort` and an explicit `INTERNATIONAL_1999_CURATED_PROFESSIONAL_COHORT_NOT_CENSUS` provenance. The factory manifest records `internationalProfessionalNameModel`, and the versioned V6 model identifier participates in the naming-spec fingerprint. Latin/Caribbean names remain on their distinct V5 model; U.S. birth-decade names retain their SSA source. Location is the *operating market*, not necessarily a person's birth country; V6 changes naming, not world geography.

Run `node --test tests/1999-fictional-international-professional-names.test.mjs` to verify source boundaries, all ten international naming inventories, origin-weight distributions, full-population collision/relationship safety, every country-forced profession, deterministic output and noninterference with the active world.

**Strict scope:** in-memory fictional naming proposals only. The existing 1999 world, live horse ownership, racing stables, history, save files, UI, and site data are not repopulated or edited.
