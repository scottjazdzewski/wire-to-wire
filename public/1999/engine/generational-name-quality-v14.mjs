/**
 * WTW V14 — read-only birth-generation quality gate for fictional racing people.
 *
 * Checks ONLY disposable identity proposals, not real people. It never names,
 * creates, edits, commits, or populates a game-world person or horse.
 *
 * 1999 identities are also auditable without triggering any V13 generator
 * behavior. Future/cohort quality is explicitly editorial where real SSA
 * records do not exist.
 */
import {
 generationalGivenPool,generationalGivenNameEvidence,
 GENERATIONAL_PERSON_NAME_MODEL
} from './generational-person-names-v13.mjs';
import {
 isLatinCaribbeanNamingOrigin,regionalSurnamePool
} from './latin-caribbean-person-names.mjs';
import {
 isInternationalProfessionalNamingOrigin,internationalSurnamePool
} from './international-professional-names.mjs';
import {
 supportsInternationalSubculture,culturallyConditionedSurnamePool
} from './international-name-cultures.mjs';

export const GENERATIONAL_NAMING_QUALITY_MODEL='WTW_GENERATIONAL_NAME_QUALITY_V14';
const MAX_SAMPLES=32;
const normalize=x=>String(x??'').normalize('NFKD')
 .replace(/[\u0300-\u036f]/g,'').toLowerCase()
 .replace(/[^a-z0-9]+/g,'');
const codePrefix=/^Dr\.\s+/;
function addIssue(issues,counts,code,person,extra=null){
 counts[code]=(counts[code]||0)+1;
 if(issues.length<MAX_SAMPLES)issues.push(Object.freeze({
  code,personId:person?.id??null,
  name:person?.name??null,
  birthCountry:person?.birthCountry??null,
  ...(extra===null?{}:{details:extra})
 }));
}
function expectedSurnamePool(country,culture){
 if(isLatinCaribbeanNamingOrigin(country))return regionalSurnamePool(country);
 if(supportsInternationalSubculture(country))
  return culturallyConditionedSurnamePool(country,culture);
 if(isInternationalProfessionalNamingOrigin(country))
  return internationalSurnamePool(country);
 // US surname checking happens in geographic source model; not inferred
 // from another country's racial/ethnic name pool here.
 if(country==='US')return null;
 throw Error('Unsupported fictional origin '+country);
}
const sortedCounts=m=>Object.freeze(Object.fromEntries(
 [...m].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
));
/**
 * Validate a GENERATED identity proposal for role, source and era cohesion.
 * Does not validate legality of any person/business name or measure actual
 * naming frequencies. Uses cached country/cohort pools for linear checking.
 */
