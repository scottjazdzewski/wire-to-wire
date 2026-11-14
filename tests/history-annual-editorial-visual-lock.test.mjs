import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('public/app.js');
const css=read('public/style.css');
const contract=read('docs/design/WTW_HISTORY_LEDGER_YEAR_REVIEW_LOCK_2026-11-14.md');
const start=app.indexOf('function renderHistoryYearReview(){');
const end=app.indexOf('function renderRaces(){',start);
assert.ok(start>0&&end>start,'One canonical Year in Review renderer must exist');
const annual=app.slice(start,end);
const styleStart=css.indexOf('/* THE RACING ANNUAL');
const annualCSS=css.slice(styleStart);

test('Year in Review is a premium branded racing annual, never a flat olive page',()=>{
 assert.ok(styleStart>0,'The user-approved permanent annual editorial stylesheet must exist');
 for(const item of ['history-review-hero','history-review-masthead','history-review-edition',
  'history-review-seal','history-review-stat','history-review-classics-section',
  'history-review-awards-section','history-review-leaders-section',
  'history-review-results-section','history-classic-2','history-classic-3']){
  assert.ok(annual.includes(item)||annualCSS.includes(item),'Missing annual visual hierarchy: '+item);
 }
 assert.match(annualCSS,/--annual-ink:#111a29/);
 assert.match(annualCSS,/--annual-wine:#67263f/);
 assert.match(annualCSS,/--annual-gold:#e4bc74/);
 assert.match(annualCSS,/radial-gradient/);
 assert.match(annualCSS,/\.history-review-hero::before/);
 assert.match(annualCSS,/\.history-classic-2\{/);
 assert.match(annualCSS,/\.history-classic\{/,
  'First Classic uses the shared definitive card style');
 assert.match(annual,/history-classic-'\+\(i\+1\)/,
  'All three Classics get generated stable ordinal classes');
 assert.match(annualCSS,/\.history-classic-3\{/);
 assert.match(annualCSS,/\.history-year-review \.history-ledger-table th\{/);
 assert.match(css,/\.main:has\(\.history-year-review\) > \.callout\{[^}]*color:#f7e7cf/);
 assert.match(css,/\.env-pill\{background:#e2c784;color:#241e2c/);
 assert.doesNotMatch(css,/\.env-pill\{background:#e2c784;color:#dcc487/,
  'Preview provenance label must never be gold text on gold');
 assert.doesNotMatch(annualCSS,/background:linear-gradient\(135deg,#3b503d,#25332d\)/,
  'Retired flat olive annual cards must not return');
 assert.match(contract,/Permanent Year in Review visual identity/);
 assert.match(contract,/NOT flat olive green/);
});

test('The richer Year in Review never invents championships, winners or fake live data',()=>{
 assert.match(annual,/historyYearSummary\(year,state\.data\?\.races\|\|\[\],winners,state\.data\?\.awards\|\|\[\]\)/);
 assert.match(annual,/No source-verified annual awards are available/);
 assert.match(annual,/Winner not recorded in the active source/);
 assert.match(annual,/Recorded Season Leaders/);
 assert.match(annual,/not championship rankings/);
 assert.match(annual,/openButton\('entity',r\.winnerId,r\.winner\)/);
 assert.match(annual,/openButton\('entity',r\.horse_id,r\.name\|\|r\.horse_id\)/);
 assert.doesNotMatch(annual,/Math\.random|mockWinners|fakeAwards/);
});

test('Richer layout preserves year navigation, deep links, back, classic cards and real results',()=>{
 assert.match(annual,/data-history-back="1"/);
 assert.match(annual,/data-history-review-year/);
 assert.match(annual,/'<h2><span>'\+h\(year\)\+'<\/span> <strong>Year in Review<\/strong><\/h2>'/);
 assert.match(annual,/history-classic history-classic-/);
 assert.match(annual,/history-review-table/);
 assert.match(annual,/tabindex="0" role="region"/);
 assert.match(annual,/historyRaceRow\(r,false\)/);
 assert.match(css,/\.history-ledger-table-region\{[^}]*overflow:auto/);
 assert.ok(!annualCSS.includes('.vault-race-card'),'No retired month card stylesheet');
 assert.match(css,/\.history-ledger-table th\{[^}]*position:sticky/);
});
