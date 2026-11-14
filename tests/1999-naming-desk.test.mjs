import test from 'node:test';
import assert from 'node:assert/strict';
import {buildNamingLabScenario,createNamingDeskController,NAMING_DESK_MODE}
 from '../public/next/1999-naming-desk.mjs';
import {HORSE_NAME_CREATOR_SCHEMA} from '../public/1999/game/horse-naming-model-creator.js';
import {readFile} from 'node:fs/promises';

const STORY='The farm lost electric power during a violent storm. The owner found the mare by listening to her calm, steady breathing in the dark barn.';
const IDEA={name:'Steady Breathing',evidenceId:'OWNER_STORY:NAMING-LAB-STORY-01',
 evidenceQuote:'her calm, steady breathing in the dark barn',
 explanation:'This exact foaling memory centered on the mare breathing steadily while the owner searched a darkened barn.'};
const original={ownerName:'Test Operator',breederName:'Test Breeder',foalingYear:'1996',story:STORY};

test('a lab-only foal uses the real saved-story brief but never joins the playable roster',()=>{
 const s=buildNamingLabScenario(original);
 assert.equal(s.mode,NAMING_DESK_MODE);
 assert.equal(s.registrationEnabled,false);
 assert.equal(s.brief.status,'READY_FOR_ORIGINAL_NAME_WRITING');
 assert.equal(s.brief.owner.name,'Test Operator');
 assert.equal(s.brief.evidence[0].sourceRef,'owner_story:NAMING-LAB-STORY-01');
 assert.deepEqual(s.world.entities.horses,[]);
 assert.deepEqual(s.state.runtime.registered_horses.by_id,{});
});

test('empty, shallow, oversized, or impossible 1999 stories are rejected before any inference',()=>{
 for(const bad of [
  {...original,story:'A nice horse.'},
  {...original,story:'X'.repeat(1001)},
  {...original,foalingYear:2005},
  {...original,ownerName:''},
  {...original,breederName:''}
 ])assert.throws(()=>buildNamingLabScenario(bad));
});

test('the on-screen desk makes a real preview protocol call and locally screens its output',async()=>{
 let calls=0;let seen=null;
 const mock=async(url,options)=>{
  calls++;assert.equal(url,'/api/naming/preview');
  assert.equal(options.method,'POST');
  seen=JSON.parse(options.body);
  return {ok:true,json:async()=>({schema:HORSE_NAME_CREATOR_SCHEMA,ideas:[IDEA]})};
 };
 const desk=createNamingDeskController({fetchImpl:mock});
 for(const [key,val] of Object.entries(original))desk.setField(key,val);
 const ok=await desk.generate();
 assert.equal(ok,true);assert.equal(calls,1);
 assert.equal(seen.brief.status,'READY_FOR_ORIGINAL_NAME_WRITING');
 assert.equal(seen.brief.evidence[0].detail,STORY);
 const v=desk.snapshot();
 assert.equal(v.results.length,1);
 assert.equal(v.results[0].name,'Steady Breathing');
 assert.equal(v.results[0].status,'AWAITING_INDEPENDENT_EDITOR');
 assert.equal(v.results[0].gameWrites,0);
 assert.equal(v.results[0].registrationStatus,'NOT_RELEASED');
 assert.ok(desk.render().includes('NOT RELEASED'));
 assert.equal(desk.mark(IDEA.name),true);
 assert.equal(desk.snapshot().shortlist.length,1);
 assert.equal(desk.reject(IDEA.name),true);
 assert.equal(desk.snapshot().shortlist.length,0);
 assert.deepEqual(desk.snapshot().rejected,[IDEA.name]);
 assert.equal(desk.mark(IDEA.name),false);
 assert.equal(desk.clear(),true);
 assert.equal(desk.snapshot().results.length,0);
});

test('invalid story and disabled AI give explicit feedback, no fabricated names',async()=>{
 let calls=0;
 const fetchImpl=async()=>{calls++;return {ok:false,status:503,json:async()=>({error:'disabled'})}};
 const desk=createNamingDeskController({fetchImpl});
 assert.equal(await desk.generate(),false);
 assert.equal(calls,0);
 desk.setField('story',STORY);
 assert.equal(await desk.generate(),false);
 assert.equal(calls,1);
 assert.match(desk.snapshot().error,/AI PREVIEW UNAVAILABLE/);
 assert.deepEqual(desk.snapshot().results,[]);
});

test('screens out previously owner-rated names and cannot shortlist held proposals',async()=>{
 const rated={...IDEA,name:'Wild Geese'};
 const desk=createNamingDeskController({fetchImpl:async()=>({ok:true,json:async()=>({schema:HORSE_NAME_CREATOR_SCHEMA,ideas:[rated]})})});
 for(const [key,val] of Object.entries(original))desk.setField(key,val);
 await desk.generate();
 const v=desk.snapshot();
 assert.equal(v.results[0].status,'HELD');
 assert.equal(desk.mark('Wild Geese'),false);
});

test('uses same single management UI; no second layout or persistent naming save',async()=>{
 const [ui,html,desk]=await Promise.all([
  readFile(new URL('../public/next/next.js',import.meta.url),'utf8'),
  readFile(new URL('../public/next/index.html',import.meta.url),'utf8'),
  readFile(new URL('../public/next/1999-naming-desk.mjs',import.meta.url),'utf8')
 ]);
 assert.match(ui,/Stable — Naming Desk/);
 assert.match(ui,/key==='naming-desk'/);
 assert.match(ui,/WTW1999NamingDesk\?\.render/);
 assert.match(html,/type="module" src="\/next\/1999-naming-desk\.mjs/);
 assert.match(desk,/ng-manager-screen ng-naming-desk/);
 assert.doesNotMatch(desk,/localStorage|indexedDB|REGISTER_GAME_HORSE|OWNER_ACCEPT_STORY_HORSE_NAME/);
});