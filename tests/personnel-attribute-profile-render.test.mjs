import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const js=readFileSync(new URL('../public/next/next.js',import.meta.url),'utf8');
const catalog=JSON.parse(readFileSync(new URL('../public/assets/game/attribute-catalog.v1.json',import.meta.url),'utf8'));
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

const start=js.indexOf('  const personnelGroups=[');
const end=js.indexOf('  const reputationSource=work.reputation_profile;',start);
assert.ok(start>0&&end>start,'Test must execute the exact production personnel rating renderer');
const run=new Function('common','special','roleDisplay','observed','modelNumber','safe','roles','cat','titleCaseUIRole',
 js.slice(start,end)+'\nreturn profileAttributes();');
const render=(common,special,roleDisplay,observed,modelNumber,safe,selectedRoles)=>{
 const roles=selectedRoles||[String(roleDisplay).toLowerCase().replaceAll(' ','_')];
 const titleCaseUIRole=x=>String(x).replace(/\b\w/g,ch=>ch.toUpperCase());
 return run(common,special,roleDisplay,observed,modelNumber,safe,roles,catalog,titleCaseUIRole);
};

test('personnel Overview shows real role-specific attribute names, not 46 placeholder slots',()=>{
 const common=catalog.person_common,special=catalog.person_roles.jockey;
 const output=render(common,special,'Jockey',new Map(),()=>null,esc);
 assert.equal((output.html.match(/data-personnel-attribute-group=/g)||[]).length,4);
 assert.equal((output.html.match(/class="ng-horse-rating-row /g)||[]).length,common.length+special.length);
 for(const label of ['Communication','Judgment','Work Ethic','Break Timing','Race Positioning','Riding Fitness'])
  assert.ok(output.html.includes(label),'Missing canonical '+label);
 assert.doesNotMatch(output.html,/Attribute slot|STATUS SLOT|0 OF 46 ROLE-SPECIFIC SLOTS/);
 assert.equal(output.total,21);
 assert.equal(output.assessed,0);
 assert.equal(output.modeled,0);
 assert.match(output.html,/NO GAME OR SCOUT ASSESSMENT/);
});

test('existing recorded estimates and generated test evaluations populate the same profile visibly, with provenance',()=>{
 const obs=new Map([['judgment',{status:'measured',estimate:78,scale_min:0,scale_max:100,evidence_refs:['scout-1']}],
  ['break_timing',{status:'estimated',estimate:90,scale_min:0,scale_max:100,evidence_refs:[]}]]);
 const modeled=new Map([['break_timing',.82],['pace_judgment',.69]]);
 const got=render(catalog.person_common,catalog.person_roles.jockey,'Jockey',obs,
  def=>modeled.get(def.key)??null,esc);
 assert.equal(got.assessed,1,'Only sourced observations count as measured');
 assert.equal(got.modeled,2,'Model-only skills remain explicitly test-labeled');
 assert.match(got.html,/Judgment · MEASURED/);
 assert.match(got.html,/width:78\.0%/);
 assert.match(got.html,/Break Timing · SIMULATED TEST · NOT OBSERVED/);
 assert.match(got.html,/width:82\.0%/);
 assert.match(got.html,/Pace Judgment/);
 assert.match(got.html,/SIMULATED TEST · NOT OBSERVED/);
 assert.equal(got.total,21);
});

test('all catalog professional roles show their actual union of common and specialty traits',()=>{
 for(const [role,defs] of Object.entries(catalog.person_roles)){
  const sheet=render(catalog.person_common,defs,role,new Map(),()=>null,esc);
  assert.equal(sheet.total,catalog.person_common.length+defs.length,role);
  assert.ok(sheet.html.includes(defs[0].label),role+' specialty lost');
  assert.doesNotMatch(sheet.html,/Attribute slot/);
 }
});

test('compound founder, chief strategist and racing-industry roles resolve to actual skill catalogs',()=>{
 const begin=js.indexOf('  const namedRoles={');
 const end=js.indexOf('  const work=state().staffState?',begin);
 assert.ok(begin>0&&end>begin);
 const classify=new Function('roleName','athleteAttributeCatalog',
  js.slice(begin,end)+'\nreturn {roles,role};');
 const strategist=classify('founder / chief bloodstock strategist',catalog);
 assert.ok(strategist.roles.includes('owner'));
 assert.ok(strategist.roles.includes('bloodstock_professional'));
 assert.equal(strategist.role,'bloodstock_professional');
 const jockey=classify('senior jockey',catalog);
 assert.deepEqual(jockey.roles,['jockey']);
 const trainer=classify('head trainer',catalog);
 assert.deepEqual(trainer.roles,['trainer']);
 const stable=classify('stable groom',catalog);
 assert.deepEqual(stable.roles,['stable_staff']);
});
test('multi-role founders show separate approved owner and bloodstock specialty groups',()=>{
 const defs=[...catalog.person_roles.owner,...catalog.person_roles.bloodstock_professional];
 const sheet=render(catalog.person_common,defs,'Founder / Chief Bloodstock Strategist',new Map(),()=>null,esc,
  ['owner','bloodstock_professional']);
 assert.equal(sheet.total,catalog.person_common.length+defs.length);
 assert.match(sheet.html,/OWNER SKILLS/);
 assert.match(sheet.html,/BLOODSTOCK PROFESSIONAL SKILLS/);
 assert.match(sheet.html,/Bloodstock Valuation|Deal Negotiation|Market Knowledge/);
});
test('Overview and deeper Attributes share the same source model, while the horse dossier remains unchanged',()=>{
 assert.match(js,/const skillSheet=person\.profileAttributes\(\)/);
 assert.match(js,/const professionalSlots=skillSheet\.html/);
 assert.match(js,/sheet=person\.profileAttributes\(\)/);
 assert.match(js,/data-template="person-role-attributes"/);
 assert.match(js,/source\?\.dataset\?\.testAttributeModel==='true'/);
 assert.match(js,/Array\.isArray\(obs\.evidence_refs\)&&obs\.evidence_refs\.length>0/);
 assert.match(js,/state\(\)\.staffState\?\.\[personId\]/);
 assert.match(js,/state\(\)\.staffState\?\.\[route\.title\]/);
 assert.match(js,/const athleteOverview=\(\)=>/);
 assert.match(js,/const horseStarRating=\(key,label\)=>/);
});
