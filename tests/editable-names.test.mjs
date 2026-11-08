import test from 'node:test';
import assert from 'node:assert/strict';
import {validDisplayName, api} from '../src/worker.js';

test('name editor accepts historical names and rejects empty, oversized or control-character values', () => {
  assert.equal(validDisplayName('Double Duty'),true);
  assert.equal(validDisplayName('  Éclair de Lune  '),true);
  assert.equal(validDisplayName(''),false);
  assert.equal(validDisplayName(' '.repeat(7)),false);
  assert.equal(validDisplayName('x'.repeat(221)),false);
  assert.equal(validDisplayName('bad\nname'),false);
  assert.equal(validDisplayName('bad\rname'),false);
});

test('name edits are recorded in WTW overlay + audit, never UPDATE source tables', async()=>{
  const statements=[];
  const db={
    prepare(sql){
      const stmt={sql,values:[],
        bind(...values){this.values=values;return this;},
        async first(){
          if(sql.includes('SELECT e.name AS source_name')) return {source_name:'Double Duty',display_name:'Double Duty'};
          return null;
        }
      };
      return stmt;
    },
    async batch(commands){statements.push(...commands);return commands.map(()=>({success:true}));}
  };
  const request=new Request('https://wire-to-wire.pages.dev/api/names',{
    method:'POST',headers:{'Content-Type':'application/json','Origin':'https://wire-to-wire.pages.dev'},
    body:JSON.stringify({target_type:'entity',target_id:'H-1950-008016',name:'Double Duty II',expected_name:'Double Duty'})
  });
  const response=await api(request,{DB:db},'owner@example.invalid');
  assert.equal(response.status,200);
  const data=await response.json();
  assert.equal(data.name,'Double Duty II');
  assert.equal(data.source_unchanged,true);
  assert.equal(statements.length,2);
  assert.match(statements[0].sql,/INSERT INTO display_name_overrides/);
  assert.match(statements[1].sql,/INSERT INTO name_edit_audit/);
  assert.ok(statements.every(s=>!s.sql.includes('UPDATE entities')&&!s.sql.includes('UPDATE races')));
  assert.deepEqual(statements[0].values.slice(0,4),['entity','H-1950-008016','Double Duty II','Double Duty']);
});

test('name editor rejects cross-origin writes',async()=>{
  const request=new Request('https://wire-to-wire.pages.dev/api/names',{
    method:'POST',headers:{'Content-Type':'application/json','Origin':'https://attacker.example'},
    body:JSON.stringify({target_type:'entity',target_id:'H-1950-008016',name:'Other',expected_name:'Double Duty'})
  });
  const response=await api(request,{DB:{}},'owner@example.invalid');
  assert.equal(response.status,403);
});
