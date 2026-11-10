import test from 'node:test';
import assert from 'node:assert/strict';
import {api} from '../src/worker.js';

test('full historical bootstrap serializes D1 requests and exposes every available season',async()=>{
  let active=0,maxActive=0,calls=0;
  const db={prepare(sql){
    return {
      async first(){
        active++;maxActive=Math.max(active,maxActive);calls++;
        await Promise.resolve();
        active--;
        const name=/FROM (\w+)/.exec(sql)?.[1]||'unknown';
        const count={entities:5101,races:5370,connections:20884,results:15561,change_requests:0}[name]||0;
        return {n:count};
      },
      async all(){
        active++;maxActive=Math.max(active,maxActive);calls++;
        await Promise.resolve();
        active--;
        if(sql.includes('SELECT DISTINCT year FROM races'))return {results:[{year:1864},{year:1953},{year:1998}]};
        if(sql.includes('SELECT r.id,COALESCE(n.name'))return {results:[{id:'E-1998-1',year:1998,name:'Historic Stakes',track_name:'Example',status:'SOURCE_SNAPSHOT'}]};
        return {results:[]};
      }
    };
  }};
  const r=await api(new Request('https://wire-to-wire.pages.dev/api/bootstrap'),{DB:db},'owner@example.invalid');
  assert.equal(r.status,200);
  const data=await r.json();
  assert.equal(maxActive,1,'D1 connections should be serialized');
  assert.equal(calls,12);
  assert.equal(data.mode,'D1_CONNECTED');
  assert.deepEqual(data.years,[1864,1953,1998]);
  assert.equal(data.counts.races,1,'visible count comes from returned rows, not stale D1 count');
  assert.equal(data.historySource.result_delta_status,'NOT_RECONCILED_NOT_PROMOTED');
});
