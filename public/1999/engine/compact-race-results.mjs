/**
 * WTW permanent race-result archive V1.
 *
 * Every starter, exact placing, purse payout, jockey and trainer is retained.
 * Display-only commentary and reconstructible profile data are omitted.
 * Race facts are immutable. Build month-sized compressed blocks for long games.
 */
export const RACE_ARCHIVE_SCHEMA='WTW_RACE_MONTH_V1';
const MAX_MONTH_RACES=20000;
const MAX_RUNNERS=24;
const MAX_ARCHIVE_JSON=64*1024*1024;
const surfaces=Object.freeze(['DIRT','TURF','SYNTHETIC','OTHER']);
const provenance=Object.freeze(['SIMULATED_1999_PLUS','SOURCE_VERIFIED']);
const encoder=new TextEncoder(),decoder=new TextDecoder();
async function archiveChecksum(bytes){
 if(globalThis.crypto?.subtle){
  const digest=new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes));
  return 'sha256-'+Array.from(digest,v=>v.toString(16).padStart(2,'0')).join('');
 }
 let value=2166136261;
 for(const b of bytes){value^=b;value=Math.imul(value,16777619)}
 return 'fnv32-'+(value>>>0).toString(16).padStart(8,'0');
}
function nonempty(value,key,max=100){
 const s=String(value||'');
 if(!s||s.length>max)throw Error('Invalid race '+key);
 return s;
}
function positiveInt(value,key,allowZero=false){
 if(!Number.isSafeInteger(value)||value<(allowZero?0:1))
  throw Error('Invalid race '+key);
 return value;
}
export function canonicalRaceResult(raw){
 if(!raw||typeof raw!=='object')throw Error('Race result required');
 const id=nonempty(raw.id,'id');
 const date=nonempty(raw.date,'date',10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z')))
  throw Error('Invalid race date');
 const trackId=nonempty(raw.trackId,'track');
 const surface=String(raw.surface||'DIRT').toUpperCase();
 if(!surfaces.includes(surface))throw Error('Unknown surface');
 const basis=String(raw.provenance||'SIMULATED_1999_PLUS');
 if(!provenance.includes(basis))throw Error('Unknown result authority');
 const starters=raw.starters;
 if(!Array.isArray(starters)||starters.length<2||starters.length>MAX_RUNNERS)
  throw Error('Race must have 2–24 recorded starters');
 const seen=new Set();
 const rows=starters.map(starter=>{
  const horseId=nonempty(starter.horseId,'horse ID');
  if(seen.has(horseId))throw Error('Duplicate horse in race '+id);
  seen.add(horseId);
  const finish=positiveInt(starter.finish,'finish');
  if(finish>starters.length)throw Error('Finish exceeds field size');
  return [horseId,nonempty(starter.jockeyId,'jockey ID'),
   nonempty(starter.trainerId,'trainer ID'),finish,
   positiveInt(starter.earningsCents??0,'earnings',true)];
 });
 if(!rows.some(x=>x[3]===1))throw Error('Race has no winner');
 const purseCents=positiveInt(raw.purseCents??0,'purse',true);
 if(rows.reduce((n,x)=>n+x[4],0)>purseCents)
  throw Error('Total distributed earnings exceed purse');
 const distanceYards=positiveInt(raw.distanceYards,'distance');
 const note=raw.note?String(raw.note).slice(0,240):'';
 return {id,date,trackId,surface,distanceYards,purseCents,
  conditionsId:String(raw.conditionsId||'').slice(0,100),
  provenance:basis,starters:rows,note};
}
function intern(map,values,item){
 let position=map.get(item);
 if(position===undefined){position=values.length;map.set(item,position);values.push(item)}
 return position;
}
/** Lossless, dictionary-indexed monthly block. No text repetition per starter. */
export function packRaceMonth(month,results){
 if(!/^\d{4}-(?:0[1-9]|1[0-2])$/.test(String(month||'')))
  throw Error('Invalid archive month');
 if(!Array.isArray(results)||results.length>MAX_MONTH_RACES)
  throw Error('Too many races in archive month');
 const tracks=[],horses=[],jockeys=[],trainers=[],conditions=[],ids=[];
 const lookup={track:new Map(),horse:new Map(),jockey:new Map(),trainer:new Map(),
  conditions:new Map(),race:new Map()};
 const races=[],starts=[],seen=new Set();
 for(const input of results){
  const race=canonicalRaceResult(input);
  if(race.date.slice(0,7)!==month)throw Error('Race outside target month');
  if(seen.has(race.id))throw Error('Duplicate race ID');
  seen.add(race.id);
  const startIndex=starts.length;
  for(const [horse,jockey,trainer,finish,cents] of race.starters){
   starts.push([intern(lookup.horse,horses,horse),intern(lookup.jockey,jockeys,jockey),
    intern(lookup.trainer,trainers,trainer),finish,cents]);
  }
  races.push([intern(lookup.race,ids,race.id),Number(race.date.slice(8,10)),
   intern(lookup.track,tracks,race.trackId),surfaces.indexOf(race.surface),
   race.distanceYards,race.purseCents,
   intern(lookup.conditions,conditions,race.conditionsId),
   provenance.indexOf(race.provenance),startIndex,starts.length-startIndex,race.note]);
 }
 return {schema:RACE_ARCHIVE_SCHEMA,month,ids,tracks,horses,jockeys,trainers,
  conditions,races,starts};
}
export function unpackRaceMonth(block){
 if(block?.schema!==RACE_ARCHIVE_SCHEMA||!Array.isArray(block.races)||
  !Array.isArray(block.starts))throw Error('Invalid WTW race archive');
 const result=[];
 for(const r of block.races){
  const [id,day,track,surface,distanceYards,purseCents,conditions,basis,start,n,note]=r;
  if(!Number.isInteger(start)||!Number.isInteger(n)||n<2||
   start<0||start+n>block.starts.length)throw Error('Corrupt runner offset');
  const record={id:block.ids[id],date:block.month+'-'+String(day).padStart(2,'0'),
   trackId:block.tracks[track],surface:surfaces[surface],distanceYards,purseCents,
   conditionsId:block.conditions[conditions],provenance:provenance[basis],
   starters:block.starts.slice(start,start+n).map(([h,j,t,place,money])=>({
    horseId:block.horses[h],jockeyId:block.jockeys[j],trainerId:block.trainers[t],
    finish:place,earningsCents:money
   })),note:note||''};
  // Revalidate untrusted archives before a historical replay.
  canonicalRaceResult(record);
  result.push(record);
 }
 return result;
}
export async function encodeRaceMonth(month,results){
 const packed=packRaceMonth(month,results),raw=encoder.encode(JSON.stringify(packed));
 if(raw.length>MAX_ARCHIVE_JSON)throw Error('Race-month archive exceeds 64 MB budget');
 let encoding='json',bytes=raw;
 if(typeof CompressionStream==='function'&&typeof Response==='function'){
  const gz=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(
   new CompressionStream('gzip'))).arrayBuffer());
  if(gz.length<raw.length){encoding='gzip';bytes=gz}
 }
 return {metadata:{schema:RACE_ARCHIVE_SCHEMA,month,checksum:await archiveChecksum(bytes),races:packed.races.length,
  starters:packed.starts.length,encoding,bytes:bytes.length,rawBytes:raw.length},
  bytes};
}
export async function decodeRaceMonth(archive){
 if(archive?.metadata?.schema!==RACE_ARCHIVE_SCHEMA)throw Error('Not a race-month archive');
 const payload=archive.bytes instanceof Uint8Array?archive.bytes:new Uint8Array(archive.bytes);
 if(payload.length!==archive.metadata.bytes||payload.length>MAX_ARCHIVE_JSON)
  throw Error('Corrupt or oversized race archive');
 if(await archiveChecksum(payload)!==archive.metadata.checksum)
  throw Error('Race archive checksum mismatch');
 let raw=payload;
 if(archive.metadata.encoding==='gzip'){
  if(typeof DecompressionStream!=='function')throw Error('Cannot decompress race archive');
  raw=new Uint8Array(await new Response(new Blob([payload]).stream().pipeThrough(
   new DecompressionStream('gzip'))).arrayBuffer());
 }else if(archive.metadata.encoding!=='json')throw Error('Unknown archive encoding');
 if(raw.length>MAX_ARCHIVE_JSON)throw Error('Decoded race archive exceeds safe limit');
 let block;try{block=JSON.parse(decoder.decode(raw))}catch{throw Error('Invalid race archive JSON')}
 const rows=unpackRaceMonth(block);
 if(rows.length!==archive.metadata.races||block.month!==archive.metadata.month||
  rows.reduce((n,x)=>n+x.starters.length,0)!==archive.metadata.starters)
  throw Error('Race archive metadata mismatch');
 return rows;
}
