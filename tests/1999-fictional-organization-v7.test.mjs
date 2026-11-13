import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 ORGANIZATION_STYLE_MODEL,organizationNamingRegion,organizationNamingEra,
 ORGANIZATION_NAMING_REGIONS,REGIONAL_NAMING_ANCHORS,
 contextualFarmCandidate,contextualOwnerCandidate,contextualStableCandidate,
 contextualBreakingCandidate
} from '../public/1999/engine/organization-naming-styles.mjs';
import {
 createOrganizationNameRoster,ORGANIZATION_NAME_MODEL
} from '../public/1999/engine/organization-name-engine.mjs';
import {
 createFictionalWorldNameEngine
} from '../public/1999/engine/fictional-world-name-engine.mjs';

const normalize=name=>String(name).normalize('NFKD')
 .replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
const badPhrase=/\b([a-z]+)\s+\1\b|\b(?:Equine|Thoroughbreds|Bloodstock)\s+(?:Farmstead|Acres|Stallion|Stud|Nursery)\b|\b(?:Farm|Farms|Stud|Nursery)\s+(?:Farm|Farms|Stud|Nursery)\b/i;
const makeMarket=(region,code='US')=>({
 id:'test-'+region.toLowerCase().replace(/ /g,'-'),
 city:'Test City',region,
 country:code==='CA'?'Canada':'United States',code,weight:1,racing:true,breeding:true
});
const noFacilities={generalFarms:0,studFarms:0,nurseries:0,bloodstockFarms:0,breakingTraining:0};

