# WIRE TO WIRE — V13 generational fictional naming (1999–2099)

## Scope and requirement

V13 enables ON-DEMAND names for new people entering the racing industry in later career years. It does not change any current person, owner, trainer, jockey, farm, 1999 historical record, racecourse, horse, active gameplay roster or UI screen.

The January 1, 1999 name engine stays frozen: the existing 1999 scenario continues to return its original identity records, 1999 model schema and name manifest fingerprint. Later years use a separate V13 cohort model. Names are generated only when callers request them.

## Birth year determines names, not the current career year

- The existing role-based fictional age model chooses a plausible professional age. For example, a new professional arriving in 2030 may have been born in the 1970s, 1980s, 1990s or 2000s.
- For birth years 1910–1989, the engine reuses the established 1999-era cohort logic and country/culture pools. No existing 1999 names change.
- U.S. births in the 1990s, 2000s, and 2010s use the official Social Security Administration top-30 birth-decade name tables, with a declared rank-biased GAME draw. These rankings describe national birth name frequencies by SSA recorded sex category, not racing-industry name frequencies or anyone's gender identity.
- U.S. births in 2020–2025 use the official SSA PARTIAL 2020s table based on six years. A 2020–2025 surname or given-name draw is not a completed 2020s birth-decade forecast.
- Births after 2025 are clearly labeled as EDITORIAL_FUTURE_*_NOT_OBSERVED. The algorithm reuses plausible observed/curated names and blends pools; it does NOT pretend that any 2030–2089 popularity ranking is observed or predictable.
- The 22 supported birthplace/culture profiles keep separate given-name vocabularies and retain their established culturally consistent surname pools. The Canada EN/FR and Britain English/Scottish/Welsh selection stays consistent for the whole name. All modern international weights and name additions are editorial, not national statistical birth registers.

SSA direct sources (reviewed November 13, 2026):

- https://www.ssa.gov/oact/babynames/decades/names1990s.html
- https://www.ssa.gov/oact/babynames/decades/names2000s.html
- https://www.ssa.gov/oact/babynames/decades/names2010s.html
- https://www.ssa.gov/oact/babynames/decades/names2020s.html

## Existing APIs now accept a later generation year

- createFictionalWorldNameEngine({worldId,seed,year,...}) supports synthetic naming years 1999–2099; default 1999 retains byte-for-byte backward compatibility. A later-year output has generationalNameModel and per-person generationalNameEvidence metadata.
- generateOnDemandFictionalNames({state,year,...}) is still a legacy V8 checkpoint path. When year is omitted during continuation, it retains state.year; old previously issued names and owners are never rewritten.
- generateIndexedFictionalNames({registry,cursor,year,...}) remains the preferred compact V11 naming path. The cursor defaults to its prior year, may advance forward, but refuses to travel backwards and keeps stable names, ID namespaces and partnership limits.
- The V12 durable naming service generate({year,...}) now advances the career naming year while maintaining its atomic IndexedDB registry transaction and save/recovery guarantees. After restart, omitted year resumes the latest saved cursor year.

**Year progression is monotonic.** A new 1999 request may be followed by a 2010, 2030 or 2050 request; a subsequent request with year 2010 after year 2050 is rejected. This prevents accidental creation of period-inappropriate people due to a stale or rewound naming clock. Advancing the naming clock does not age or rename already generated people; those careers and retirements belong to separate game systems.

The generator's older 1999 role-origin distributions remain editorial scenario defaults for later-year name requests. They must not be represented as measured modern jockey or trainer nationality percentages. Caller-supplied colony/country mixes remain available.

## Testing

Run node --test tests/1999-fictional-generational-naming-v13.test.mjs.

The suite locks a known 1999 output manifest and first-person identities; checks SSA top-30 names, source provenance and 2020–2025 partial-data boundaries; verifies surnames across Canadian and British subcultures plus Latin America, Europe, the Middle East and East Asia; exercises 2010/2030/2050/2099 populations as disposable samples; and tests forward-only V8, V11 and restart-safe V12 on-demand cursor continuity. The test does NOT insert these disposable people into the playable world.

## Limitations

Names and cultured given-name pools are editorial patterns, not legal-name clearance, official business registrations, verified historical immigration flows, or predictions of future naming fashion. For years after 2025, the engine labels projections rather than fabricating observed data. V13 does not create family pedigrees, change existing last names, assign horses, or automatically populate any roster.
