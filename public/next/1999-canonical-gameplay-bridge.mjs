/**
 * Wire to Wire: WEBSITE-OWNED, transport-neutral gameplay projection bridge.
 *
 * This is a proposed UI-side V1 boundary, NOT the game engine or live binding.
 * It never runs AI, advances a clock, posts money, mutates canonical records,
 * creates a save, or writes to localStorage. The Drive game-engine owner must
 * implement and approve a matching projection/command transport before mount.
 */
export const UI_PROJECTION_SCHEMA='WTW_1999_PLAYER_PROJECTION_V1';
export const UI_COMMAND_SCHEMA='WTW_1999_PLAYER_COMMAND_V1';
export const UI_RECEIPT_SCHEMA='WTW_1999_PLAYER_RECEIPT_V1';
export const UI_WORLD_KINDS=Object.freeze(['FICTIONAL_ENGINE_SANDBOX','HISTORY_INTEGRATED']);
const ACCEPTED=new Set(['APPLIED','ALREADY_APPLIED','REJECTED']);
const ID=/^[A-Za-z0-9][A-Za-z0-9:_-]{1,159}$/;
const SHA=/^[a-f\d]{64}$/i;
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function ensure(ok,msg){if(!ok)throw new TypeError('WTW UI gameplay contract: '+msg)}
function text(x,label){ensure(typeof x==='string'&&x.length<=180&&x.trim()===x&&x.length>0,label+' must be a nonempty string');return x}
function id(x,label){text(x,label);ensure(ID.test(x),label+' is not an approved opaque ID');return x}
function date(x,label){
 text(x,label);
 ensure(/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+'T00:00:00.000Z'))&&
  new Date(x+'T00:00:00.000Z').toISOString().slice(0,10)===x&&x>='1999-01-01',
  label+' is not a valid game date');return x;
}
function safeString(value){return typeof value==='string'?value:''}
function optionalId(value,label){return value===null||value===undefined?'':id(value,label)}
function nonneg(value,label){ensure(Number.isSafeInteger(value)&&value>=0,label+' must be a nonnegative integer');return value}
function money(value,label){ensure(Number.isSafeInteger(value),label+' must be an integer amount of minor currency units');return value}
function optionalScore(value,label){if(value===null||value===undefined)return null;ensure(Number.isFinite(value)&&value>=0&&value<=1,label+' must be normalized from 0 to 1');return value}
function stableIds(rows,label){
 ensure(Array.isArray(rows),label+' must be an array');
 const out=new Set();
 for(const row of rows){ensure(isObj(row),label+' has invalid item');id(row.id,label+' id');ensure(!out.has(row.id),label+' has duplicate ID '+row.id);out.add(row.id)}
 return out;
}
function cloneSafe(x){
 return JSON.parse(JSON.stringify(x));
}
function deepFreeze(obj){
 if(!obj||typeof obj!=='object'||Object.isFrozen(obj))return obj;
 Object.freeze(obj);
 for(const child of Object.values(obj))deepFreeze(child);
 return obj;
}
function sessionKey(p){
 return [p.world.kind,p.world.snapshotId,p.engine.release,p.engine.sha256,p.session.id].join('|');
}
function validateBasics(p){
 ensure(isObj(p)&&p.schema===UI_PROJECTION_SCHEMA,'unknown projection version');
 ensure(isObj(p.engine),'missing engine manifest');
 text(p.engine.release,'engine.release');
 ensure(typeof p.engine.sha256==='string'&&SHA.test(p.engine.sha256),'engine release SHA-256 missing');
 ensure(isObj(p.world)&&UI_WORLD_KINDS.includes(p.world.kind),'missing explicit sandbox/integrated distinction');
 id(p.world.snapshotId,'world.snapshotId');
 if(p.world.kind==='HISTORY_INTEGRATED')id(p.world.canonicalSourceSnapshotId,'world.canonicalSourceSnapshotId');
 ensure(isObj(p.session),'missing session');
 id(p.session.id,'session.id');date(p.session.date,'session.date');
 nonneg(p.session.revision,'session.revision');
 ensure(typeof p.session.journalHash==='string'&&SHA.test(p.session.journalHash),'journal hash missing');
 ensure(isObj(p.player),'missing player');
 id(p.player.personId,'player.personId');text(p.player.role,'player.role');
 optionalId(p.player.organizationId,'player.organizationId');
 ensure(p.player.visibility==='PLAYER_SAFE','projection must be labeled PLAYER_SAFE');
 stableIds(p.horses,'horses');stableIds(p.races,'races');stableIds(p.entries,'entries');
 ensure(Array.isArray(p.results),'missing results array');
 ensure(isObj(p.finances)&&p.finances.currency==='USD','finances require explicit USD');
 money(p.finances.postedBalanceMinor,'finances.postedBalanceMinor');
 ensure(Array.isArray(p.finances.postedTransactions),'missing posted transaction list');
 ensure(Array.isArray(p.permissions),'missing engine-evaluated permissions');
 for(const permission of p.permissions){
  ensure(isObj(permission),'invalid permission');
  text(permission.action,'permission.action');
  optionalId(permission.targetId,'permission.targetId');
  ensure(typeof permission.allowed==='boolean','permission requires boolean allowed');
 }
 for(const row of p.horses){
  text(row.name,'horse.name');
  optionalId(row.ownerId,'horse.ownerId');optionalId(row.trainerId,'horse.trainerId');
  optionalId(row.trackId,'horse.trackId');
  if(row.condition!==undefined){
   ensure(isObj(row.condition),'horse.condition must be an observed/display projection');
   optionalScore(row.condition.fitness,'horse.condition.fitness');
   optionalScore(row.condition.fatigue,'horse.condition.fatigue');
   optionalScore(row.condition.readiness,'horse.condition.readiness');
  }
 }
 for(const race of p.races){
  optionalId(race.trackId,'race.trackId');date(race.date,'race.date');
  ensure(['CONDITION_BOOK','NOMINATIONS_OPEN','OVERNIGHT_DRAWN','OFFICIAL',
   'COMPLETED','CANCELLED'].includes(race.status),'race has unknown engine state');
 }
 const horseIds=new Set(p.horses.map(x=>x.id)),raceIds=new Set(p.races.map(x=>x.id));
 for(const entry of p.entries){
  id(entry.horseId,'entry.horseId');id(entry.raceId,'entry.raceId');
  ensure(raceIds.has(entry.raceId),'entry cannot refer to an unprojected race');
  // A competitor's entry may be visible without its private horse dossier.
  ensure(typeof entry.status==='string'&&entry.status.length>0,'entry status required');
 }
 for(const result of p.results){
  ensure(isObj(result),'invalid result');
  id(result.raceId,'result.raceId');
  ensure(raceIds.has(result.raceId),'result has no projected race');
  ensure(Array.isArray(result.finishOrder),'result finish order must be an engine list');
  for(const horseId of result.finishOrder)id(horseId,'result.horseId');
 }
 for(const entry of p.finances.postedTransactions){
  ensure(isObj(entry),'posted transaction must be an object');
  id(entry.id,'posted transaction id');money(entry.amountMinor,'posted transaction amount');
  date(entry.date,'posted transaction date');
 }
 return {horseIds,raceIds};
}
/** Validates provenance and copies ONLY the declared player-visible fields. */
export function playerVisibleProjection(raw,{expectedWorldSnapshotId=null,expectedEngineSha256=null}={}){
 validateBasics(raw);
 if(expectedWorldSnapshotId!==null)ensure(raw.world.snapshotId===expectedWorldSnapshotId,'world source mismatch');
 if(expectedEngineSha256!==null)ensure(raw.engine.sha256===expectedEngineSha256,'engine release mismatch');
 const p={
  schema:UI_PROJECTION_SCHEMA,
  engine:{release:raw.engine.release,sha256:raw.engine.sha256},
  world:{kind:raw.world.kind,snapshotId:raw.world.snapshotId,
   canonicalSourceSnapshotId:raw.world.canonicalSourceSnapshotId||null},
  session:{id:raw.session.id,date:raw.session.date,revision:raw.session.revision,
   journalHash:raw.session.journalHash},
  player:{personId:raw.player.personId,organizationId:raw.player.organizationId||null,
   role:raw.player.role,visibility:'PLAYER_SAFE'},
  horses:raw.horses.map(h=>({
   id:h.id,name:h.name,ownerId:h.ownerId||null,trainerId:h.trainerId||null,
   trackId:h.trackId||null,sex:safeString(h.sex),age:Number.isInteger(h.age)?h.age:null,
   status:safeString(h.status),condition:h.condition?{
    fitness:h.condition.fitness??null,fatigue:h.condition.fatigue??null,
    readiness:h.condition.readiness??null,healthLabel:safeString(h.condition.healthLabel),
    observationStatus:safeString(h.condition.observationStatus)}:null})),
  races:raw.races.map(r=>({id:r.id,trackId:r.trackId||null,date:r.date,
   title:safeString(r.title),status:r.status,conditionText:safeString(r.conditionText),
   nominationsCloseDate:r.nominationsCloseDate||null})),
  entries:raw.entries.map(e=>({id:e.id,horseId:e.horseId,raceId:e.raceId,status:e.status})),
  results:raw.results.map(r=>({raceId:r.raceId,finishOrder:[...r.finishOrder],
   resultStatus:safeString(r.resultStatus)})),
  finances:{currency:'USD',postedBalanceMinor:raw.finances.postedBalanceMinor,
   postedTransactions:raw.finances.postedTransactions.map(t=>({id:t.id,date:t.date,amountMinor:t.amountMinor,
    category:safeString(t.category),description:safeString(t.description)}))},
  permissions:raw.permissions.map(x=>({action:x.action,targetId:x.targetId||null,
   allowed:x.allowed,reasonCode:safeString(x.reasonCode)}))
 };
 return deepFreeze(p);
}
function permissionFor(p,action,targetId){
 return p.permissions.find(x=>x.action===action&&(x.targetId||null)===(targetId||null));
}
/**
 * App integration seam. getProjection/submitCommand are ENGINE-OWNED async
 * callbacks supplied only after a signed-off Drive engine release.
 * Neither method updates the game on the browser or predicts outcomes.
 */
