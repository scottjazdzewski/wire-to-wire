import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readLocal1999World} from '../public/1999/engine/local-api.mjs';
import {create1999Universe} from '../public/1999/engine/full-world-generator.mjs';
import {openingWorld1999 as canon} from '../public/1999/engine/canon-mini.mjs';

test('populated world loads without any Cloudflare API / D1 database',()=>{
 const data=readLocal1999World('/api/1999/sim/overview');
 assert.equal(data.asOf,'1999-01-01');
 assert.equal(data.counts.horses,87500);
 assert.equal(data.counts.tracks,134);
 assert.equal(data.counts.owners,3308);
 assert.equal(data.counts.trainers,4200);
 assert.equal(data.counts.facilities,5234);
 assert.equal(data.counts.auctions,36);
 assert.equal(data.gameplayReady,false);
 assert.match(data.source,/NO_API_OR_DATABASE_REQUIRED/);
});
test('actual source horses and test horses render by 1999 stable ID',()=>{
 const first=readLocal1999World('/api/1999/sim/horses?limit=5');
 const generated=readLocal1999World('/api/1999/sim/horses?offset=267&limit=2');
 assert.equal(first.total,87500);
 assert.equal(first.items.length,5);
 assert.equal(first.items[0].id,canon.horses[0].id);
 assert.equal(first.items[0].name,canon.horses[0].name);
 assert.equal(generated.items.length,2);
 assert.equal(generated.items[0].nameStatus,'TEST_RENAME_ALLOWED');
 assert.equal(Object.keys(generated.items[0].attributes).length,53);
 assert.ok(generated.items[0].location.city);
});
test('all visible departments have a named, physically located test population',()=>{
 const paths=[
 ['/api/1999/sim/owners',3308],
 ['/api/1999/sim/trainers',4200],
 ['/api/1999/sim/tracks',134],
 ['/api/1999/sim/facilities',5234],
 ['/api/1999/sim/auctions',36],
 ['/api/1999/horses',267],
 ['/api/1999/organizations',108],
 ['/api/1999/people',154],
 ['/api/1999/tracks',134],
 ['/api/1999/calendar',93],
 ['/api/1999/broodmare-boarding',2036],
 ['/api/1999/events',38]
 ];
 for(const [path,n] of paths){
  const response=readLocal1999World(path+'?limit=15');
  assert.equal(response.total,n,path);
  assert.equal(response.items.length,15,path);
  assert.ok(response.items[0].id,path);
 }
 assert.equal(readLocal1999World('/api/1999/stallions').active.length,31);
 assert.equal(readLocal1999World('/api/1999/sim/conditions?date=1999-01-01&trackIndex=0').races.length,0);
});
test('browser runs entirely from static modules with no fetch() dependency',()=>{
 const script=readFileSync(new URL('../public/1999/app.mjs',import.meta.url),'utf8');
 assert.match(script,/readLocal1999World/);
 assert.doesNotMatch(script,/fetch\(/);
 assert.match(script,/select\('full-horses'\)/);
});
test('fully fictional mode changes identifiers without mutating source canon',()=>{
 const source=readLocal1999World('/api/1999/sim/horses?offset=0&limit=1');
 const fiction=readLocal1999World('/api/1999/sim/horses?offset=0&limit=1&mode=FULLY_FICTIONAL_TEST&seed=19990102');
 assert.equal(source.items[0].id,canon.horses[0].id);
 assert.equal(fiction.items[0].nameStatus,'TEST_RENAME_ALLOWED');
 assert.notEqual(fiction.items[0].id,canon.horses[0].id);
 assert.equal(create1999Universe().currentDate,'1999-01-01');
});
test('minimal browser with broken network still shows metrics and populated rows',async()=>{
 const idList=['gameDate','gameDay','runMode','metrics','records','status','sectionTitle','sectionDescription','sectionKicker','mode','search','trackPicker','trackPickerLabel','prevPage','nextPage','pageInfo','oneDay','oneWeek','oneMonth','reset','fictional','canonWorld','refresh','recordDetails','jumpIndex','jumpTo'];
 const handlers=new Map();
 const elements=new Map(idList.map(id=>[id,{
  innerHTML:'',textContent:'',value:'',hidden:false,disabled:false,dataset:{},
  addEventListener(type,fn){handlers.set(id+':'+type,fn);},classList:{toggle(){}}
 }]));
 globalThis.document={getElementById:id=>elements.get(id),querySelectorAll:()=>[]};
 globalThis.localStorage={getItem(){return null;},setItem(){}};
 globalThis.confirm=()=>false;
 globalThis.fetch=()=>{throw new Error('Cloudflare API unreachable');};
 await import('../public/1999/app.mjs');
 await new Promise(resolve=>setTimeout(resolve,90));
 assert.match(elements.get('metrics').innerHTML,/87,500/);
 assert.match(elements.get('metrics').innerHTML,/3,308/);
 assert.match(elements.get('records').innerHTML,/class="record"/);
 assert.match(elements.get('records').innerHTML,/H-/);
 assert.match(elements.get('records').innerHTML,/Inspect full record/);
 const handler=handlers.get('records:click');
 assert.equal(typeof handler,'function');
 handler({target:{closest:()=>({dataset:{recordIndex:'0'}})}});
 assert.equal(elements.get('recordDetails').hidden,false);
 assert.match(elements.get('recordDetails').innerHTML,/All 53 modeled attributes/);
 assert.match(elements.get('recordDetails').innerHTML,/Finances and operating costs/);
 assert.match(elements.get('recordDetails').innerHTML,/View every stored field/);
 assert.match(elements.get('status').textContent,/Population loaded in this browser/);
 assert.match(elements.get('gameDate').textContent,/January 1, 1999/);
});
