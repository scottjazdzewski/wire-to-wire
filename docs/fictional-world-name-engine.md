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
