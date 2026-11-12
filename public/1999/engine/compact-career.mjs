/**
 * Wire to Wire compact, deterministic single-player career saves.
 * No horse-population snapshots: save a frozen world seed/profile + changed
 * game state. Gzip is optional for browser compatibility; checksum mandatory.
 * The binary .wtwsave format is versioned and portable.
 */
export const COMPACT_CAREER_SCHEMA='WTW_COMPACT_CAREER_V1';
export const COMPACT_CAREER_MAX_BYTES=64*1024*1024;
const MAGIC=new Uint8Array([87,84,87,83,65,86,49,10]); // WTWSAV1\n
const encoder=new TextEncoder(),decoder=new TextDecoder();
const DELETE=Object.freeze({$wtw:'DELETE_FROM_BASELINE'});
const NO_CHANGE=Symbol('unchanged');
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
function plain(value){return value===undefined?undefined:JSON.parse(JSON.stringify(value))}
function diff(base,next){
 if(Object.is(base,next))return NO_CHANGE;
 if(Array.isArray(base)||Array.isArray(next))return plain(next);
 if(!object(base)||!object(next))return plain(next);
 const change={};
 for(const key of new Set([...Object.keys(base),...Object.keys(next)])){
  if(!Object.hasOwn(next,key)){change[key]=DELETE;continue}
  const delta=diff(base[key],next[key]);
  if(delta!==NO_CHANGE)change[key]=delta;
 }
 return Object.keys(change).length?change:NO_CHANGE;
}
function patch(base,delta){
 if(delta===undefined)return plain(base);
 if(object(delta)&&delta.$wtw==='DELETE_FROM_BASELINE'&&Object.keys(delta).length===1)
  return undefined;
 if(!object(delta)||!object(base))return plain(delta);
 const value=plain(base);
 for(const [key,change] of Object.entries(delta)){
  if(object(change)&&change.$wtw==='DELETE_FROM_BASELINE'&&Object.keys(change).length===1)
   delete value[key];
  else value[key]=patch(value[key],change);
 }
 return value;
}
function assertProfile(profile){
 if(!profile||profile.schema!=='WTW_WORLD_PROFILE_V1')throw Error('Invalid world profile');
 if(!Number.isSafeInteger(profile.population)||profile.population<10000||profile.population>325000)
  throw Error('Invalid saved world population');
 if(!Number.isSafeInteger(profile.seed)||profile.seed<1||profile.seed>4294967295)
  throw Error('Invalid saved world seed');
 if(!['CANON_ANCHORED_TEST','FULLY_FICTIONAL_TEST'].includes(profile.mode))
  throw Error('Unknown saved world mode');
}
function assertGame(game){
 if(!object(game)||!object(game.worldAnchor)||typeof game.date!=='string'||
  !/^\d{4}-\d{2}-\d{2}$/.test(game.date)||game.date<'1999-01-01')
  throw Error('Not a valid January 1999 career');
 if(game.worldAnchor.startDate!=='1999-01-01'||game.worldAnchor.schema!=='WTW_1999_CLEAN_CAREER_V3')
  throw Error('Unsupported game-state authority');
}
export function createCareerDelta(game,baseline,profile){
 assertProfile(profile);assertGame(game);assertGame(baseline);
 if(game.worldAnchor.seed!==profile.seed||game.worldAnchor.mode!==profile.mode)
  throw Error('Game world seed/mode does not match its save profile');
 const changes=diff(baseline,game);
 return {schema:COMPACT_CAREER_SCHEMA,gameSchema:game.worldAnchor.schema,
  world:plain(profile),date:game.date,
  delta:changes===NO_CHANGE?{}:changes};
}
export function recoverCareerDelta(record,baseline){
 if(record?.schema!==COMPACT_CAREER_SCHEMA)throw Error('Not a compact WTW career');
 assertProfile(record.world);assertGame(baseline);
 const out=patch(baseline,record.delta);
 assertGame(out);
 if(out.worldAnchor.seed!==record.world.seed||out.worldAnchor.mode!==record.world.mode||
  out.date!==record.date)
  throw Error('Compact save fails world or date integrity check');
 return out;
}
function fnv32(bytes){
 let h=2166136261;
 for(const b of bytes){h^=b;h=Math.imul(h,16777619)}
 return 'fnv32-'+(h>>>0).toString(16).padStart(8,'0');
}
async function checksum(bytes){
 if(globalThis.crypto?.subtle){
  const digest=new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes));
  return 'sha256-'+Array.from(digest,v=>v.toString(16).padStart(2,'0')).join('');
 }
 return fnv32(bytes);
}
async function compress(bytes){
 if(typeof CompressionStream!=='function'||typeof Response!=='function')
  return {encoding:'json',bytes};
 const encoded=await new Response(new Blob([bytes]).stream().pipeThrough(
  new CompressionStream('gzip'))).arrayBuffer();
 const result=new Uint8Array(encoded);
 return result.length<bytes.length?{encoding:'gzip',bytes:result}:{encoding:'json',bytes};
}
async function decompress(bytes,encoding){
 if(encoding==='json')return bytes;
 if(encoding!=='gzip'||typeof DecompressionStream!=='function')
  throw Error('This browser cannot decompress the saved career');
 const decoded=await new Response(new Blob([bytes]).stream().pipeThrough(
  new DecompressionStream('gzip'))).arrayBuffer();
 if(decoded.byteLength>COMPACT_CAREER_MAX_BYTES)
  throw Error('Decompressed save exceeds safe limit');
 return new Uint8Array(decoded);
}
export async function encodeCareerSave(game,baseline,profile){
 const payload=createCareerDelta(game,baseline,profile);
 const raw=encoder.encode(JSON.stringify(payload));
 if(raw.byteLength>COMPACT_CAREER_MAX_BYTES)throw Error('Career exceeds 64 MiB save limit');
 const compressed=await compress(raw);
 const digest=await checksum(compressed.bytes);
 return {header:{schema:COMPACT_CAREER_SCHEMA,encoding:compressed.encoding,
   checksum:digest,size:compressed.bytes.byteLength,
   rawSize:raw.byteLength,world:plain(profile),date:game.date},
  bytes:compressed.bytes};
}
export async function decodeCareerSave(record,baseline){
 const {header,bytes}=record||{};
 if(header?.schema!==COMPACT_CAREER_SCHEMA||!bytes)throw Error('Invalid WTW save format');
 const buffer=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
 if(buffer.byteLength!==header.size||buffer.byteLength>COMPACT_CAREER_MAX_BYTES)
  throw Error('WTW save is missing data or exceeds file limit');
 const digest=await checksum(buffer);
 if(digest!==header.checksum)throw Error('Career checksum mismatch; save is damaged');
 const raw=await decompress(buffer,header.encoding);
 if(raw.byteLength>COMPACT_CAREER_MAX_BYTES)throw Error('Save exceeds decoded limit');
 let payload;try{payload=JSON.parse(decoder.decode(raw))}catch{throw Error('Invalid saved career payload')}
 if(payload.world?.population!==header.world?.population||
  payload.world?.seed!==header.world?.seed||payload.world?.mode!==header.world?.mode||
  payload.date!==header.date)throw Error('Save metadata does not match career');
 return recoverCareerDelta(payload,baseline);
}
export function packCareerFile(record){
 const headerBytes=encoder.encode(JSON.stringify(record.header));
 if(headerBytes.length>32768)throw Error('Save header too long');
 const body=record.bytes instanceof Uint8Array?record.bytes:new Uint8Array(record.bytes);
 const result=new Uint8Array(MAGIC.length+4+headerBytes.length+body.length);
 result.set(MAGIC,0);
 new DataView(result.buffer).setUint32(MAGIC.length,headerBytes.length,true);
 result.set(headerBytes,MAGIC.length+4);
 result.set(body,MAGIC.length+4+headerBytes.length);
 return result;
}
export function unpackCareerFile(data){
 const bytes=data instanceof Uint8Array?data:new Uint8Array(data);
 if(bytes.length>COMPACT_CAREER_MAX_BYTES+32780||bytes.length<MAGIC.length+4)
  throw Error('Invalid or oversized WTW save file');
 for(let i=0;i<MAGIC.length;i++)if(bytes[i]!==MAGIC[i])
  throw Error('Not a .wtwsave career file');
 const size=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength)
  .getUint32(MAGIC.length,true);
 if(size>32768||size+MAGIC.length+4>bytes.length)throw Error('Invalid WTW file header');
 let header;try{header=JSON.parse(decoder.decode(bytes.subarray(MAGIC.length+4,MAGIC.length+4+size)))}
 catch{throw Error('Corrupt WTW file header')}
 return {header,bytes:bytes.subarray(MAGIC.length+4+size)};
}
export const compactCareerTools=Object.freeze({createCareerDelta,recoverCareerDelta,
 encodeCareerSave,decodeCareerSave,packCareerFile,unpackCareerFile});
