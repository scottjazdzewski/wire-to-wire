import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync(new URL('../data/sample-history.json',import.meta.url)));
const index=new Map(data.entities.map(x=>[x.id,x]));
const races=new Map(data.races.map(x=>[x.id,x]));
test('sample data has distinct permanent IDs',()=>{
  assert.equal(index.size,data.entities.length);
  assert.equal(races.size,data.races.length);
});
test('every year-level relationship refers to imported entities',()=>{
  for(const c of data.connections){assert.ok(index.has(c.horse_id),c.id);assert.ok(index.has(c.party_id),c.id);}
});
test('every race result refers to a real horse and edition',()=>{
  for(const r of data.results){assert.ok(index.has(r.horse_id));assert.ok(races.has(r.edition_id));}
});
test('approved 1953 names and protected winners remain',()=>{
  const winners=new Map(data.results.filter(x=>x.position===1).map(x=>[x.edition_id,x.horse_id]));
  assert.equal(index.get(winners.get('HSE-1953-0001')).name,'Double Duty');
  assert.equal(index.get(winners.get('HSE-1953-0002')).name,'Double Duty');
  assert.equal(index.get(winners.get('HSE-1953-0003')).name,'Northbound Train');
  assert.equal(index.get(winners.get('HSE-1953-0021')).name,'Miss Meridian');
  assert.equal(index.get(winners.get('HSE-1953-0027')).name,'Bramble');
});
test('sample is labeled and does not imply full WTW coverage',()=>{
  assert.match(data.meta.scope,/sample/i);
  assert.match(data.meta.mode,/DEMO/i);
});