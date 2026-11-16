/**
 * Player-visible, read-only projection of the ONE canonical saved game run.
 * The world is the already-opened deterministic 1999 world; this module does
 * not seed, simulate, edit, or create an alternate career/save.
 */
export const POPULATED_1999_UI_READ_MODEL_SCHEMA='WTW_CANONICAL_CAREER_READ_MODEL_V2';
const safeMinor=x=>Number.isSafeInteger(x)&&x>=0?x:null;
const nameOrId=(rows,id)=>rows?.find(x=>x.id===id)?.name||id||'Not recorded';
const statusLabel=status=>({
 ENTRIES_OPEN:'Entries open',
 OFFICIAL_SIM_RESULT:'Official game result',
 CANCELLED_INSUFFICIENT_FIELD:'Cancelled · insufficient field'
})[status]||String(status||'Not recorded').replaceAll('_',' ');

/** Original IDs, posted balances, field entries and official results only. */
export function projectPopulated1999Career({manifest,world,run}={}){
 if(!run?.run_id||!run?.clock?.date||!run?.player?.operation_id||
  !Array.isArray(run.stable_horse_ids)||!run.runtime?.registered_horses?.by_id||
  !run.runtime?.races||!run.runtime?.entries||
  !manifest?.worldId||!Number.isSafeInteger(manifest.seed)||
  !world?.entities?.organizations||!world?.entities?.people||!world?.entities?.tracks)
  throw Error('A complete saved 1999 career and its original world are required');
 if(run.world_ref?.sha256!==world.authority?.sha256||
  run.world_ref?.snapshot_id!==world.authority?.snapshot_id||
  run.run_id!=='WTW-RUN-1999-'+manifest.seed+'-SIZE-'+
   (manifest.targetOpeningHorses??manifest.horseCount))
  throw Error('UI projection refused a mismatched world or career identity');
 const operationId=run.player.operation_id;
 const organization=world.entities.organizations.find(x=>x.id===operationId);
 if(!organization)throw Error('Player operation is missing from its canonical world');
 const registry=run.runtime.registered_horses.by_id;
 const stableIds=new Set(run.stable_horse_ids);
 const entryRows=Object.values(run.runtime.entries);
 const originalRaces=Object.values(run.runtime.races);
 const raceRows=originalRaces.map(r=>{
  const participantEntries=(r.field||[]).map(id=>run.runtime.entries[id]).filter(Boolean);
  const playerEntries=participantEntries.filter(e=>stableIds.has(e.horse_id));
  const results=(r.status==='OFFICIAL_SIM_RESULT'&&Array.isArray(r.results)?r.results:[])
   .slice().sort((a,b)=>a.finish-b.finish).map(result=>Object.freeze({
    horseId:result.horse_id,
    horseName:registry[result.horse_id]?.registered_name||result.horse_id,
    finish:result.finish,earningsMinor:safeMinor(result.earnings_minor)
   }));
  return Object.freeze({
   id:r.id,name:r.name||r.conditions||r.id,date:r.date,
   trackId:r.track_id,track:nameOrId(world.entities.tracks,r.track_id),
   status:r.status,statusLabel:statusLabel(r.status),
   conditions:r.conditions||'',fullConditions:r.full_conditions||'',
   age:r.age||'',sex:r.sex||'',surface:r.surface||'',
   distanceFurlongs:r.distance_furlongs??null,
   purseMinor:safeMinor(r.purse_minor),fieldCount:participantEntries.length,
   playerEntryCount:playerEntries.filter(e=>e.status==='ENTERED').length,
   playerResultCount:playerEntries.filter(e=>e.status==='RESULTED').length,
   results:Object.freeze(results)
  });
 }).filter(r=>r.id&&r.date).sort((a,b)=>{
  const group=r=>r.status==='ENTRIES_OPEN'?0:r.status==='OFFICIAL_SIM_RESULT'?1:2;
  return group(a)-group(b)||(group(a)===0?
   a.date.localeCompare(b.date):b.date.localeCompare(a.date))||a.id.localeCompare(b.id);
 });
 const racesById=new Map(raceRows.map(r=>[r.id,r]));
 const horseRows=run.stable_horse_ids.map(id=>{
  const h=registry[id];
  if(!h||h.horse_id!==id||h.owner_organization_id!==operationId)
   throw Error('The saved player stable contains an unresolved or unowned horse '+id);
  const entries=entryRows.filter(e=>e.horse_id===id&&racesById.has(e.race_id));
  const next=entries.filter(e=>e.status==='ENTERED')
   .map(e=>racesById.get(e.race_id))
   .filter(r=>r?.status==='ENTRIES_OPEN'&&r.date>=run.clock.date)
   .sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id))[0]||null;
  const history=raceRows.filter(r=>r.status==='OFFICIAL_SIM_RESULT'&&
   r.results.some(result=>result.horseId===id))
   .sort((a,b)=>b.date.localeCompare(a.date));
  const last=history[0]||null;
  const results=history.map(r=>{
   const result=r.results.find(x=>x.horseId===id);
   return Object.freeze({raceId:r.id,date:r.date,name:r.name,
    track:r.track,finish:result.finish,earningsMinor:result.earningsMinor});
  });
  const record=h.career||{},care=run.runtime.horse?.[id]?.training||{};
  const year=Number(run.clock.date.slice(0,4));
  const age=Number.isSafeInteger(h.foaling_year)?year-h.foaling_year:null;
  const earningsMinor=safeMinor(record.earnings_minor);
  const fitness=typeof care.fitness==='number'&&care.fitness>=0&&care.fitness<=1?care.fitness:null;
  const readiness=typeof care.readiness==='number'&&care.readiness>=0&&care.readiness<=1?care.readiness:null;
  const risk=typeof care.currentRisk==='number'&&care.currentRisk>=0&&care.currentRisk<=1?care.currentRisk:null;
  const sorenessDays=Number.isSafeInteger(care.sorenessDays)&&care.sorenessDays>=0?care.sorenessDays:null;
  return Object.freeze({
   horseId:id,name:h.registered_name,age,foalYear:h.foaling_year,
   birthDate:h.birth_date||'',sex:h.sex||'',
   ownerId:h.owner_organization_id,ownerName:organization.name,
   trainerId:h.trainer_id,trainerName:nameOrId(world.entities.people,h.trainer_id),
   breederId:h.breeder_organization_id,
   breederName:nameOrId(world.entities.organizations,h.breeder_organization_id),
   trackId:h.host_track_id,trackName:nameOrId(world.entities.tracks,h.host_track_id),
   residenceId:h.current_residence_id||'',
   starts:Number.isSafeInteger(record.starts)?record.starts:null,
   wins:Number.isSafeInteger(record.wins)?record.wins:null,
   earningsMinor,fitness,readiness,risk,sorenessDays,
   entered:Boolean(next),nextRaceId:next?.id||null,
   nextRaceName:next?.name||'',nextRaceDate:next?.date||'',
   nextRaceTrack:next?.track||'',lastRaceDate:last?.date||'',
   results:Object.freeze(results),
   activity:next?'Entered · '+next.track+' · '+next.date:
    last?'Last race · '+last.date:'Registered in active career'
  });
 });
 const cashMinor=run.runtime.finances?.operation_balances_minor?.[operationId];
 return Object.freeze({
  schema:POPULATED_1999_UI_READ_MODEL_SCHEMA,
  worldId:manifest.worldId,runId:run.run_id,revision:run.revision,
  date:run.clock.date,worldHorseCount:manifest.horseCount,
  personCount:manifest.personCount,
  operationId,operationName:organization.name,
  cashMinor:Number.isSafeInteger(cashMinor)?cashMinor:null,
  horseRows:Object.freeze(horseRows),raceRows:Object.freeze(raceRows)
 });
}
