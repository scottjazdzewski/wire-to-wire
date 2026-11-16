'use strict';

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const STORE_SCHEMA='WTW_DESKTOP_CAREER_SLOT_V1';
const MAGIC=Buffer.from('WTWCAR1\n','ascii');
const MAX_SAVE_BYTES=64*1024*1024;
const MAX_SLOTS=60,MAX_TOTAL_BYTES=512*1024*1024;
const safeID=id=>typeof id==='string'&&/^career-[A-Za-z0-9-]{8,80}$/.test(id);

function bytesOf(value){
 if(value instanceof Uint8Array)return Buffer.from(value.buffer,value.byteOffset,value.byteLength);
 if(value instanceof ArrayBuffer)return Buffer.from(value);
 if(ArrayBuffer.isView(value))return Buffer.from(value.buffer,value.byteOffset,value.byteLength);
 throw Error('Career save payload is not binary data');
}

function decodeRecord(id,encoded){
 if(encoded.length<MAGIC.length+4||!encoded.subarray(0,MAGIC.length).equals(MAGIC))
  throw Error('Desktop career file has an invalid header');
 const headerLength=encoded.readUInt32LE(MAGIC.length);
 const payloadOffset=MAGIC.length+4+headerLength;
 if(headerLength<2||headerLength>32768||payloadOffset>encoded.length)
  throw Error('Desktop career file header is invalid');
 let value;
 try{value=JSON.parse(encoded.toString('utf8',MAGIC.length+4,payloadOffset))}
 catch{throw Error('Desktop career metadata is unreadable')}
 if(!value||value.schema!==STORE_SCHEMA||value.meta?.id!==id||
  typeof value.meta?.name!=='string'||!value.meta.name.trim()||value.meta.name.length>80||
  typeof value.meta.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value.meta.date)||
  !value.header||typeof value.header!=='object')
  throw Error('Desktop career record is incomplete or unsupported');
 const bytes=encoded.subarray(payloadOffset);
 if(!bytes.length||bytes.length>MAX_SAVE_BYTES||value.header.size!==bytes.length||
  value.meta.bytes!==bytes.length)
  throw Error('Desktop career payload failed its size check');
 return {meta:value.meta,header:value.header,bytes:new Uint8Array(bytes)};
}

function createCareerStore(directory){
 const root=path.resolve(directory);
 const filename=id=>path.join(root,id+'.wtwcareer');
 const backup=id=>filename(id)+'.bak';
 function ensureRoot(){fs.mkdirSync(root,{recursive:true})}
 function recoverInterruptedWrite(id){
  const target=filename(id),prior=backup(id);
  if(!fs.existsSync(target)&&fs.existsSync(prior))fs.renameSync(prior,target);
 }
 function read(id){
  if(!safeID(id))throw Error('Invalid career ID');
  recoverInterruptedWrite(id);
  const target=filename(id);
  if(!fs.existsSync(target))return null;
  let encoded;
  try{encoded=fs.readFileSync(target)}
  catch{throw Error('Career file is unreadable; the saved career was not changed')}
  return decodeRecord(id,encoded);
 }
 function list(){
  ensureRoot();
  const names=fs.readdirSync(root);
  for(const name of names){
   if(!name.endsWith('.wtwcareer.bak'))continue;
   const id=name.slice(0,-'.wtwcareer.bak'.length);
   if(safeID(id))recoverInterruptedWrite(id);
  }
  return fs.readdirSync(root).filter(name=>name.endsWith('.wtwcareer'))
   .map(name=>{
    const id=name.slice(0,-'.wtwcareer'.length),record=read(id);
    if(!record)throw Error('Career file disappeared while listing saves');
    return record.meta;
   }).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
 }
 function get(id){
  const record=read(id);
  if(!record)throw Error('Saved career is unavailable');
  return record;
 }
 function put(meta,record){
  if(!meta||!safeID(meta.id)||typeof meta.name!=='string'||!meta.name.trim()||
   meta.name.length>80||typeof meta.date!=='string'||
   !/^\d{4}-\d{2}-\d{2}$/.test(meta.date))throw Error('Invalid career metadata');
  if(!record?.header||typeof record.header!=='object')throw Error('Career save header missing');
  const bytes=bytesOf(record.bytes);
  if(!bytes.length||bytes.length>MAX_SAVE_BYTES||record.header.size!==bytes.length||
   meta.bytes!==bytes.length)
   throw Error('Career save payload exceeds the supported size or is incomplete');
  ensureRoot();
  const slots=list(),existing=slots.find(slot=>slot.id===meta.id);
  if(!existing&&slots.length>=MAX_SLOTS)throw Error('60 career slots is the maximum');
  const otherBytes=slots.reduce((sum,slot)=>sum+(slot.id===meta.id?0:Number(slot.bytes||0)),0);
  if(otherBytes+bytes.byteLength>MAX_TOTAL_BYTES)
   throw Error('Local careers would exceed the 512 MB safety budget');
  const header=Buffer.from(JSON.stringify({schema:STORE_SCHEMA,meta,header:record.header}),'utf8');
  if(header.length>32768)throw Error('Career metadata header is too large');
  const length=Buffer.alloc(4);length.writeUInt32LE(header.length,0);
  const encoded=Buffer.concat([MAGIC,length,header,bytes]);
  const target=filename(meta.id),prior=backup(meta.id);
  const temporary=path.join(root,'.'+meta.id+'.'+process.pid+'.'+crypto.randomUUID()+'.tmp');
  let fd;
  try{
   fd=fs.openSync(temporary,'wx',0o600);
   fs.writeFileSync(fd,encoded);
   fs.fsyncSync(fd);
   fs.closeSync(fd);fd=null;
   if(fs.existsSync(target)){
    if(fs.existsSync(prior))fs.unlinkSync(prior);
    fs.renameSync(target,prior);
   }
   fs.renameSync(temporary,target);
   return meta;
  }catch(error){
   if(fd!==null&&fd!==undefined)try{fs.closeSync(fd)}catch{}
   if(!fs.existsSync(target)&&fs.existsSync(prior))try{fs.renameSync(prior,target)}catch{}
   try{if(fs.existsSync(temporary))fs.unlinkSync(temporary)}catch{}
   throw Error('Career save was not committed: '+String(error.message||error));
  }
 }
 function remove(id){
  if(!safeID(id))throw Error('Invalid career ID');
  ensureRoot();
  for(const candidate of [filename(id),backup(id)])
   if(fs.existsSync(candidate))fs.unlinkSync(candidate);
  return true;
 }
 return Object.freeze({list,get,put,remove,directory:root});
}

module.exports={STORE_SCHEMA,createCareerStore};
