import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const file=p=>new URL('../'+p,import.meta.url);
const read=p=>readFileSync(file(p),'utf8');
const html=read('public/next/index.html');
const bootstrap=read('public/next/1999-bootstrap.js');
const ui=read('public/next/next.js');
const config=read('public/next/1999-commercial-config.js');
const source=read('public/next/1999-ui-source.mjs');
const api=read('public/1999/engine/local-api.mjs');
const manager=read('public/next/1999-commercial-career-manager.mjs');

test('approved UI loads small 1999 commercial config before bootstrap and career manager after UI',()=>{
 const a=html.indexOf('/next/1999-commercial-config.js');
 const b=html.indexOf('/next/1999-bootstrap.js');
 const c=html.indexOf('/next/next.js?rev=');
 const d=html.indexOf('/next/1999-commercial-career-manager.mjs');
 assert.ok(a>=0&&b>a&&c>b&&d>c);
 assert.match(html,/1999-commercial-career\.css/);
 assert.match(ui,/if\(key==='save-open'\)/);
 assert.match(ui,/window\.WTWCompactCareerManager\?\.open/);
});
test('retired 2014 and generated-world browser storage cannot be selected or migrated',()=>{
 assert.match(bootstrap,/CLEAN_RESET='wtw1999UserApprovedCleanResetV2'/);
 assert.match(bootstrap,/localStorage\.removeItem\(MAIN\)/);
 assert.match(bootstrap,/indexedDB\?\.deleteDatabase\?/);
 assert.match(config,/population:73/);
 assert.match(config,/mode:'FOUNDING_1999'/);
 assert.match(config,/mode!=='FOUNDING_1999'\|\|population!==73/);
 assert.match(manager,/WireToWireClean1999CareersV2/);
 assert.doesNotMatch(manager,/migrateLegacy|COPY LEGACY SAVES|FULLY_FICTIONAL_TEST/);
});
test('73-source world directory has no worker, no population mode and no full-world factory',()=>{
 assert.match(source,/const gameWorldProfile=/);
 assert.match(source,/const worldQuery=/);
 assert.match(source,/&mode=FOUNDING_1999&population=73/);
 assert.doesNotMatch(source,/1999-world-index\.worker|FULLY_FICTIONAL_TEST/);
 assert.match(api,/Retired synthetic world mode is not available/);
 assert.equal(existsSync(file('public/next/1999-world-index.worker.mjs')),false);
 assert.equal(existsSync(file('public/1999/engine/full-world-generator.mjs')),false);
});
test('local-first compact manager retains saves but cannot import an old population',()=>{
 assert.match(manager,/indexedDB\.open\(DB_NAME,1\)/);
 assert.match(manager,/encodeCareerSave\(game,baseline,profile\)/);
 assert.match(manager,/packCareerFile\(record\)/);
 assert.match(manager,/await storeGame\('Pre-new-world backup/);
 assert.doesNotMatch(manager,/worldHorseDirectoryAt|allPages|fetch\(/);
 assert.match(manager,/No account, monthly fee or cloud storage required/);
});
