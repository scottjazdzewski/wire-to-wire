import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildNamingLabScenario,createNamingDeskController,NAMING_DESK_MODE}
 from '../public/next/1999-naming-desk.mjs';
const STORY='The farm lost electric power during a violent storm. The owner found the mare by listening to her calm, steady breathing in the dark barn.';
const fields={ownerName:'Test Owner',breederName:'Test Breeder',foalingYear:'1996',story:STORY};
test('the lab is separate from historical horse data and game state',()=>{
 const s=buildNamingLabScenario(fields);
 assert.equal(s.mode,NAMING_DESK_MODE);
 assert.equal(s.registrationEnabled,false);
 assert.equal(s.brief.status,'READY_FOR_ORIGINAL_NAME_WRITING');
 assert.deepEqual(s.world.entities.horses,[]);
 assert.deepEqual(s.state.runtime.registered_horses.by_id,{});
});
test('invalid or insufficient horse stories are rejected before generation',()=>{
 for(const bad of [{...fields,story:'A nice horse.'},{...fields,story:'X'.repeat(1001)},
  {...fields,ownerName:''},{...fields,foalingYear:2005}])
  assert.throws(()=>buildNamingLabScenario(bad));
});
test('Naming Desk makes absolutely no requests while generating original local names',()=>{
 let calls=0;const old=globalThis.fetch;
 globalThis.fetch=()=>{calls++;throw Error('Network forbidden')};
 try{
  const d=createNamingDeskController();
  for(const [k,v] of Object.entries(fields))d.setField(k,v);
  assert.equal(d.generate(),true);
  const v=d.snapshot();
  assert.ok(v.results.length>0);
  assert.ok(v.results.every(x=>x.registrationStatus==='NOT_RELEASED'));
  assert.match(d.render(),/ON-DEVICE/);
  const n=v.results[0].name;
  assert.equal(d.mark(n),true);
  assert.equal(d.reject(n),true);
  assert.equal(d.snapshot().shortlist.length,0);
  assert.equal(d.mark(n),false);
  assert.equal(d.clear(),true);
  assert.equal(calls,0);
 }finally{globalThis.fetch=old}
});
test('repeated local generations respect previous name suppression',()=>{
 const d=createNamingDeskController();
 for(const [k,v] of Object.entries(fields))d.setField(k,v);
 assert.equal(d.generate(),true);
 const a=d.snapshot().results.map(r=>r.name);
 d.generate();
 const b=d.snapshot().results.map(r=>r.name);
 assert.ok(b.every(n=>!a.includes(n)));
});
test('Naming Desk lives inside existing manager UI without creating a new save system',async()=>{
 const [ui,html,desk]=await Promise.all([
  readFile(new URL('../public/next/next.js',import.meta.url),'utf8'),
  readFile(new URL('../public/next/index.html',import.meta.url),'utf8'),
  readFile(new URL('../public/next/1999-naming-desk.mjs',import.meta.url),'utf8')
 ]);
 assert.match(ui,/Stable — Naming Desk/);
 assert.match(ui,/key==='naming-desk'/);
 assert.match(html,/type="module" src="\/next\/1999-naming-desk\.mjs/);
 assert.match(desk,/ng-manager-screen ng-naming-desk/);
 assert.doesNotMatch(desk,/localStorage|indexedDB|REGISTER_GAME_HORSE|\/api\/naming\/preview/);
});
