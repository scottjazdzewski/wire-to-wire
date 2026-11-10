import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const css=read('public/next/next.css');
const js=read('public/next/next.js');

function closingBrace(s,open){
 let depth=0,quote='';
 for(let i=open;i<s.length;i++){
  const c=s[i];
  if(quote){if(c===quote&&s[i-1]!=='\\')quote='';continue}
  if(c==="'"||c==='"'){quote=c;continue}
  if(c==='{')depth++;
  if(c==='}'&&--depth===0)return i;
 }
 throw new Error('Unbalanced CSS rule at '+open);
}
function ruleList(s,scope='',result=[]){
 let begin=0,quote='',depth=0;
 for(let i=0;i<s.length;i++){
  const c=s[i];
  if(quote){if(c===quote&&s[i-1]!=='\\')quote='';continue}
  if(c==="'"||c==='"'){quote=c;continue}
  if(c==='(')depth++;
  if(c===')')depth--;
  if(c===';'&&depth===0){begin=i+1;continue}
  if(c==='{'&&depth===0){
   const selector=s.slice(begin,i).trim();
   const end=closingBrace(s,i);
   const body=s.slice(i+1,end);
   if(selector.startsWith('@media'))ruleList(body,scope+'|'+selector.replace(/\s+/g,''),result);
   else result.push({selector,scope,body});
   i=end;begin=i+1;
  }
 }
 return result;
}
function property(rule,key){
 const p=rule.body.split(';').map(x=>x.trim());
 const found=p.findLast(x=>x.startsWith(key+':'));
 return found?.slice(key.length+1)||'';
}

test('One rebuilt canonical design system contains no duplicate selector blocks or extra CSS layers',()=>{
 const main=read('public/index.html'),review=read('public/next/index.html');
 for(const html of [main,review]){
  assert.equal((html.match(/rel="stylesheet"/g)||[]).length,1,'Only one active CSS file per page');
  assert.ok(html.includes('href="/next/next.css"'));
  assert.ok(!html.includes('<style'),'No secondary inline CSS layer');
 }
 assert.ok(css.startsWith('/* WIRE TO WIRE | UNIFIED DESKTOP MANAGEMENT DESIGN SYSTEM'));
 assert.ok(!css.includes('@import'),'No CSS patch imports');
 const rules=ruleList(css.replace(/\/\*[\s\S]*?\*\//g,''));
 const keys=rules.map(r=>r.scope+'|'+r.selector);
 assert.equal(new Set(keys).size,keys.length,'Each selector may appear once per media condition, not as trailing override patches');
 assert.ok(rules.length>900,'All existing connected screens must retain the original functional styling');
 assert.ok(css.includes('--wt-bg:#0b1014'),'Charcoal canvas must remain canonical');
 assert.ok(css.includes('--wt-forest:#244d3d'),'Racing green remains a controlled accent');
 assert.ok(css.includes('--wt-gold:#dcc487'),'Warm racing-gold highlights remain consistent');
});

test('Dark FM/OOTP styling applies coherently to the Racing Office and every Tier 1 page family',()=>{
 const rules=ruleList(css.replace(/\/\*[\s\S]*?\*\//g,'')).filter(x=>x.scope==='');
 const get=sel=>rules.find(r=>r.selector===sel);
 const expected=[
  ['#wtwNextgen','background','#0b1014'],
  ['.ng-board','background','#0d1317'],
  ['.ng-card','background','#1a2024'],
  ['.ng-cardhead','background','#282f32'],
  ['.ng-featurebody','background','linear-gradient('],
  ['.ng-profile-intro','background','linear-gradient('],
  ['.ng-tier1-card','background','#192125'],
  ['.ng-org-overview-panel','background','#1b2226'],
  ['.ng-search-roster-page','background','#11181c'],
  ['.ng-search-table-head','background','#2a3532'],
  ['.ng-search-roster-page .ng-search-row','background','#1e272a'],
 ];
 for(const [selector,key,value] of expected){
  const rule=get(selector);
  assert.ok(rule,'Missing shared component '+selector);
  assert.ok(property(rule,key).startsWith(value),'Wrong dark palette for '+selector+': '+property(rule,key));
 }
 for(const component of ['ng-inbox','ng-featurephoto','ng-intelgrid','ng-choices','ng-rosterrow','ng-entryrow','ng-person-workspace-overview','ng-athlete-category','ng-horse-owner-badge','ng-tier1-workspace','ng-search-roster-page']){
  assert.ok(css.includes(component),'Missing existing functional component '+component);
 }
 assert.ok(js.includes('function center()'),'Keep the original Decision Desk renderer');
 assert.ok(js.includes('function profileDetail('),'Keep source-backed athlete/person profiles');
 assert.ok(js.includes('function searchView()'),'Keep genuine Search records');
 assert.ok(js.includes('horseOwnerBadge'),'Keep owner identity next to horses');
});