export function createPlayerGameplayBridge({getProjection,submitCommand,
 expectedWorldSnapshotId=null,expectedEngineSha256=null}={}){
 ensure(typeof getProjection==='function'&&typeof submitCommand==='function',
  'engine-owned getProjection and submitCommand callbacks are required');
 let current=null;
 const inflight=new Set();
 async function refresh(){
  const incoming=playerVisibleProjection(await getProjection(),{
   expectedWorldSnapshotId,expectedEngineSha256});
  if(current){
   ensure(sessionKey(current)===sessionKey(incoming),'game identity changed during a live session');
   ensure(incoming.session.revision>=current.session.revision,'projection revision moved backward');
  }
  current=incoming;
  return current;
 }
 async function dispatch({commandId,action,targetId=null,payload={}}={}){
  ensure(current,'refresh projection before sending player commands');
  id(commandId,'commandId');text(action,'action');
  if(targetId!==null)id(targetId,'targetId');
  ensure(isObj(payload),'player command payload must be an object');
  const perm=permissionFor(current,action,targetId);
  ensure(perm&&perm.allowed===true,'engine has not authorized this action for this player');
  ensure(!inflight.has(commandId),'command is already awaiting an engine receipt');
  const envelope=deepFreeze({
   schema:UI_COMMAND_SCHEMA,commandId,
   sessionId:current.session.id,expectedRevision:current.session.revision,
   expectedJournalHash:current.session.journalHash,
   worldSnapshotId:current.world.snapshotId,
   engineSha256:current.engine.sha256,
   action,targetId,payload:cloneSafe(payload)});
  inflight.add(commandId);
  try{
   const response=await submitCommand(envelope);
   ensure(isObj(response)&&response.schema===UI_RECEIPT_SCHEMA,'unknown engine receipt version');
   ensure(response.commandId===commandId&&response.sessionId===envelope.sessionId,
    'receipt does not match command');
   ensure(ACCEPTED.has(response.status),'invalid engine outcome');
   ensure(typeof response.reasonCode==='string','receipt reasonCode required');
   if(response.status!=='REJECTED')await refresh();
   return deepFreeze({schema:UI_RECEIPT_SCHEMA,commandId,status:response.status,
    reasonCode:response.reasonCode,sessionId:response.sessionId,
    projection:current});
  }finally{inflight.delete(commandId)}
 }
 return Object.freeze({
  refresh,dispatch,
  snapshot:()=>current,
  isReady:()=>Boolean(current),
  worldKind:()=>current?.world.kind||null
 });
}