export function auditFictionalGenerationalNameQuality(
 world,{expectedYear=null}={}
){
 if(!world||!world.manifest||!Array.isArray(world.people))
  throw Error('Invalid fictional naming population for generational QA');
 const year=world.manifest.year;
 if(!Number.isInteger(year)||year<1999||year>2099||
  (expectedYear!==null&&year!==expectedYear))
  throw Error('Generational naming year mismatch');
 const counts={
  INVALID_PERSON:0,AGE_YEAR_MISMATCH:0,INVALID_PROFESSIONAL_AGE:0,
  WRONG_GIVEN_COHORT:0,WRONG_CULTURAL_SURNAME:0,
  WRONG_GENERATIONAL_EVIDENCE:0,WRONG_NAME_SOURCE:0,
  INVALID_NAMING_CULTURE:0,LEGACY_1999_CHANGED:0
 };
 const issues=[],byDecade=new Map(),byCountry=new Map(),byEvidence=new Map(),
  givenNames=new Map(),surnames=new Map(),cachedPools=new Map(),
  cachedSurnames=new Map();
 let after1990=0,after2025=0;
 for(const p of world.people){
  if(!p||typeof p!=='object'||typeof p.name!=='string'||
   !p.name.trim()||!Number.isInteger(p.birthYear)||
   typeof p.birthCountry!=='string'||!p.birthCountry){
   addIssue(issues,counts,'INVALID_PERSON',p);
   continue;
  }
  const birthYear=p.birthYear,country=p.birthCountry,
   culture=p.internationalNameCulture??null;
  if(birthYear+p.ageAtOpening!==year)
   addIssue(issues,counts,'AGE_YEAR_MISMATCH',p);
  if(!Number.isInteger(p.ageAtOpening)||p.ageAtOpening<18||
   p.ageAtOpening>90)
   addIssue(issues,counts,'INVALID_PROFESSIONAL_AGE',p);
  if(supportsInternationalSubculture(country)&&
   !(culture&&((country==='CA'&&['CA_EN','CA_FR'].includes(culture))||
    (country==='GB'&&['GB_EN','GB_SCOT','GB_WALES'].includes(culture)))))
   addIssue(issues,counts,'INVALID_NAMING_CULTURE',p);
  const birthDecade=Math.floor(birthYear/10)*10;
  byDecade.set(String(birthDecade),(byDecade.get(String(birthDecade))||0)+1);
  byCountry.set(country,(byCountry.get(country)||0)+1);
  const first=p.name.replace(codePrefix,'').trim().split(/\s+/)[0];
  const prefix=country+'|'+(culture??'')+'|'+birthDecade;
  let profiles=cachedPools.get(prefix);
  if(!profiles){
   try{
    profiles=new Set([
     ...generationalGivenPool(country,culture,birthYear,false),
     ...generationalGivenPool(country,culture,birthYear,true)
    ].map(normalize));
    cachedPools.set(prefix,profiles);
   }catch(e){
    addIssue(issues,counts,'INVALID_NAMING_CULTURE',p,e.message);
    continue;
   }
  }
  if(!profiles.has(normalize(first)))
   addIssue(issues,counts,'WRONG_GIVEN_COHORT',p,
    'Given name '+first+' is absent from '+birthDecade+' '+country+' naming pool');
  const key=country+'|'+(culture??'');
  if(!cachedSurnames.has(key)){
   try{
    const pool=expectedSurnamePool(country,culture);
    cachedSurnames.set(key,pool===null?null:new Set(pool.map(normalize)));
   }catch(e){
    addIssue(issues,counts,'INVALID_NAMING_CULTURE',p,e.message);
    continue;
   }
  }
  const validFamily=cachedSurnames.get(key);
  if(typeof p.primarySurname!=='string'||!p.primarySurname.trim()||
   (validFamily&&!validFamily.has(normalize(p.primarySurname))))
   addIssue(issues,counts,'WRONG_CULTURAL_SURNAME',p);
  const evidence=generationalGivenNameEvidence(country,birthYear);
  byEvidence.set(evidence,(byEvidence.get(evidence)||0)+1);
  if(birthYear>=1990)after1990++;
  if(birthYear>=2026)after2025++;
  if(year===1999){
   if(Object.hasOwn(p,'generationalNameEvidence'))
    addIssue(issues,counts,'LEGACY_1999_CHANGED',p);
  }else{
   if(p.generationalNameEvidence!==evidence)
    addIssue(issues,counts,'WRONG_GENERATIONAL_EVIDENCE',p);
   // The legacy 1910–1989 source labels remain unchanged in all later
   // career years, but post-1989 new people must use explicit V13 labels.
   if(birthYear>=1990&&p.nameOrigin!==evidence)
    addIssue(issues,counts,'WRONG_NAME_SOURCE',p);
  }
  if(country==='US'&&p.givenNameDecade!==birthDecade)
   addIssue(issues,counts,'WRONG_GENERATIONAL_EVIDENCE',p,
    'US decade metadata does not match birth date');
  givenNames.set(normalize(first),(givenNames.get(normalize(first))||0)+1);
  surnames.set(normalize(p.primarySurname),
   (surnames.get(normalize(p.primarySurname))||0)+1);
 }
 const failed=Object.values(counts).reduce((a,b)=>a+b,0);
 return Object.freeze({
  model:GENERATIONAL_NAMING_QUALITY_MODEL,
  nameGeneratorModel:year===1999?null:GENERATIONAL_PERSON_NAME_MODEL,
  pass:failed===0,year,people:world.people.length,
  birthYearAfter1989:after1990,birthYearAfter2025:after2025,
  distinctGivenNames:givenNames.size,distinctSurnames:surnames.size,
  issueCounts:Object.freeze(counts),issueTotal:failed,
  birthDecades:sortedCounts(byDecade),namingOrigins:sortedCounts(byCountry),
  evidenceTypes:sortedCounts(byEvidence),
  issues:Object.freeze(issues)
 });
}
