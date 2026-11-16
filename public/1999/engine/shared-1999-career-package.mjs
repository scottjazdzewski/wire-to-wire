/** Portable checkpoint for one deterministic full-world 1999 test career. */
export const SHARED_1999_CAREER_PACKAGE_SCHEMA='WTW_SHARED_1999_CAREER_V1';
const utf8=new TextEncoder(),text=new TextDecoder();
const MAX_BYTES=64*1024*1024;
function canonicalJsonValue(value){
 if(Array.isArray(value))return value.map(canonicalJsonValue);
 if(value&&Object.getPrototypeOf(value)===Object.prototype){
  const sorted={};
  for(const key of Object.keys(value).sort())sorted[key]=canonicalJsonValue(value[key]);
  return sorted;
 }
 return value;
}
/** Compare a re-opened IndexedDB manifest with its JSON checkpoint form.
 * Structured clone can change object key insertion order; that is not a
 * world change. Array order and every JSON value still have to match. */
export function sameShared1999WorldManifest(a,b){
 return JSON.stringify(canonicalJsonValue(a))===JSON.stringify(canonicalJsonValue(b));
}
async function sha256(bytes){
 if(!globalThis.crypto?.subtle)throw Error('Web Crypto is required for career checkpoint integrity');
 const hash=new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes));
 return [...hash].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function assertInputs(manifest,careerRecord){
 if(manifest?.schema!=='WTW_PERSISTENT_INDUSTRY_1999_V1'||manifest.status!=='COMPLETE'||
  !Number.isSafeInteger(manifest.seed)||typeof manifest.worldId!=='string'||
  !Number.isSafeInteger(manifest.horseCount)||!Number.isSafeInteger(manifest.personCount)||
  !Number.isSafeInteger(manifest.targetOpeningHorses)||
  careerRecord?.schema!=='WTW_INDUSTRY_CAREER_RUN_V1'||
  careerRecord.worldId!==manifest.worldId||careerRecord.worldSeed!==manifest.seed||
  careerRecord.worldSchema!==manifest.schema||
  typeof careerRecord.runId!=='string'||!careerRecord.runId||
  !careerRecord.changes?.canonicalRun)
  throw Error('Full-world career checkpoint is missing its completed world or career record');
 const run=careerRecord.changes.canonicalRun;
 if(run.run_id!==careerRecord.runId||run.clock?.date!==careerRecord.gameDate||
  JSON.stringify(run.player)!==JSON.stringify(careerRecord.player))
  throw Error('Full-world career checkpoint run metadata does not match its saved state');
}
/**
 * Store the frozen manifest and exact canonical career run. The world rows are
 * recreated from this manifest's seed/revisions and verified by snapshot hash
 * at import, keeping the portable file small without weakening identity.
 */
export async function packShared1999Career({manifest,snapshotSha256,careerRecord}={}){
 assertInputs(manifest,careerRecord);
 if(!/^[a-f0-9]{64}$/.test(snapshotSha256||''))
  throw Error('Full-world career checkpoint requires a SHA-256 world snapshot');
 const payload={schema:SHARED_1999_CAREER_PACKAGE_SCHEMA,
  world:{worldId:manifest.worldId,seed:manifest.seed,
   targetOpeningHorses:manifest.targetOpeningHorses,
   horseCount:manifest.horseCount,personCount:manifest.personCount,
   manifest,snapshotSha256},careerRecord};
 const raw=utf8.encode(JSON.stringify(payload));
 if(raw.byteLength>MAX_BYTES)throw Error('Shared career checkpoint exceeds 64 MiB');
 const envelope={schema:SHARED_1999_CAREER_PACKAGE_SCHEMA,
  checksum:await sha256(raw),payload};
 return utf8.encode(JSON.stringify(envelope));
}
export async function unpackShared1999Career(input){
 const bytes=input instanceof Uint8Array?input:new Uint8Array(input);
 if(bytes.byteLength>MAX_BYTES||!bytes.byteLength)
  throw Error('Shared career checkpoint is empty or exceeds 64 MiB');
 let envelope;
 try{envelope=JSON.parse(text.decode(bytes))}
 catch{throw Error('Shared career checkpoint is not valid JSON')}
 if(envelope?.schema!==SHARED_1999_CAREER_PACKAGE_SCHEMA||
  envelope.payload?.schema!==SHARED_1999_CAREER_PACKAGE_SCHEMA)
  throw Error('Unsupported shared full-world career checkpoint');
 const expected=await sha256(utf8.encode(JSON.stringify(envelope.payload)));
 if(envelope.checksum!==expected)throw Error('Shared career checkpoint checksum mismatch');
 const {world,careerRecord}=envelope.payload;
 assertInputs(world?.manifest,careerRecord);
 const manifest=world.manifest;
 if(world.worldId!==manifest.worldId||world.seed!==manifest.seed||
  world.targetOpeningHorses!==manifest.targetOpeningHorses||
  world.horseCount!==manifest.horseCount||world.personCount!==manifest.personCount||
  !/^[a-f0-9]{64}$/.test(world.snapshotSha256||''))
  throw Error('Shared career checkpoint world identity is inconsistent');
 return envelope.payload;
}
