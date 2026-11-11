import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const get=name=>fs.readFileSync(path.join(root,name),'utf8');
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function chart(){
 const js=get('public/next/next.js');
 const start=js.indexOf('const horsePedigreeCache=new Map();'),end=js.indexOf('function profileDetail(route){',start);
 assert.ok(start>0&&end>start);
 return new Function('safe',js.slice(start,end)+'\nreturn {render:officeFiveGenerationPedigree,cache:horsePedigreeCache};')(safe);
}
test('Horse Profile retains only existing Pedigree dropdown and removes header shortcut',()=>{
 const js=get('public/next/next.js');
 assert.ok(js.includes("tabs.filter(t=>!['Overview','History'].includes(t))"));
 assert.ok(js.includes("'Pedigree','Achievements','Connections'"));
 assert.ok(js.includes("APP.detailTab==='Pedigree'&&isHorse"));
 assert.ok(js.includes("left=officeFiveGenerationPedigree(route.title)"));
 assert.ok(!js.includes('horse-history-file'));
 assert.ok(!js.includes('FIVE-GENERATION PEDIGREE ↗'));
});
test('The existing profile tab renders exactly 63 positions, six columns and ID-clickable ancestors',()=>{
 const {render,cache}=chart();
 cache.set('Test Runner',{status:'ready',data:{
  horse_id:'H-1995-000001',known_positions:4,
  nodes:[{path:'',horse_id:'H-1995-000001',name:'Test Runner'},
   {path:'S',horse_id:'H-1985-000001',name:'Example Sire'},
   {path:'D',horse_id:'H-1987-000001',name:'Example Dam'},
   {path:'DS',horse_id:'H-1985-000001',name:'Example Sire'}]
 }});
 const html=render('Test Runner');
 assert.equal((html.match(/class="ng-ped5-node /g)||[]).length,63);
 assert.equal((html.match(/class="ng-ped5-generation"/g)||[]).length,6);
 assert.ok(html.includes('data-ng="pedigree-ancestor" data-val="H-1985-000001"'));
 assert.ok(html.includes('repeated'));
 assert.ok(html.includes('4 / 63 POSITIONS SOURCE-LINKED'));
 assert.ok(html.includes('Unknown'));
});
test('Unlinked Office horse remains on pedigree page with honest unknown ancestors',()=>{
 const {render,cache}=chart();
 cache.set('Bellarmine',{status:'unlinked'});
 const html=render('Bellarmine');
 assert.equal((html.match(/class="ng-ped5-node /g)||[]).length,63);
 assert.ok(html.includes('HORSE ID NOT CONNECTED'));
 assert.ok(html.includes('Unknown'));
 assert.ok(!html.includes('data-ng="pedigree-ancestor"'));
});
test('Office pedigree source lookup and ancestor navigation use immutable IDs',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css');
 assert.ok(js.includes("ids.length!==1"));
 assert.ok(js.includes("e.name===name||e.source_name===name"));
 assert.ok(js.includes("'/api/horses/'+encodeURIComponent(ids[0])+'/pedigree'"));
 assert.ok(js.includes("if(key==='pedigree-ancestor')"));
 assert.ok(js.includes("'/archive/?page=horses&horse='+encodeURIComponent(val)"));
 assert.ok(css.includes('.ng-ped5-columns'));
 assert.ok(css.includes('overflow-x:auto'));
 assert.ok(css.includes('.ng-ped5-node.repeated'));
 assert.ok(!get('public/index.html').includes('pedigree-in-existing-tab.css'));
});

test('Pedigree displays the selected Office horse even when historic parents are unlinked',()=>{
 const {render,cache}=chart();
 cache.set('Bellarmine',{status:'unlinked'});
 const html=render('Bellarmine');
 assert.match(html,/class="ng-ped5-node known subject paternal"/);
 assert.match(html,/<strong>Bellarmine<\/strong>/);
 assert.match(html,/SCROLL RIGHT/);
 assert.match(html,/GRANDPARENTS/);
 assert.equal((html.match(/class="ng-ped5-node /g)||[]).length,63);
});
test('The first three generations fit the initial viewport, older ancestors scroll horizontally without tall empty boxes',()=>{
 const css=get('public/next/next.css');
 assert.match(css,/grid-template-columns:max\(180px,19cqw\) max\(230px,28cqw\) max\(340px,calc\(53cqw - 32px\)\) repeat\(3,240px\)/);
 assert.match(css,/\.ng-ped5-scroller\{container-type:inline-size;overflow-x:auto;overflow-y:hidden/);
 assert.match(css,/\.ng-ped5-stack\{[^}]*height:456px;min-height:456px;max-height:456px/);
 assert.match(css,/\.ng-ped5-node\.subject/);
 assert.match(css,/\.ng-ped5-generation:nth-child\(3\) \.ng-ped5-node/);
 assert.ok(!css.includes('min-height:690px'));
});
