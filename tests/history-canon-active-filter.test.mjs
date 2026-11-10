import test from 'node:test';
import assert from 'node:assert/strict';
import {api} from '../src/worker.js';

function dbSpy(){
  const sql=[];
  const db={prepare(statement){
    sql.push(statement);
    return {
      bind(){return this},
      async first(){return {n:0}},
      async all(){return {results:[]}}
    };
  }};
  return {db,sql};
}
test('website History bootstrap excludes quarantined editions without deleting them',async()=>{
  const {db,sql}=dbSpy();
  const reply=await api(new Request('http://localhost/api/bootstrap'),{DB:db},'test@wtw.local');
  assert.equal(reply.status,200);
  const body=await reply.json();
  assert.equal(body.mode,'D1_CONNECTED');
  const joined=sql.join('\n');
  assert.match(joined,/FROM races WHERE status NOT LIKE 'QUARANTINED%'/);
  assert.match(joined,/SELECT p\.edition_id,p\.horse_id,p\.position FROM results p JOIN races r/);
  assert.match(joined,/FROM races r .*WHERE r\.status NOT LIKE 'QUARANTINED%'/);
  assert.match(joined,/SELECT DISTINCT year FROM races WHERE status NOT LIKE 'QUARANTINED%'/);
  assert.equal(sql.filter(q=>/^\s*(UPDATE|INSERT|DELETE|DROP)/i.test(q)).length,0);
});
test('season query excludes quarantined results from public historical race listing',async()=>{
  const {db,sql}=dbSpy();
  const reply=await api(new Request('http://localhost/api/seasons?year=1998'),{DB:db},'test@wtw.local');
  assert.equal(reply.status,200);
  const body=await reply.json();
  assert.equal(body.year,1998);
  assert.ok(sql.some(x=>x.includes("r.year=? AND r.status NOT LIKE 'QUARANTINED%'")));
  assert.ok(sql.some(x=>x.includes("e.year=? AND e.status NOT LIKE 'QUARANTINED%'")));
  assert.equal(sql.filter(q=>/^\s*(UPDATE|INSERT|DELETE|DROP)/i.test(q)).length,0);
});
test('QA-pending activity evidence is only a site-view filter, not another race master',async()=>{
  const data=(await import('../data/history-audit/qa-pending-v384-inactive-edition-ids.json',{with:{type:'json'}})).default;
  assert.equal(data.counts.total_edition_ids,5370);
  assert.equal(data.counts.active,5147);
  assert.equal(data.counts.excluded,223);
  assert.equal(data.excluded.length,223);
  assert.equal(new Set(data.excluded.map(z=>z.edition_id)).size,223);
  assert.ok(data.excluded.every(z=>z.canon_status.startsWith('QUARANTINED')));
  assert.equal(data.authority.source_status,'V3.84_QA_PENDING');
});
