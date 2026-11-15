import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const load=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const src=load('public/app.js');
const start=src.indexOf('function archiveRecordFamily(');
const end=src.indexOf('\nfunction venueName(',start);
assert.ok(start>=0&&end>start,'History Vault must reuse one existing source-detail drawer');
const helpers=src.slice(start,end);

function fixture(entities,races,organizations=[]){
 const records=new Map(entities.map(e=>[e.id,e]));
 const events=new Map(races.map(e=>[e.id,e]));
 const state={recordBrowse:null,openDetail:null,orgHistory:organizations,page:'people'};
 let content={prepended:[],prepend(x){this.prepended.unshift(x)}};
 const $=id=>id==='detail-content'?content:null;
 const document={createElement:()=>({
  className:'',attrs:{},setAttribute(k,v){this.attrs[k]=v}
 })};
 const openDetail=(type,id)=>{state.openDetail={type,id};};
 const f=Function('state','entity','race','document','$','h','openDetail',
  helpers+'\nreturn {family:archiveRecordFamily,entry:archiveListEntry,'+
  'capture:archiveCaptureList,cursor:archiveRecordCursor,pager:archiveRecordPager,step:archiveRecordStep};')(
  state,id=>records.get(id),id=>events.get(id),document,$,String,openDetail);
 return {state,content,...f};
}
function buttons(typesAndIds){
 const buttons=typesAndIds.map(([type,id])=>({
  dataset:{openType:type==='history-org'?undefined:type,id,
   historyOrg:type==='history-org'?id:undefined},
  hasAttribute(name){return name==='data-history-org'&&type==='history-org'},
  closest(){return true}
 }));
 const scope={querySelectorAll:()=>buttons};
 for(const b of buttons)b.closest=()=>scope;
 return buttons;
}
test('History horse archive navigates the same visible ordered horse IDs; not archive pages',()=>{
 const f=fixture([
  {id:'H-Z',kind:'horse',name:'Zeta'},
  {id:'H-A',kind:'horse',name:'Alpha'},
  {id:'H-M',kind:'horse',name:'Middle'}
 ],[]);
 const rows=buttons([['entity','H-Z'],['entity','H-A'],['entity','H-M']]);
 f.capture(rows[0],'entity','H-Z');
 f.state.openDetail={type:'entity',id:'H-Z'};
 assert.equal(f.cursor('entity','H-Z').items.length,3);
 f.pager('entity','H-Z');
 assert.match(f.content.prepended[0].innerHTML,/Previous: Middle/);
 assert.match(f.content.prepended[0].innerHTML,/Next: Alpha/);
 f.step(1);
 assert.deepEqual(f.state.openDetail,{type:'entity',id:'H-A'});
 assert.equal(f.state.recordBrowse.index,1);
 f.step(-1);
 assert.deepEqual(f.state.openDetail,{type:'entity',id:'H-Z'});
 f.step(-1);
 assert.deepEqual(f.state.openDetail,{type:'entity',id:'H-M'});
});

test('Trainer and jockey archive cards never cross their person roles',()=>{
 const f=fixture([
  {id:'P1',kind:'person',name:'Trainer A',role:'TRAINER'},
  {id:'P2',kind:'person',name:'Rider A',role:'JOCKEY'},
  {id:'P3',kind:'person',name:'Trainer B',role:'TRAINER'},
  {id:'P4',kind:'person',name:'Rider B',role:'JOCKEY'}
 ],[]);
 const nodes=buttons([['entity','P1'],['entity','P2'],['entity','P3'],['entity','P4']]);
 f.capture(nodes[0],'entity','P1');
 f.state.openDetail={type:'entity',id:'P1'};
 assert.deepEqual(f.state.recordBrowse.items.map(x=>x.id),['P1','P3']);
 f.step(1);
 assert.deepEqual(f.state.openDetail,{type:'entity',id:'P3'});
 f.capture(nodes[1],'entity','P2');
 assert.deepEqual(f.state.recordBrowse.items.map(x=>x.id),['P2','P4']);
});

test('Racing stable, farms and tracks preserve their distinct source identity categories',()=>{
 const f=fixture([
  {id:'O1',kind:'organization',name:'Farm A',role:'BREEDING FARM'},
  {id:'O2',kind:'organization',name:'Stable B',role:'RACING STABLE'},
  {id:'O3',kind:'organization',name:'Farm C',role:'STUD FARM'},
  {id:'T1',kind:'track',name:'Aqueduct'},
  {id:'T2',kind:'track',name:'Saratoga'}
 ],[]);
 const nodes=buttons([['entity','O1'],['entity','O2'],['entity','O3'],['entity','T1'],['entity','T2']]);
 f.capture(nodes[0],'entity','O1');
 assert.deepEqual(f.state.recordBrowse.items.map(x=>x.id),['O1','O3']);
 f.capture(nodes[3],'entity','T1');
 assert.deepEqual(f.state.recordBrowse.items.map(x=>x.id),['T1','T2']);
});

test('Race editions browse only race editions in visible ledger order, not winners',()=>{
 const f=fixture([
  {id:'H1',kind:'horse',name:'Winner A'}
 ],[{id:'R3',name:'Race 3'},{id:'R1',name:'Race 1'},{id:'R2',name:'Race 2'}]);
 const nodes=buttons([['entity','H1'],['race','R3'],['race','R1'],['race','R2']]);
 f.capture(nodes[1],'race','R3');
 f.state.openDetail={type:'race',id:'R3'};
 assert.deepEqual(f.state.recordBrowse.items.map(x=>x.id),['R3','R1','R2']);
 f.step(1);
 assert.deepEqual(f.state.openDetail,{type:'race',id:'R1'});
 assert.equal(f.cursor('entity','H1'),null);
});

test('Archive navigator never touches canonical game/career or simulates empty records',()=>{
 assert.match(src,/function archiveRecordFamily\(/);
 assert.match(src,/function archiveRecordPager\(/);
 assert.match(src,/archiveCaptureList\(t,t\.dataset\.openType,t\.dataset\.id\)/);
 assert.match(src,/archiveRecordStep\(Number\(t\.dataset\.archiveRecordStep\)\)/);
 assert.match(src,/archiveRecordPager\(type,id\)/);
 assert.match(load('public/style.css'),/\.archive-record-browser\{/);
 assert.doesNotMatch(helpers,/fetch\(|localStorage\.setItem|simulate|ADVANCE_DAY|createHorse/);
});
