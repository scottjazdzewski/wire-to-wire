import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const load=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const bootstrap=load('public/next/1999-bootstrap.js');
const ui=load('public/next/next.js');
const css=load('public/next/next.css');
const source=load('public/next/1999-ui-source.mjs');
const career=load('public/next/1999-commercial-career-manager.mjs');
const key='wtw1999FoundingStateV1';

function boot(records={}){
 const rows=new Map(Object.entries(records));
 const localStorage={
  getItem:k=>rows.has(k)?rows.get(k):null,
  setItem:(k,v)=>rows.set(k,String(v)),
  removeItem:k=>rows.delete(k)
 };
 const window={};
 vm.runInNewContext(bootstrap,{localStorage,window,JSON,console});
 return {rows,game:JSON.parse(rows.get(key))};
}

test('Kingsmere opening career has modeled cash but no fabricated historical transaction',()=>{
 const {game}=boot();
 assert.equal(game.finances.stable.available_cash,2500000);
 assert.equal(game.finances.openingCapital.amount_minor,250000000);
 assert.equal(game.finances.openingCapital.operation_id,'O-000061');
 assert.match(game.finances.openingCapital.provenance,/MODELED_/);
 assert.equal(game.finances.openingCapital.posted,false);
 assert.equal(game.worldAnchor.lastCommittedTransaction,null);
 assert.equal(game.worldAnchor.lastCommittedRaceResult,null);
 assert.deepEqual(game.decisionLog,[]);
});

test('older untouched founding saves gain opening capital without losing their clock',()=>{
 const first=boot(),old={...first.game,date:'1999-01-03',turn:2,finances:{}};
 const {game}=boot({...Object.fromEntries(first.rows),[key]:JSON.stringify(old)});
 assert.equal(game.date,'1999-01-03');
 assert.equal(game.turn,2);
 assert.equal(game.finances.stable.available_cash,2500000);
 assert.equal(game.worldAnchor.lastCommittedTransaction,null);
});

test('existing financial state is never re-funded or overwritten',()=>{
 const first=boot(),old={...first.game,finances:{stable:{available_cash:0,status:'Exhausted'}}};
 const {game}=boot({...Object.fromEntries(first.rows),[key]:JSON.stringify(old)});
 assert.equal(game.finances.stable.available_cash,0);
 assert.equal(game.finances.stable.status,'Exhausted');
});

test('operation overview fills the route, and navigation controls retain equal dimensions',()=>{
 assert.match(ui,/function organizationOverview\(/);
 assert.match(ui,/ng-org-overview-grid/);
 assert.match(css,/\.ng-route-organization \.ng-routeinner\{display:block!important/);
 assert.match(css,/#wtwNextgen \.ng-subbar \.ng-subnav>button\{/);
 assert.match(css,/#wtwNextgen \.ng-route-profile \.ng-profiletabs>button\{/);
 assert.match(css,/\.ng-tier1-org \.ng-org-overview-grid\{display:grid!important/);
});

test('career operation, roster, date, and money are projected from saved canonical gameplay',()=>{
 assert.match(career,/function publishCareerReadModel\(/);
 assert.match(career,/operation_balances_minor/);
 assert.match(career,/run\.stable_horse_ids/);
 assert.match(ui,/window\.__WTW_ACTIVE_WORLD_CAREER_VIEW__/);
 assert.match(ui,/function availableCash\(/);
 assert.match(ui,/gameplayService\?\.state/);
 assert.match(source,/title:officeTitle\(title\)/);
});
