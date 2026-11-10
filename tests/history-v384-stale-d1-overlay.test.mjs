import test from 'node:test';
import assert from 'node:assert/strict';
import {api,historicalSourceStatus,isHistoricalEditionVisible} from '../src/worker.js';
import inactive from '../data/history-audit/qa-pending-v384-inactive-edition-ids.json' with {type:'json'};

const held='HSE-1958-0006'; // Quarantined in Drive v3.84, ACTIVE in stale D1 fixtures.
const live='RE-1922-US-2602';
function race(id,year){return {id,year,name:id,status:'ACTIVE',date:null};}
function place(edition_id,horse_id='H-TEST',position=1){return {edition_id,horse_id,position};}
function makeDB(){
  const statements=[];
  const storedRaces=[race(held,1958),race(live,1922)];
  const storedResults=[place(held),place(live)];
  const db={prepare(sql){
    statements.push(sql);
    return {
      bind(...args){this.args=args;return this;},
      async first(){return {n:2,horseDetails:0,horseSeasons:0,pedigreeEdges:0,bloodlineProfiles:0};},
      async all(){
        if(sql.includes('FROM races r LEFT JOIN'))return {results:this.args?.length?storedRaces.filter(r=>r.year===this.args[0]):storedRaces};
        if(sql.startsWith('SELECT p.edition_id,p.horse_id,p.position FROM results'))return {results:storedResults};
        if(sql.startsWith('SELECT r.* FROM results r JOIN races e'))return {results:this.args?.length?storedResults.filter(r=>storedRaces.find(x=>x.id===r.edition_id)?.year===this.args[0]):storedResults};
        if(sql.startsWith('SELECT DISTINCT year FROM races'))return {results:[{year:1922},{year:1958}]};
        return {results:[]};
      }
    };
  }};
  return {db,statements};
}
test('authoritative 223-ID historical hold list is deterministic and source-labeled',()=>{
  assert.equal(inactive.authority.source_status,'V3.84_QA_PENDING');
  assert.equal(inactive.counts.excluded,223);
  assert.equal(inactive.excluded.length,223);
  assert.equal(new Set(inactive.excluded.map(r=>r.edition_id)).size,223);
  assert.equal(historicalSourceStatus.exclusion_list_size,223);
  assert.equal(historicalSourceStatus.result_delta_status,'NOT_RECONCILED_NOT_PROMOTED');
});
test('visibility excludes Drive-quarantined ID even when old D1 status says ACTIVE',()=>{
  assert.equal(isHistoricalEditionVisible(race(held,1958)),false);
  assert.equal(isHistoricalEditionVisible(race(live,1922)),true);
  assert.equal(isHistoricalEditionVisible({...race(live,1922),status:'QUARANTINED_HISTORICAL_NOT_RUN'}),false);
});
test('historical bootstrap excludes stale D1 race/result and corrects displayed year/count',async()=>{
  const {db,statements}=makeDB();
  const resp=await api(new Request('http://localhost/api/bootstrap'),{DB:db},'tester@example.com');
  assert.equal(resp.status,200);
  const data=await resp.json();
  assert.deepEqual(data.races.map(x=>x.id),[live]);
  assert.deepEqual(data.results.map(x=>x.edition_id),[live]);
  assert.deepEqual(data.years,[1922,1958]); // Year navigation stays complete even if one fixture race is held.
  assert.equal(data.counts.races,1);
  assert.equal(data.counts.results,1);
  assert.equal(data.historySource.canonical_race_authority,'Drive E/W/M v3.84 QA_PENDING');
  assert.equal(data.historySource.result_delta_status,'NOT_RECONCILED_NOT_PROMOTED');
  assert.ok(statements.every(s=>!/^\s*(INSERT|UPDATE|DELETE|DROP|ALTER)\b/i.test(s)));
});
test('year API cannot reintroduce stale quarantine from imported v3.37 D1',async()=>{
  const {db,statements}=makeDB();
  const resp=await api(new Request('http://localhost/api/seasons?year=1958'),{DB:db},'tester@example.com');
  assert.equal(resp.status,200);
  const data=await resp.json();
  assert.deepEqual(data.races.map(x=>x.id),[]); // Year 1958 contains only an excluded edition.
  assert.deepEqual(data.results.map(x=>x.edition_id),[]);
  assert.equal(data.historySource.exclusion_list_size,223);
  assert.ok(statements.every(s=>!/^\s*(INSERT|UPDATE|DELETE|DROP|ALTER)\b/i.test(s)));
});
test('read-only history source health reports stale result projection',async()=>{
  const {db}=makeDB();
  const resp=await api(new Request('http://localhost/api/health'),{DB:db},'tester@example.com');
  const data=await resp.json();
  assert.equal(data.status,'ok');
  assert.match(data.historySource.warning,/Older site results remain provisional/);
});
