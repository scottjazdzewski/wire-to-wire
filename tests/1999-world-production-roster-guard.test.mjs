import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ui=read('public/next/next.js');
const source=read('public/next/1999-ui-source.mjs');
const model=read('public/1999/engine/full-world-generator.mjs');
const api=read('public/1999/engine/local-api.mjs');
const shell=read('public/next/index.html');
const css=read('public/next/next.css');

test('Sales is native, Breeding has no duplicate top tabs, Horse Directory is in the Racing World sidebar',()=>{
 assert.match(ui,/if\(section==='Sales'\)return openCustomView\('Sales — Overview'/);
 assert.match(ui,/if\(s==='Sales'&&name==='Overview'\)return openCustomView/);
 assert.match(ui,/APP\.section==='Breeding'\|\|Boolean/);
 assert.match(ui,/\['Horse Directory','world-directory','1999 Horses'/);
 assert.match(ui,/if\(key==='world-directory'\)/);
});

test('large horse and breeding populations are paged against one source world',()=>{
 assert.match(model,/const HORSE_POPULATION=87500/);
 assert.match(model,/MARE_BREEDING_STOCK=26000,STALLION_BREEDING_STOCK=1400/);
 assert.match(model,/annualFoalingForecast/);
 assert.match(api,/\/api\/1999\/sim\/breeding-stock/);
 assert.match(api,/\/api\/1999\/sim\/foaling-forecast/);
 assert.match(source,/function breedingMarePage\(/);
 assert.match(source,/function breedingMareBrowse\(/);
 assert.match(model,/function mareDirectoryAt\(i\)/);
 assert.match(api,/\/api\/1999\/sim\/mare-directory/);
 assert.match(ui,/globalMareDirectory/);
 assert.match(source,/function worldHorseBrowse\(/);
 assert.match(ui,/worldHorseBrowse\(\{/);
 assert.match(ui,/_directoryIndex/);
});

test('global horse indexes match exact generator identities; model test results stay separate',()=>{
 assert.match(model,/function horseDirectoryAt\(index\)/);
 assert.match(model,/function horseAt\(index\)/);
 assert.match(model,/openingCondition\(id,age,status\)/);
 assert.match(model,/SIMULATED_1999_START_STATE_NOT_OBSERVED_VET_FACT/);
 assert.match(ui,/modelRating\('current_ability'\)/);
 assert.match(ui,/source\.source==='1999_TEST_GENERATED'\?'Unraced':'Not recorded'/);
});

test('every roster has column/age/sex/status filtering and attributes can sort independently',()=>{
 assert.match(shell,/1999-roster-filters\.js\?rev=/);
 assert.match(ui,/WTW1999RosterFilters\.matches/);
 assert.match(ui,/roster-filter-clear/);
 assert.match(ui,/if\(key==='stable-attribute-sort'\)/);
 assert.match(ui,/Sorting a visible column must NOT rearrange/);
 assert.match(css,/ng-list-filters/);
 const window={};
 runInNewContext(read('public/next/1999-roster-filters.js'),{window});
 const filter={ageMin:'3',ageMax:'7',sex:'MARE',status:'AT STUD',field:'stamina',query:'91'};
 assert.equal(window.WTW1999RosterFilters.matches({age:5,sex:'MARE',status:'AT_STUD',stamina:91},filter),true);
 assert.equal(window.WTW1999RosterFilters.matches({age:9,sex:'MARE',status:'AT_STUD',stamina:91},filter),false);
 assert.equal(window.WTW1999RosterFilters.matches({age:5,sex:'COLT',status:'AT_STUD',stamina:91},filter),false);
});

test('jockey booking market and owner purse negotiations are modeled not booked',()=>{
 assert.match(model,/jockeyBookingMarket\(jockey,ownerId/);
 assert.match(model,/SIMULATED_INTEREST_NOT_BOOKED/);
 assert.match(model,/market:'MAJOR_RACE_INTEREST_SIMULATED_NOT_CONFIRMED'/);
 assert.match(model,/jockeyBudgetBand/);
 assert.match(source,/competingBarns:p\.bookingMarket/);
 assert.match(ui,/EXPECTED RIVAL INTEREST · NOT OFFERS/);
 assert.match(ui,/\['competingBarns','RIVAL BARNS'/);
});
