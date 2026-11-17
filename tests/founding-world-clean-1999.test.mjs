import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const here=path.dirname(fileURLToPath(import.meta.url));
const pilot=JSON.parse(readFileSync(path.resolve(here,'../public/data/wtw-founding-world-clean-1999-v1.json'),'utf8'));
const keys=new Map(pilot.organizations.map(o=>[o.key,o]));
const owners=new Set(pilot.organizations.filter(o=>o.canonicalOrganizationId).map(o=>o.canonicalOrganizationId));

test('January 1999 starts with ONLY selected founding entities, not the old 325,000 population',()=>{
 assert.equal(pilot.schema,'WTW_FOUNDING_WORLD_CLEAN_1999_V1');
 assert.equal(pilot.date,'1999-01-01');
 assert.equal(pilot.status,'ENGINEERING_PILOT_NOT_LIVE');
 assert.equal(pilot.organizations.length,36);
 assert.equal(pilot.counts.openingRacehorses,35);
 assert.equal(pilot.racehorses1999.length,35);
 assert.equal(new Set(pilot.organizations.map(o=>o.entityId)).size,36);
 assert.equal(new Set(pilot.racehorses1999.map(h=>h.id)).size,35);
 assert.ok(pilot.racehorses1999.every(h=>owners.has(h.ownerId)));
 assert.ok(pilot.organizations.every(o=>o.canonicalOrganizationId || o.entityId.startsWith('PILOT-ORG-')));
 assert.equal(pilot.rules.noGeneratedHorses,true);
 assert.equal(pilot.rules.noOldCareerImport,true);
});

test('approved farms and renamed owners retain canonical identifiers',()=>{
 const exact={
  KINGS:['Kingsmere Farm','O-000061'],HARRO:['Harrowgate Farm','O-000002'],
  CRES:['Crescent Mile Farm','O-000062'],IRON:['Ironweed Farm','O-000063'],
  FOUR:['Four Corners Farm','O-000003'],MID:['Midway','O-005910'],
  KNIGHT:['Knight’s Way','O-005919'],QUICK:['Quickfire Racing','O-000056'],
  POTOMAC:['Potomac Heritage Stable','O-005794'],WHIT:['Whitcombe Family','O-000037']
 };
 for(const [key,[name,id]] of Object.entries(exact)){
   const o=keys.get(key);assert.ok(o,key);assert.equal(o.displayName,name,key);
   assert.equal(o.canonicalOrganizationId,id,key);
 }
 assert.equal(keys.get('ASHBY').historicBreederId,'HP-B-01-004-3');
 assert.equal(keys.get('CANEY').continuityId,'HIC-031');
});

test('Miriam and public-figure owner IDs are not reassigned',()=>{
 const byId=new Map(pilot.people.map(p=>[p.id,p]));
 assert.equal(byId.get('P-000002')?.name,'Miriam Vale');
 assert.equal(byId.get('P-000002')?.base.region,'Virginia');
 for(const [id,name] of [['P-910023','Mike Ditka'],['P-910024','Bob Knight'],
 ['P-910028','Pat Buchanan'],['P-910018','Magic Johnson']])
   assert.equal(byId.get(id)?.name,name);
});

test('historical role links remain distinct and conflicts are visible',()=>{
 const get=(org,horse,role)=>pilot.historicalHorseLinks.find(x=>x.orgKey===org&&x.horseName===horse&&x.relation===role);
 assert.ok(get('KINGS','Heyday','breeder'));
 assert.ok(get('WHIT','Heyday','racing-owner'));
 for(const name of ['Who Knows','Saint Nobody']){
   const x=get('CRES',name,'breeder-retained-homebred');
   assert.ok(x);assert.equal(x.gate,'USER_OWNER_RECORD_CONFLICT');
 }
 assert.ok(pilot.integrationGates.some(x=>/retained-homebred ownership/.test(x)));
});

test('breeding stock keeps physical residence distinct from horse ownership',()=>{
 assert.ok(pilot.stallions1999.every(h=>owners.has(h.standingFarm1999?.farmOrganizationId)));
 assert.ok(pilot.foundationalBroodmares1999.every(h=>owners.has(h.standingFarm1999?.farmOrganizationId)));
 assert.ok(pilot.sampledBoardingMares1999.every(h=>owners.has(h.boardingFarm1999?.farmOrganizationId)));
 assert.ok(pilot.integrationGates.some(x=>/boarding farm is not ownership/i.test(x)));
});

test('every required pedigree node closes over the historic source',()=>{
 const nodes=new Map(pilot.pedigreeNodes.map(h=>[h.id,h]));
 assert.equal(pilot.missingPedigreeNodeIds.length,0);
 for(const h of pilot.pedigreeNodes){
   if(h.sireId)assert.ok(nodes.has(h.sireId),h.id+' missing sire '+h.sireId);
   if(h.damId)assert.ok(nodes.has(h.damId),h.id+' missing dam '+h.damId);
 }
 assert.equal(nodes.size,pilot.counts.pedigreeNodes);
 assert.ok(pilot.historyYearbookReadOnly.every(y=>Number(y.year)<1999));
});
