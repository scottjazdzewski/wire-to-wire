import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ui=readFileSync(new URL('../public/next/next.js',import.meta.url),'utf8');

const active=(id,name,sourceName=name)=>({
 kind:'track',name,canonicalId:id,worldKey:'track:'+id,
 _world:{id,name,sourceName,playableIn1999:true,operating:'OPEN_1999'}
});
const retired=(id,name)=>({
 kind:'track',name,canonicalId:id,worldKey:'track:'+id,
 _world:{id,name,playableIn1999:false,operating:'HISTORICAL_ONLY'}
});
const records=[
 active('T-0061','Comanche Raceway','Sunland Park'),
 retired('T-0033','Longacres'),
 active('T-0122','Sioux Plains'),
 retired('T-0113','Jefferson Park')
];
const first=ui.indexOf('function globalSearchItems(){');
const last=ui.indexOf('\nconst searchWords=',first);
assert.ok(first>0&&last>first,'One canonical global-search source must exist');

test('global game search shows only operational 1999 tracks and approved aliases',()=>{
 const browser={__wtwOfficeSearchRecords:()=>[
  {kind:'track',id:'T-0061',name:'Sunland Park'},
  {kind:'track',id:'T-0033',name:'Longacres'},
  {kind:'track',id:'T-0113',name:'Jefferson Park'}
 ]};
 const fn=new Function('window','world1999Entries','currentMessages','tabmap',
  'world1999Base','titleCaseUIRole',
  ui.slice(first,last)+'\nreturn globalSearchItems;')(
   browser,()=>records,()=>[],{Office:['Overview'],World:['Overview']},
   {tracks:[{id:'T-0061',name:'Sunland Park'}]},value=>value
  );
 const tracks=fn().filter(x=>x.kind==='track');
 assert.deepEqual(new Set(tracks.map(x=>x.name)),new Set(['Comanche Raceway','Sioux Plains']));
 assert.equal(tracks.length,2,'No legacy Sunland double or archived track rows');
 assert.ok(!tracks.some(x=>x.canonicalId==='T-0033'||x.canonicalId==='T-0113'));
});

test('World Tracks and Meets screens no longer opt into historical-only rows',()=>{
 const start=ui.indexOf('function depRows(');
 const end=ui.indexOf('\n/* One authoritative VIEW menu',start);
 assert.ok(start>0&&end>start);
 const body=ui.slice(start,end);
 assert.match(body,/section==='World'&&page==='Tracks'\)return depTrackRows\('All Tracks',depGameDay\(\)\)/);
 assert.match(body,/section==='World'&&page==='Meets'\)return depTrackRows\('Active Meets',depGameDay\(\)\)/);
 assert.match(body,/if\(section==='Tracks'\)return depTrackRows\(page,depGameDay\(\)\)/);
 assert.doesNotMatch(body,/depTrackRows\([^;\n]+,true\)/);
 assert.match(ui,/\.filter\(t=>includeRetired\|\|\(t.operating!=='HISTORICAL_ONLY'&&t.playableIn1999!==false\)\)/);
});

test('active track profile paging never visits retired courses; archive IDs remain resolvable',()=>{
 const start=ui.indexOf('function dossierEntityCategory(entry){');
 const end=ui.indexOf('function dossierCurrentEntity(',start);
 assert.ok(start>0&&end>start);
 const find=new Function(ui.slice(start,end)+
  '\nreturn dossierAdjacentRecords;')();
 const a=find(records[0],records);
 assert.equal(a.next.name,'Sioux Plains');
 assert.equal(a.previous.name,'Sioux Plains');
 const h=find(records[1],records);
 assert.equal(h.next.name,'Jefferson Park');
 assert.equal(h.previous.name,'Jefferson Park');
 // No filtering at the direct ID resolver or source-identity layer.
 const resolver=ui.slice(ui.indexOf('function world1999Entry(key){'),
  ui.indexOf('function world1999Match(',ui.indexOf('function world1999Entry(key){')));
 assert.match(resolver,/const listed=world1999Entries\(\)\.find\(e=>e.worldKey===key\)/);
 assert.doesNotMatch(resolver,/HISTORICAL_ONLY/);
});
