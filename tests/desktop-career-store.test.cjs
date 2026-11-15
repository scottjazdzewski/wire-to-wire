'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createCareerStore,STORE_SCHEMA}=require('../desktop/career-store.cjs');

function fixture(){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'wtw-career-store-'));
 const store=createCareerStore(directory);
 const id='career-12345678-abcd';
 const meta={id,name:'Test career',date:'1999-01-01',createdAt:'2026-11-14',
  updatedAt:'2026-11-14',profile:{seed:19990101},bytes:4};
 const record={header:{schema:'WTW_COMPACT_CAREER_V1',size:4,checksum:'test'},
  bytes:new Uint8Array([1,2,3,4])};
 return {directory,store,id,meta,record};
}

test('desktop career store round-trips metadata and binary payload',()=>{
 const f=fixture();
 try{
  assert.deepEqual(f.store.list(),[]);
  f.store.put(f.meta,f.record);
  assert.deepEqual(f.store.list(),[f.meta]);
  const loaded=f.store.get(f.id);
  assert.deepEqual(loaded.meta,f.meta);
  assert.deepEqual(loaded.header,f.record.header);
  assert.deepEqual([...loaded.bytes],[1,2,3,4]);
  const saved=fs.readFileSync(path.join(f.directory,f.id+'.wtwcareer'));
  assert.equal(saved.subarray(0,8).toString('ascii'),'WTWCAR1\n');
  assert.equal(saved.includes(Buffer.from(STORE_SCHEMA)),true);
 }finally{fs.rmSync(f.directory,{recursive:true,force:true})}
});

test('interrupted replacement recovers the last complete career file',()=>{
 const f=fixture();
 try{
  f.store.put(f.meta,f.record);
  const active=path.join(f.directory,f.id+'.wtwcareer');
  fs.renameSync(active,active+'.bak');
  const loaded=f.store.get(f.id);
  assert.deepEqual([...loaded.bytes],[1,2,3,4]);
  assert.equal(fs.existsSync(active),true);
  assert.equal(fs.existsSync(active+'.bak'),false);
 }finally{fs.rmSync(f.directory,{recursive:true,force:true})}
});

test('invalid IDs and incomplete payloads fail without writing',()=>{
 const f=fixture();
 try{
  assert.throws(()=>f.store.get('../escape'),/Invalid career ID/);
  assert.throws(()=>f.store.put(f.meta,{header:{size:4},bytes:new Uint8Array([1])}),
   /size or is incomplete/);
  assert.deepEqual(f.store.list(),[]);
 }finally{fs.rmSync(f.directory,{recursive:true,force:true})}
});

test('explicit delete removes active save and its recovery copy',()=>{
 const f=fixture();
 try{
  f.store.put(f.meta,f.record);
  f.store.put({...f.meta,date:'1999-01-02'},f.record);
  f.store.remove(f.id);
  assert.deepEqual(f.store.list(),[]);
  assert.throws(()=>f.store.get(f.id),/unavailable/);
 }finally{fs.rmSync(f.directory,{recursive:true,force:true})}
});

test('desktop store enforces the same 60-slot safety limit as the career manager',()=>{
 const f=fixture();
 try{
  for(let i=0;i<60;i++){
   const suffix=String(i).padStart(8,'0');
   f.store.put({...f.meta,id:'career-'+suffix},f.record);
  }
  assert.equal(f.store.list().length,60);
  assert.throws(()=>f.store.put({...f.meta,id:'career-99999999'},f.record),/60 career slots/);
 }finally{fs.rmSync(f.directory,{recursive:true,force:true})}
});