test('V7 geographic naming regions are grounded in facility working locations',()=>{
 assert.match(ORGANIZATION_STYLE_MODEL,/REGIONAL_V1/);
 assert.deepEqual([...ORGANIZATION_NAMING_REGIONS],[
  'KENTUCKY','FLORIDA','CALIFORNIA','NEW_YORK','MID_ATLANTIC',
  'ONTARIO','LOUISIANA','BRITAIN_IRELAND','GENERAL_NORTH_AMERICA'
 ]);
 for(const [region,code,expected] of [
  ['Kentucky','US','KENTUCKY'],['Florida','US','FLORIDA'],
  ['California','US','CALIFORNIA'],['New York','US','NEW_YORK'],
  ['Maryland','US','MID_ATLANTIC'],['Pennsylvania','US','MID_ATLANTIC'],
  ['Ontario','CA','ONTARIO'],['Louisiana','US','LOUISIANA']
 ])assert.equal(organizationNamingRegion(makeMarket(region,code)),expected,region);
 assert.equal(organizationNamingRegion({region:'Dublin',code:'IE'}),'BRITAIN_IRELAND');
 assert.equal(organizationNamingRegion({region:'London',code:'GB'}),'BRITAIN_IRELAND');
 assert.equal(organizationNamingRegion(makeMarket('Washington')),'GENERAL_NORTH_AMERICA');
 assert.ok(REGIONAL_NAMING_ANCHORS.length>145);
});
test('heritage naming is a style, never a fabricated farm founding date',()=>{
 for(const [year,style] of [[1925,'HERITAGE'],[1949,'HERITAGE'],
  [1950,'ESTABLISHED'],[1980,'ESTABLISHED'],[1981,'CONTEMPORARY'],[1999,'CONTEMPORARY']]){
  assert.equal(organizationNamingEra(19990101,4,'farm',year),style);
 }
 assert.throws(()=>organizationNamingEra(12,2,'farm',2000),/established year/);
 assert.throws(()=>organizationNamingEra(12,2,'farm',1710),/established year/);
 assert.throws(()=>organizationNamingEra(12,2,'farm','1925'),/established year/);
 for(const style of ['HERITAGE','ESTABLISHED','CONTEMPORARY']){
  const output=contextualFarmCandidate(19990101,10,1,'STUD_FARM',
   {region:'KENTUCKY',era:style,familyName:'Whitcomb'});
  assert.match(output,/\b(Stud|Stallion)\b/);
  assert.doesNotMatch(output,badPhrase);
 }
 assert.match(contextualOwnerCandidate(19990101,2,0,'David Mercer','Mercer',
  {region:'KENTUCKY',era:'HERITAGE'}),/Racing|Partners|Bloodstock|Thoroughbreds|Partnership|Syndicate|Stables/);
 assert.match(contextualStableCandidate(19990101,4,0,'Ana Ortiz','Ortiz',
  {region:'FLORIDA'}),/Ortiz|Training Barn/);
 assert.match(contextualBreakingCandidate(19990101,6,0,{region:'CALIFORNIA'}),
  /Training|Pre-Training|Horse Development/);
});
test('explicit regional organization contexts validate without modifying current game geography',()=>{
 const farmContexts=[
  {region:'KENTUCKY',establishedYear:1925,familyName:'Kerr'},
  {region:'FLORIDA',establishedYear:1995,familyName:'Sutton'},
  {region:'CALIFORNIA',era:'ESTABLISHED'}
 ];
 const args={seed:19990101,ownerCount:2,barnCount:2,farmCount:3,
  breakingCount:2,protectedNames:['Kingsmere Farm'],
  principalNames:['David White','Marie Roy'],principalPrimarySurnames:['White','Roy'],
  trainerNames:['Ana Ortiz','Charles Kerr'],trainerPrimarySurnames:['Ortiz','Kerr'],
  farmKindPlan:['STUD_FARM','FARM','THOROUGHBRED_NURSERY'],
  farmContexts,ownerContexts:[{region:'KENTUCKY'},{region:'ONTARIO'}],
  trainerContexts:[{region:'FLORIDA'},{region:'KENTUCKY'}],
  breakingContexts:[{region:'CALIFORNIA'},{region:'ONTARIO'}]
 };
 const roster=createOrganizationNameRoster(args);
 assert.equal(roster.model,ORGANIZATION_NAME_MODEL);
 assert.equal(roster.styleModel,ORGANIZATION_STYLE_MODEL);
 assert.equal(roster.owners.length,2);
 assert.equal(roster.barns.length,2);
 assert.equal(roster.farms.length,3);
 assert.equal(roster.breakingCenters.length,2);
 assert.ok(roster.farms[0].match(/\b(Stud|Stallion)\b/));
 assert.ok(roster.farms[2].includes('Nursery'));
 const all=[...roster.owners,...roster.barns,...roster.farms,...roster.breakingCenters];
 assert.equal(new Set(all.map(normalize)).size,all.length);
 assert.ok(!all.some(name=>normalize(name)===normalize('Kingsmere Farm')));
 assert.deepEqual(roster,createOrganizationNameRoster(args));
 assert.throws(()=>createOrganizationNameRoster({...args,farmContexts:[{region:'KENTUCKY'}]}),
  /Invalid farm naming contexts/);
 assert.throws(()=>createOrganizationNameRoster({...args,ownerContexts:[{region:'MARS'},{region:'FLORIDA'}]}),
  /Unsupported owner naming context/);
 assert.throws(()=>createOrganizationNameRoster({...args,farmContexts:[
  {region:'KENTUCKY',era:'MEDIEVAL'},farmContexts[1],farmContexts[2]
 ]}),/Unsupported farm naming context/);
});
test('full-sized V7 regional organization world retains unique, distinct purpose names and geography',()=>{
 const world=createFictionalWorldNameEngine({worldId:'V7-Farm-Directory',seed:19990101});
 assert.match(world.manifest.schema,/V7$/);
 assert.equal(world.manifest.organizationStyleModel,ORGANIZATION_STYLE_MODEL);
 assert.equal(world.manifest.organizationNameModel,ORGANIZATION_NAME_MODEL);
 assert.equal(world.people.length,11202);
 const firms=[...world.owners,...world.stables,...world.farms,...world.trainingCenters];
 assert.equal(firms.length,8408);
 assert.equal(new Set(firms.map(x=>normalize(x.name))).size,firms.length);
 assert.ok(firms.every(x=>!badPhrase.test(x.name)));
 const pById=new Map(world.people.map(x=>[x.id,x]));
 for(const o of world.owners){
  const principal=pById.get(o.principalId);
  assert.equal(principal?.organizationId,o.id);
  if(o.familyName)assert.equal(o.familyName,principal.primarySurname);
  assert.equal(o.namingRegion,organizationNamingRegion(o.location));
  assert.ok(['HERITAGE','ESTABLISHED','CONTEMPORARY'].includes(o.namingEraStyle));
  assert.equal(Object.hasOwn(o,'establishedYear'),false,
   'naming style must never fabricate a historical founding year');
 }
 for(const s of world.stables){
  assert.equal(pById.get(s.trainerId)?.stableId,s.id);
  assert.equal(s.namingRegion,organizationNamingRegion(s.location));
 }
 const kinds=new Map();
 for(const f of world.farms){
  assert.equal(f.namingRegion,organizationNamingRegion(f.location));
  assert.ok(['HERITAGE','ESTABLISHED','CONTEMPORARY'].includes(f.namingEraStyle));
  kinds.set(f.kind,(kinds.get(f.kind)||0)+1);
  if(f.kind==='STUD_FARM')assert.match(f.name,/\b(Stud|Stallion)\b/i);
  if(f.kind==='THOROUGHBRED_NURSERY')assert.match(f.name,/\bNursery\b/i);
  if(f.kind==='BLOODSTOCK_FARM')assert.match(f.name,/\b(Bloodstock|Thoroughbreds)\b/i);
  if(f.kind==='FARM')assert.match(f.name,/\b(Farm|Farms|Farmstead|Acres|Thoroughbreds)\b/i);
 }
 assert.deepEqual(Object.fromEntries(kinds),{
  STUD_FARM:240,BLOODSTOCK_FARM:65,FARM:490,THOROUGHBRED_NURSERY:105
 });
 const regionalFarms=world.farms.filter(f=>
  REGIONAL_NAMING_ANCHORS.some(a=>f.name.toLowerCase().startsWith(a.toLowerCase()+' ')));
 assert.ok(regionalFarms.length>=120,'geographically influenced farm roots collapsed');
 const regions=new Set(world.farms.map(f=>f.namingRegion));
 for(const r of ['KENTUCKY','FLORIDA','CALIFORNIA','ONTARIO','NEW_YORK','MID_ATLANTIC'])
  assert.ok(regions.has(r),'missing active farm naming region '+r);
});
test('regional V7 naming generator stays independent of active-world and horse generators',()=>{
 const src=readFileSync(new URL('../public/1999/engine/organization-naming-styles.mjs',import.meta.url),'utf8');
 const old=readFileSync(new URL('../public/1999/engine/full-world-generator.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(src,/\b(?:fetch|localStorage|indexedDB|writeFile|setItem)\s*\(/);
 assert.doesNotMatch(old,/organization-naming-styles/);
 assert.doesNotMatch(old,/organizationNamingEra|contextualFarmCandidate/);
 const w=createFictionalWorldNameEngine({worldId:'V7-Empty',seed:12345,
  roles:{},owners:0,facilities:noFacilities});
 assert.equal(w.farms.length,0);
 assert.equal(w.owners.length,0);
 assert.equal(w.stables.length,0);
});
