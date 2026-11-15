import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ui=source('public/next/next.js');
const html=source('public/next/index.html');
const audit=source('scripts/desktop-visual-audit.sh');
const start=ui.indexOf('function sourceOpportunityBoard(){');
const end=ui.indexOf('\nfunction managerDashboard(){',start);
assert.ok(start>0&&end>start,'Headless opportunity board must use one current manager screen');
const snippet=ui.slice(start,end);
const helpers=ui.slice(ui.indexOf('function managerRecordSortState('),
 ui.indexOf('function sourceNewsDesk()'));
assert.ok(helpers.includes('function managerSortRecords(')&&helpers.includes('function managerSortableColumns('),
 'All management screens must reuse the same actual sorter and header controls');
const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
function render(notes=[],due=[]){
 return new Function('safe','glyph','managerRecordViewControl','currentMessages','dueActions','depGameDay','APP',
  helpers+'\n'+snippet+'\nreturn sourceOpportunityBoard;')(
  escape,()=>'<svg aria-hidden="true"></svg>',
  ()=>' <label>RECORD VIEW <select data-ng-select="manager-screen"></select></label> ',
  ()=>notes,()=>due,()=>'1999-01-01',{managerSortScope:'',managerSortKey:'',managerSortDesc:false})();
}

test('opening Opportunity Board uses the one approved route, never clicks an obsolete Office button',()=>{
 const click=ui.slice(ui.indexOf("if(key==='custom'){"),ui.indexOf("if(key==='back')"));
 assert.match(click,/if\(val==='Opportunities'\)return openCustomView\('Opportunities','Office','Overview'\)/);
 assert.doesNotMatch(click,/bridgeNode\(originalAct\('Open opportunity board'\)\)/);
 assert.match(ui,/else if\(APP\.custom==='Opportunities'\)\{body=sourceOpportunityBoard\(\)\}/);
 assert.match(ui,/isManager=body\.startsWith\('<section class="ng-manager-screen'\)/);
 assert.doesNotMatch(ui,/OPEN LIVE OPPORTUNITY BOARD/);
 assert.match(html,/\/next\/next\.js\?rev=wtw1999-ledbetter-approved-20261114/);
});

test('Opportunity Board uses existing FM/OOTP workspace, control grammar and direct desk navigation',()=>{
 const out=render();
 for(const cls of ['ng-manager-screen ng-opportunity-screen','ng-manager-head','ng-manager-metrics',
  'ng-manager-workspace','ng-manager-primary','ng-manager-sidebar','ng-manager-columns','ng-manager-rows'])
  assert.ok(out.includes(cls),cls);
 assert.match(out,/data-ng-select="manager-screen"/);
 assert.match(out,/data-ng="menu" data-val="Racing"/);
 assert.match(out,/data-ng="menu" data-val="Sales"/);
 assert.match(out,/OFFICE \/ OPPORTUNITIES/);
 assert.equal((out.match(/class="ng-manager-metric"/g)||[]).length,4);
 assert.doesNotMatch(snippet,/querySelector|\.app \[data-act\]|originalAct|document\./);
});

test('the queue contains only current priority Office messages and real due follow-ups',()=>{
 const notes=[
  {case:'opening-stakes',title:'Stakes meeting',from:'Racing Secretary',meta:'No entries',urgent:true,resolved:false},
  {case:'opening-tracks',title:'Track list',from:'Registrar',meta:'Information',urgent:false,resolved:false},
  {case:'reviewed',title:'Reviewed item',from:'Office',urgent:true,resolved:true}
 ];
 const due=[{id:'FU-01',caseId:'opening-stakes',caseTitle:'Confirm race plans',dueDate:'1999-01-02'}];
 const out=render(notes,due);
 assert.equal((out.match(/class="ng-manager-row"/g)||[]).length,2);
 assert.match(out,/data-ng="case" data-val="opening-stakes"/);
 assert.match(out,/data-ng="followup" data-val="FU-01"/);
 assert.match(out,/2 CURRENT ACTIONS/); // one urgent briefing and one due follow-up
 assert.doesNotMatch(out,/data-val="opening-tracks"|data-val="reviewed"/);
 assert.match(out,/3<\/strong><\/div>/);
 assert.doesNotMatch(out,/Argosy colt buzz building|Pieta gallop-out report|Powerline inquiry/);
});

test('empty management queue says no priorities instead of inventing racing or sales opportunities',()=>{
 const out=render([],[]);
 assert.match(out,/0 CURRENT ACTIONS/);
 assert.match(out,/No priority briefings or due follow-ups are recorded/);
 assert.match(out,/It does not reuse the retired demo opportunity list/);
 assert.doesNotMatch(out,/Powerline inquiry|Saratoga catalog|retired Office opportunity board/);
});

test('all source text is escaped and active controls are actionable',()=>{
 const out=render([{case:'A" onclick="bad()',title:'<script>x</script>',urgent:true,from:'<b>Office</b>'}],[]);
 assert.doesNotMatch(out,/<script>x<\/script>|onclick="bad\(\)"/);
 assert.match(out,/&lt;script&gt;x&lt;\/script&gt;/);
 assert.match(out,/data-ng="case"/);
});

test('release audit captures and measures the actual source-backed Opportunity screen',()=>{
 assert.match(audit,/capture opportunity-board/);
 assert.match(audit,/ng-opportunity-screen/);
 assert.match(audit,/probe opportunity-board/);
});
