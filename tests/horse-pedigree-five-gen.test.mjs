import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import worker from '../src/worker.js';

const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=file=>fs.readFileSync(path.join(base,file),'utf8');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderer(){
 const js=source('public/app.js');
 const a=js.indexOf('function renderFiveGenerationPedigree(data){');
 const b=js.indexOf('async function openDetail(type,id)',a);
 assert.ok(a>=0&&b>a);
 return new Function('h',js.slice(a,b)+';return renderFiveGenerationPedigree;')(esc);
}
test('A five-generation pedigree draws 63 source positions, each known ancestor clickable by Horse_ID',()=>{
 const render=renderer();
 const root={path:'',horse_id:'H-1997-030001',name:'Luna by Morning'};
 const sire={path:'S',horse_id:'H-1987-000001',name:'Saint Nobody'};
 const dam={path:'D',horse_id:'H-1989-020001',name:'Sundry'};
 const repeated={path:'DS',horse_id:'H-1987-000001',name:'Saint Nobody'};
 const html=render({known_positions:4,nodes:[root,sire,dam,repeated]});
 assert.equal((html.match(/class="wtw-pedigree-node /g)||[]).length,63);
 assert.equal((html.match(/class="wtw-pedigree-generation"/g)||[]).length,6);
 assert.match(html,/data-open-type="entity" data-id="H-1987-000001"/);
 assert.match(html,/repeated/);
 assert.match(html,/Unknown ancestor/);
 assert.match(html,/4 of 63 documented positions/);
 assert.ok(!html.includes('data-id="undefined"'));
});
test('Missing pedigree never invents an ancestor name or link',()=>{
 const html=renderer()({known_positions:1,nodes:[{path:'',horse_id:'H-1997-030001',name:'Luna by Morning'}]});
 assert.equal((html.match(/class="wtw-pedigree-node /g)||[]).length,63);
 assert.equal((html.match(/Unknown ancestor/g)||[]).length,62);
 assert.ok(!html.includes('data-open-type="entity"'));
});
test('Five-generation endpoint uses source-only read operations and retains authenticated access',async()=>{
 const queries=[];
 const db={
  prepare(sql){
   queries.push(sql);
   return {
    bind(...args){
     return {
      async first(){
       if(sql.includes("FROM entities e LEFT JOIN display_name_overrides"))return {id:'H-1997-030001',kind:'horse',name:'Luna by Morning'};
       return null;
      },
      async all(){
       return {results:[
        {depth:0,path:'',horse_id:'H-1997-030001',name:'Luna by Morning'},
        {depth:1,path:'S',horse_id:'H-1987-000001',name:'Saint Nobody'},
        {depth:1,path:'D',horse_id:'H-1989-020001',name:'Sundry'}
       ]};
      }
     };
    }
   };
  }
 };
 const req=new Request('https://wtw.example.com/api/horses/H-1997-030001/pedigree');
 const env={DB:db,ADMIN_EMAIL:'owner@example.com',ASSETS:{fetch:async()=>new Response('static')}};
 const ctx={access:{getIdentity:async()=>({email:'owner@example.com'})}};
 const res=await worker.fetch(req,env,ctx);
 assert.equal(res.status,200);
 const j=await res.json();
 assert.equal(j.horse_id,'H-1997-030001');
 assert.equal(j.generations,5);
 assert.equal(j.positions,63);
 assert.equal(j.known_positions,3);
 assert.equal(j.complete,false);
 assert.deepEqual(j.nodes.map(n=>n.path),['','S','D']);
 assert.ok(queries.some(sql=>sql.includes('WITH RECURSIVE tree')));
 assert.ok(queries.every(sql=>/^SELECT|^WITH RECURSIVE/.test(sql)));
 const unauthorized=await worker.fetch(req,env,{});
 assert.equal(unauthorized.status,403);
});
test('Office and Archive preserve direct immutable-ID horse-file navigation',()=>{
 const next=source('public/next/next.js'),archive=source('public/app.js');
 assert.ok(!next.includes('data-ng="horse-history-file"'),'The duplicate top header shortcut was intentionally removed');
 assert.ok(next.includes("APP.detailTab==='Pedigree'&&isHorse"),'The original Pedigree dropdown hosts the chart');
 assert.ok(next.includes('data-ng="pedigree-ancestor"'),'Ancestor links navigate by ID');
 assert.ok(next.includes("ids.length===1"));
 assert.ok(next.includes("if(kind==='horse')"),'Non-roster horse links must try source ID lookup');
 assert.ok(next.includes("horse='+encodeURIComponent(val)"),'Ancestor navigation uses its immutable H-ID');
 assert.ok(archive.includes("get('horse')"));
 assert.ok(archive.includes("window.addEventListener('popstate'"));
});
