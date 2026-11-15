/**
 * Fictional 1999 whole-industry population authority.
 *
 * LEGACY FIXED-COHORT REFERENCE ONLY. The active variable-range scenario
 * authority is fictional-industry-ecosystem-1999.mjs. Do not use this fixed
 * 248,000-horse plan for new world generation.
 * Counts are scenario assumptions, NOT historical US census claims.
 * The opening world separates registered animals from named race-ready horses.
 * Birth cohorts reconcile to an annual 40,000 foal crop. Unnamed youngstock
 * retain IDs, parentage, ownership, foaling location and health/development
 * state, without reserving a permanent racing name.
 *
 * This is a pure planning contract. The storage/streaming world builder must
 * materialize cohorts in bounded batches rather than one giant game snapshot.
 */
export const INDUSTRY_POPULATION_1999_SCHEMA='WTW_INDUSTRY_POPULATION_1999_V1';
export const INDUSTRY_POPULATION_1999=Object.freeze({
 schema:INDUSTRY_POPULATION_1999_SCHEMA,year:1999,
 annualFoalCrop:40000,
 breeding:{broodmares:50000,stallions:5000},
 youngstock:{foalsAndWeanlings:40000,yearlings:40000,twoYearOlds:38000},
 older:{threeYearOlds:30000,fourYearOlds:25000,fivePlus:20000},
 naming:{youngstock:'ID_ONLY_UNTIL_RACING_NAME_REQUEST',
  racing:'PROVISIONAL_EDITABLE_AT_TRACK_READINESS'},
 economics:{breedingStockSeparateFromRaceRoster:true,
  noAutomaticDoubleCounting:true},
 provenance:'OWNER_APPROVED_FICTIONAL_SCENARIO_TARGET'
});
export function calculate1999IndustryPopulation(spec=INDUSTRY_POPULATION_1999){
 const breeding=spec.breeding.broodmares+spec.breeding.stallions;
 const youngstock=Object.values(spec.youngstock).reduce((a,b)=>a+b,0);
 const older=Object.values(spec.older).reduce((a,b)=>a+b,0);
 const total=breeding+youngstock+older;
 return {breeding,youngstock,older,total,
  twoYearOldRetention:spec.youngstock.twoYearOlds/spec.annualFoalCrop,
  threeYearOldRetention:spec.older.threeYearOlds/spec.annualFoalCrop,
  fourYearOldRetention:spec.older.fourYearOlds/spec.annualFoalCrop,
  cohorts:{...spec.breeding,...spec.youngstock,...spec.older}};
}
export function validate1999IndustryPopulation(spec=INDUSTRY_POPULATION_1999){
 if(spec?.schema!==INDUSTRY_POPULATION_1999_SCHEMA)throw Error('Unknown industry population schema');
 const groups=[spec.breeding,spec.youngstock,spec.older];
 if(!Number.isSafeInteger(spec.annualFoalCrop)||spec.annualFoalCrop<1||
  groups.some(g=>!g||Object.values(g).some(n=>!Number.isSafeInteger(n)||n<0)))
  throw Error('Invalid industry cohort count');
 if(spec.youngstock.foalsAndWeanlings>spec.annualFoalCrop||
  spec.youngstock.yearlings>spec.annualFoalCrop||
  spec.youngstock.twoYearOlds>spec.annualFoalCrop||
  spec.older.threeYearOlds>spec.annualFoalCrop||
  spec.older.fourYearOlds>spec.annualFoalCrop)
  throw Error('Cohort exceeds annual crop without an explicit migration ledger');
 const {total}=calculate1999IndustryPopulation(spec);
 if(total>1000000)throw Error('Opening industry exceeds bounded scenario contract');
 return spec;
}
