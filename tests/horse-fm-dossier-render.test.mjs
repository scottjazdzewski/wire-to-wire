import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const get=file=>fs.readFileSync(path.join(root,file),'utf8');

test('Horse Profile real overview renders all FM dossier sections with zero fabricated skill ratings',()=>{
 const js=get('public/next/next.js');
 const catalog=JSON.parse(get('public/assets/game/attribute-catalog.v1.json'));
 const start=js.indexOf(' const athleteOverview=()=>{'),end=js.indexOf(' const personWork=()=>',start);
 assert.ok(start>0&&end>start,'Production athlete Overview source must exist');
 const overview=js.slice(start,end);
 const render=new Function('route','athleteAttributeCatalog','state','record','blood','connection',
  'notes','states','safe','$$','quickLinks',overview+'\nreturn athleteOverview();');
 const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
 const makeState=observations=>()=>({scoutingState:{'The Last Match':{attribute_observations:observations}},horseState:{'The Last Match':{certified_results:[]}}});
 const args=(state)=>[{title:'The Last Match'},catalog,state,[
   {label:'Starts',value:'—'},{label:'Wins',value:'—'}],
   [{label:'Sire',value:'—'},{label:'Dam',value:'—'}],
   [{label:'Trainer',value:'—'},{label:'Owner',value:'—'}],
   ['Latest decision · 2014-07-15 · Light jog only','Health / Vet · Monitor filling'],
   ['Light jog only','Target: Keeneland R6'],esc,()=>[],'<button data-ng="sourcebutton">RELATED DECISION</button>'];
 const unknown=render(...args(makeState([])));
 const visibleText=unknown.replaceAll('&amp;','&');
 for(const name of ['SPEED & PACE','SURFACE & ENVIRONMENT','PHYSICAL & BIOMETRIC','MENTAL & CLASS',
  'CAREER RECORD','CURRENT CONDITION','RACE PLAN','RECENT WORK / OFFICE REPORTS','KEY CONNECTIONS',
  'RECENT RACES & FORM','PEDIGREE & BACKGROUND','RACING OFFICE SUMMARY'])
  assert.ok(visibleText.includes(name),'First screen must present section: '+name);
 assert.ok(unknown.includes('0 OF 53 ATTRIBUTES ASSESSED'),'Unassessed values are explicitly disclosed');
 assert.ok(unknown.includes('UNASSESSED ≠ ZERO'),'No implicit zero for unassessed skill');
 assert.ok(unknown.includes('Keeneland R6'),'Saved race plan must display');
 assert.ok(unknown.includes('Monitor filling'),'Saved veterinary context must display');
 assert.ok(unknown.includes('No verified career figures'),'Missing historical record cannot be fabricated');
 assert.ok(unknown.includes('No certified race-by-race form'),'Missing starts cannot appear as fake results');
 assert.ok(!unknown.includes('3–2–1–0'),'Never copy mockup race records into the universe');
 assert.ok(!unknown.includes('Clover Ridge Racing'),'Never copy screenshot owner into the universe');
 const measured=render(...args(makeState([{attribute_key:'raw_speed',status:'measured',
  estimate:77,scale_min:0,scale_max:100,evidence_refs:['scout:reference']}]))); 
 assert.ok(measured.includes('1 OF 53 ATTRIBUTES ASSESSED'),'Evidence-backed rating updates count');
 assert.ok(measured.includes('77'),'Evidenced measurement is shown');
 assert.ok(measured.includes('width:77.0%'),'Measured ratings get only observed-scaled bars');
 const noEvidence=render(...args(makeState([{attribute_key:'raw_speed',status:'measured',
  estimate:99,scale_min:0,scale_max:100,evidence_refs:[]}])));
 assert.ok(noEvidence.includes('0 OF 53 ATTRIBUTES ASSESSED'),'Unproven numeric estimates must not display as data');
 assert.ok(!noEvidence.includes('width:99.0%'),'Unproven measurements must not create a rating bar');
});
