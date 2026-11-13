import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('public/next/index.html');
const bootstrap=read('public/next/1999-bootstrap.js');
const ui=read('public/next/next.js');
const config=read('public/next/1999-commercial-config.js');
const source=read('public/next/1999-ui-source.mjs');
const worker=read('public/next/1999-world-index.worker.mjs');
const api=read('public/1999/engine/local-api.mjs');
const manager=read('public/next/1999-commercial-career-manager.mjs');

test('approved interface loads commercial config before bootstrap and manager after UI',()=>{
 const a=html.indexOf('/next/1999-commercial-config.js');
 const b=html.indexOf('/next/1999-bootstrap.js');
 const c=html.indexOf('/next/next.js?rev=');
 const d=html.indexOf('/next/1999-commercial-career-manager.mjs');
 assert.ok(a>=0&&b>a&&c>b&&d>c,'Incorrect loading order');
 assert.match(html,/1999-commercial-career\.css/);
 assert.match(ui,/if\(key==='save-open'\)/);
 assert.match(ui,/window\.WTWCompactCareerManager\?\.open/);
});
test('founding-world career uses isolated save namespaces and never imports prior large-world state',()=>{
 assert.match(bootstrap,/worldProfile:world/);
 assert.match(bootstrap,/population:world\.population/);
 assert.match(bootstrap,/MAIN='wtw1999FoundingStateV1'/);
 assert.match(bootstrap,/SCHEMA='WTW_1999_FOUNDING_CAREER_V1'/);
 assert.match(bootstrap,/namedSaveKey:'wtw1999FoundingNamedSavesV1'/);
 assert.match(bootstrap,/Earlier 325k\/2014 saves, decisions and named saves are NOT imported or deleted/);
 assert.match(config,/wtwFoundingWorldProfileV1/);
 assert.match(config,/anchor\.worldProfile\?\.population/);
 assert.match(config,/mode:'FOUNDING_1999'/);
 assert.match(config,/population:112/);
});
test('world directory, worker and on-demand horse profiles use the same seed, mode and population',()=>{
 assert.match(source,/const gameWorldProfile=/);
 assert.match(source,/const worldQuery=/);
 assert.match(source,/population='\+encodeURIComponent\(gameWorldProfile\.population\)/);
 assert.match(source,/worker\.mjs\?rev=.*'\+worldQuery/);
 assert.match(worker,/const worldOptions=new URLSearchParams\(self\.location\?\.search\|\|''\)/);
 assert.match(worker,/population='\+encodeURIComponent\(population\)/);
 assert.match(api,/scopeWorldPopulation\(create1999Universe\(\{seed,mode\}\),profile\)/);
});
test('compact manager never stores full horse directory or requires a paid account',()=>{
 assert.match(manager,/indexedDB\.open\(DB_NAME,1\)/);
 assert.match(manager,/encodeCareerSave\(game,baseline,profile\)/);
 assert.match(manager,/packCareerFile\(record\)/);
 assert.match(manager,/await storeGame\('Pre-new-world backup/);
 assert.match(manager,/migrateLegacy/);
 assert.doesNotMatch(manager,/worldHorseDirectoryAt|allPages|fetch\(/);
 assert.match(manager,/No account, monthly fee or cloud storage required/);
});
