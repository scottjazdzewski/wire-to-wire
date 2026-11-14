import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const commandsSource=read('public/next/office-direct-command.js');
const officeSource=read('public/office-v30-4.js');
const ui=read('public/next/next.js');
const html=read('public/next/index.html');
const visualAudit=read('scripts/desktop-visual-audit.sh');
const boot=(manager,other={})=>{
 const window={__WTW_1999_MANAGEMENT__:manager,...other};
 const module={exports:{}};
 vm.runInNewContext(commandsSource,{window,module,Promise,URLSearchParams,Error,String,Object});
 return {window,api:module.exports};
};

test('Office Home delegates exactly once to the existing canonical native route action',()=>{
 let returns=0;
 const {api}=boot({mode:'FOUNDING_1999',returnToOffice:()=>{returns++;return true;}});
 assert.equal(api.dispatch('RETURN_OFFICE'),true);
 assert.equal(returns,1);
 assert.match(officeSource,/game\.returnToOffice=\(\)=>\{\s*loadCase\(currentCase,true\);\s*return true;/);
 assert.doesNotMatch(commandsSource,/\bdocument\b|querySelector|\.click\(/);
 assert.doesNotMatch(commandsSource,/localStorage\.setItem/);
});

test('Office Home fails closed when manager has no canonical route service',()=>{
 const {api}=boot({mode:'FOUNDING_1999'});
 assert.throws(()=>api.dispatch('RETURN_OFFICE'),/navigation service unavailable/);
 assert.throws(()=>boot({mode:'ARCHIVE',returnToOffice:()=>true}).api.dispatch('RETURN_OFFICE'),/not ready/);
});

test('the current Office home button does not click the invisible Office app',()=>{
 const snippet=ui.slice(ui.indexOf('function goOffice(){'),ui.indexOf('\nfunction openMenu('));
 assert.ok(snippet.includes("commands.dispatch('RETURN_OFFICE')"));
 assert.ok(snippet.includes("if(window.__WTW_1999_MANAGEMENT__)"));
 assert.ok(snippet.includes("if(hadCustom)pushUIHistory('')"));
 assert.ok(snippet.includes("bridgeNode(originalAct('Office Overview')); // Non-founding compatibility only."));
 assert.ok(snippet.indexOf("commands.dispatch('RETURN_OFFICE')")<snippet.indexOf("bridgeNode(originalAct('Office Overview'))"));
});

test('Stable and all canonical departments open through one identical renderer and route history',()=>{
 const snippet=ui.slice(ui.indexOf('function openMenu('),ui.indexOf('\nfunction pageTab('));
 assert.match(snippet,/if\(section==='Office'\)return goOffice\(\)/);
 assert.match(snippet,/if\(section==='Stable'\|\|DEP_NAMES\.has\(section\)\)/);
 assert.match(snippet,/openCustomView\(section\+' — Overview',section,'Overview'\)/);
 assert.match(snippet,/if\(section==='History'\)\{window\.location\.assign/);
 assert.ok(snippet.indexOf("if(section==='Stable'||DEP_NAMES.has(section))")<snippet.indexOf('bridgeNode(originalAct(actions[section]))'));
 for(const section of ['Racing','Sales','Breeding','Personnel','Facilities','Finances','Tracks'])
  assert.ok(ui.includes("'"+section+"'"),section+' source-backed department missing');
 assert.match(ui,/if\(typeof DEP_NAMES!=='undefined'&&DEP_NAMES\.has\(section\)\)return departmentRoster\(section,page\)/);
 assert.match(ui,/function pushUIHistory\(view\)/);
});

test('the navigation upgrade loads the original Office provider before the direct command and one visible UI',()=>{
 const i=html.indexOf('src="/office-v30-4.js?rev=');
 const c=html.indexOf('src="/next/office-direct-command.js?rev=');
 const n=html.indexOf('src="/next/next.js?rev=');
 assert.ok(i>0&&c>i&&n>c);
 assert.equal((html.match(/rel="stylesheet"/g)||[]).length,1);
 assert.match(html,/data-wtw-layout="legacy-data-bridge" aria-hidden="true" hidden/);
});


test('desktop release gate exercises real department clicks, Office Home, Back and Forward',()=>{
 assert.match(visualAudit,/__wtw_nav_probe\.html/);
 assert.match(visualAudit,/press\('menu',section\)/);
 assert.match(visualAudit,/press\('office'\)/);
 assert.match(visualAudit,/w\.history\.back\(\)/);
 assert.match(visualAudit,/w\.history\.forward\(\)/);
 assert.match(visualAudit,/DIRECT FM\/OOTP NAVIGATION VERIFIED/);
});
