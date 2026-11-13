/**
 * WIRE TO WIRE — scalable fictional trainer/barn assignment planner (V9).
 *
 * Pure, in-memory simulation planning. No new names, people, horse entities,
 * source facts, horse ownership, UI or saves are created or modified.
 *
 * Horses are addressed by stable zero-based indexes from the calling horse
 * registry. A trainer and its racing stable keep one identity each, while a
 * stable may train horses belonging to MANY different owners.
 *
 * Synthetic trainer portfolio tiers are EDITORIAL modeling parameters;
 * not historically measured US stable-size distributions.
 *
 * Time O(horses + trainers log trainers); space O(horses + trainers).
 * Stable-to-horses reverse lookup is a compressed sparse-row (CSR) index.
 */
export const FICTIONAL_TRAINING_CAPACITY_MODEL='WTW_FICTIONAL_TRAINER_BARNS_V9';
export const TRAINING_BARN_TIERS=Object.freeze([
 Object.freeze({id:'SMALL_YARD',weight:40,min:4,max:14}),
 Object.freeze({id:'REGIONAL_BARN',weight:35,min:15,max:35}),
 Object.freeze({id:'ESTABLISHED_STABLE',weight:18,min:36,max:80}),
 Object.freeze({id:'LARGE_STABLE',weight:6,min:81,max:170}),
 Object.freeze({id:'NATIONAL_OPERATION',weight:1,min:171,max:320})
]);
const NONE=0xffffffff,MAX_HORSES=1000000,MAX_TRAINERS=100000;
function hash(seed,key){
 let h=(2166136261^(seed>>>0))>>>0;
 for(const c of String(key)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
 h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;
 h=Math.imul(h,0x846ca68b);h^=h>>>16;return h>>>0;
}
function nextRandom(seed){
 let s=seed>>>0||0x9e3779b9;
 return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return s>>>0};
}
function nonnegative(value,label,max=MAX_HORSES){
 if(!Number.isSafeInteger(value)||value<0||value>max)
  throw Error('Invalid '+label+': expected integer in 0..'+max);
 return value;
}
function assertSeed(seed){
 if(!Number.isSafeInteger(seed)||seed<1||seed>4294967295)
  throw Error('Invalid trainer assignment seed');
}
function trainerTier(seed,id){
 const roll=hash(seed,'trainer-tier:'+id)%100;
 let cum=0;
 for(const tier of TRAINING_BARN_TIERS){
  cum+=tier.weight;
  if(roll<cum)return tier;
 }
 return TRAINING_BARN_TIERS.at(-1);
}
function proposedCapacity(seed,id,tier){
 const u=(hash(seed,'trainer-capacity:'+id)+.5)/4294967296;
 return tier.min+Math.floor(Math.pow(u,1.2)*(tier.max-tier.min+1));
}
function validTrainerBook(trainers,requireRegions){
 if(!Array.isArray(trainers)||!trainers.length||trainers.length>MAX_TRAINERS)
  throw Error('Training planner needs 1..'+MAX_TRAINERS+' trainers');
 const seen=new Set(),stableIds=new Set();
 return Object.freeze(trainers.map((record,index)=>{
  if(!record||typeof record!=='object'||Array.isArray(record)||
   typeof record.id!=='string'||!record.id.trim())
   throw Error('Missing trainer ID '+index);
  const id=record.id.trim();
  if(id.length>200||seen.has(id))throw Error('Duplicate or invalid trainer ID '+id);
  seen.add(id);
  const stableId=record.stableId??null;
  if(stableId!==null&&(typeof stableId!=='string'||!stableId.trim()||
   stableIds.has(stableId)))throw Error('Duplicate or invalid racing stable ID');
  if(stableId!==null)stableIds.add(stableId);
  const baseRegion=record.baseRegion??record.location?.region??null;
  if(requireRegions&&(typeof baseRegion!=='string'||!baseRegion.trim()))
   throw Error('Trainer has no operating region '+id);
  if(baseRegion!==null&&(typeof baseRegion!=='string'||!baseRegion.trim()))
   throw Error('Invalid operating region '+id);
  const tier=record.barnTier===undefined?null:
   TRAINING_BARN_TIERS.find(x=>x.id===record.barnTier);
  if(record.barnTier!==undefined&&!tier)
   throw Error('Unknown trainer barn tier '+record.barnTier);
  const maxHorses=record.maxHorses===undefined?null:
   nonnegative(record.maxHorses,'trainer maxHorses');
  return Object.freeze({id,stableId,baseRegion,capacityTier:tier?.id??null,
   maxHorses});
 }));
}
function validRegions(horseRegions,horseCount){
 if(horseRegions==null)return null;
 if(!Array.isArray(horseRegions)||horseRegions.length!==horseCount||
  horseRegions.some(x=>typeof x!=='string'||!x.trim()))
  throw Error('horseRegions must specify a valid operating region for every horse');
 return Object.freeze([...horseRegions]);
}
function validatePrior(plan,seed,horseCount,trainerIds,stableIds,regions){
 if(!plan)return 0;
 if(plan.schema!==FICTIONAL_TRAINING_CAPACITY_MODEL||plan.seed!==seed||
  !Number.isSafeInteger(plan.horseCount)||plan.horseCount>horseCount||
  !(plan.trainerIndexForHorse instanceof Uint32Array)||
  plan.trainerIndexForHorse.length!==plan.horseCount||
  !Array.isArray(plan.trainerIds)||plan.trainerIds.length>trainerIds.length||
  plan.trainerIds.some((id,i)=>id!==trainerIds[i])||
  !Array.isArray(plan.stableIds)||plan.stableIds.some((id,i)=>id!==stableIds[i])||
  (regions===null)!==(plan.horseRegions===null)||
  (regions!==null&&(!Array.isArray(plan.horseRegions)||
   plan.horseRegions.length!==plan.horseCount||
   plan.horseRegions.some((r,i)=>r!==regions[i]))))
  throw Error('Incompatible previous training assignments or regional geography');
 return plan.horseCount;
}
function allocateRegionalCounts(seed,trainers,trainerIndexes,counts,capacities,unassignedCount,key){
 // Only TRAINERS of this region participate, so no cross-country/region
 // movement is invented by a global random number.
 const extra=new Uint32Array(trainers.length);
 const vacant=trainerIndexes.filter(i=>counts[i]===0&&capacities[i]>0);
 let remaining=unassignedCount;
 if(remaining>=vacant.length){
  for(const i of vacant){extra[i]++;remaining--}
 }
 if(remaining===0)return extra;
 let available=0;
 for(const i of trainerIndexes)available+=capacities[i]-counts[i]-extra[i];
 if(remaining>available)
  throw Error('Insufficient training capacity in '+key+': '+unassignedCount+
   ' unassigned horses but only '+(available+(unassignedCount-remaining))+' available slots');
 const remainders=[];
 let assigned=0;
 for(const i of trainerIndexes){
  const room=capacities[i]-counts[i]-extra[i];
  if(room<=0)continue;
  const ideal=remaining*room/available;
  const whole=Math.min(room,Math.floor(ideal));
  extra[i]+=whole;assigned+=whole;
  if(room>whole)remainders.push({
   i,fraction:ideal-whole,stable:hash(seed,'trainer-remainder:'+key+':'+trainers[i].id)
  });
 }
 let left=remaining-assigned;
 remainders.sort((a,b)=>b.fraction-a.fraction||a.stable-b.stable||a.i-b.i);
 if(left>remainders.length)throw Error('Trainer capacity apportionment failed');
 for(let j=0;j<left;j++)extra[remainders[j].i]++;
 return extra;
}
function makeGroups(horseCount,regions,trainers,assignment){
 const groups=new Map(),keyAtHorse=regions??null;
 const ensure=key=>{
  let g=groups.get(key);
  if(!g){g={key,trainerIndexes:[],horseIndexes:[]};groups.set(key,g)}
  return g;
 };
 for(let i=0;i<trainers.length;i++)
  ensure(keyAtHorse===null?'GLOBAL':trainers[i].baseRegion).trainerIndexes.push(i);
 for(let h=0;h<horseCount;h++)
  if(assignment[h]===NONE)
   ensure(keyAtHorse===null?'GLOBAL':keyAtHorse[h]).horseIndexes.push(h);
 return groups;
}
function checksum(seed,trainerIds,stableIds,regions,indexes){
 let h=hash(seed,'trainer-capacity-state-v1');
 for(let i=0;i<trainerIds.length;i++)
  h=hash(h,'T:'+trainerIds[i]+'|'+(stableIds[i]??''));
 if(regions)for(const region of regions)h=hash(h,'R:'+region);
 for(const index of indexes){h^=index;h=Math.imul(h,16777619)}
 h^=h>>>16;return (h>>>0).toString(16).padStart(8,'0');
}
export function exportFictionalTrainingAssignmentState(plan){
 if(!plan||plan.schema!==FICTIONAL_TRAINING_CAPACITY_MODEL||
  !(plan.trainerIndexForHorse instanceof Uint32Array)||
  plan.trainerIndexForHorse.length!==plan.horseCount||
  !Array.isArray(plan.trainerIds)||!Array.isArray(plan.stableIds))
  throw Error('Invalid training plan for export');
 const trainerIds=[...plan.trainerIds],stableIds=[...plan.stableIds],
  trainerIndexes=Array.from(plan.trainerIndexForHorse),
  horseRegions=plan.horseRegions===null?null:[...plan.horseRegions];
 return Object.freeze({
  schema:FICTIONAL_TRAINING_CAPACITY_MODEL,seed:plan.seed,
  horseCount:plan.horseCount,trainerIds,stableIds,horseRegions,
  trainerIndexes,checksum:checksum(plan.seed,trainerIds,stableIds,horseRegions,trainerIndexes)
 });
}
export function importFictionalTrainingAssignmentState(value){
 if(!value||value.schema!==FICTIONAL_TRAINING_CAPACITY_MODEL||
  !Number.isSafeInteger(value.seed)||value.seed<1||value.seed>4294967295||
  !Number.isSafeInteger(value.horseCount)||value.horseCount<0||value.horseCount>MAX_HORSES||
  !Array.isArray(value.trainerIds)||!value.trainerIds.length||
  value.trainerIds.length>MAX_TRAINERS||
  value.trainerIds.some(id=>typeof id!=='string'||!id.trim())||
  new Set(value.trainerIds).size!==value.trainerIds.length||
  !Array.isArray(value.stableIds)||value.stableIds.length!==value.trainerIds.length||
  value.stableIds.some(id=>id!==null&&(typeof id!=='string'||!id.trim()))||
  value.horseRegions!==null&&
   (!Array.isArray(value.horseRegions)||value.horseRegions.length!==value.horseCount||
    value.horseRegions.some(x=>typeof x!=='string'||!x.trim()))||
  !Array.isArray(value.trainerIndexes)||value.trainerIndexes.length!==value.horseCount||
  value.trainerIndexes.some(i=>!Number.isSafeInteger(i)||i<0||i>=value.trainerIds.length)||
  value.checksum!==checksum(value.seed,value.trainerIds,value.stableIds,
   value.horseRegions,value.trainerIndexes))
  throw Error('Invalid or corrupt trainer assignment checkpoint');
 return Object.freeze({
  schema:FICTIONAL_TRAINING_CAPACITY_MODEL,seed:value.seed,
  horseCount:value.horseCount,trainerIds:Object.freeze([...value.trainerIds]),
  stableIds:Object.freeze([...value.stableIds]),
  horseRegions:value.horseRegions===null?null:Object.freeze([...value.horseRegions]),
  trainerIndexForHorse:Uint32Array.from(value.trainerIndexes)
 });
}
/**
 * Predict regional shortages BEFORE issuing new trainer/stable identities.
 * A caller decides if it should hire/activate an existing trainer; the
 * planner never invents a stable to quietly make a request fit.
 */
export function assessFictionalTrainingCapacity({seed=19990101,trainers,horseCount,
 horseRegions=null}={}){
 assertSeed(seed);nonnegative(horseCount,'horseCount');
 const regions=validRegions(horseRegions,horseCount);
 const book=validTrainerBook(trainers,regions!==null);
 const byRegion=new Map();
 const add=(key,field,quantity)=>{
  const v=byRegion.get(key)??{horseCount:0,capacity:0,trainerCount:0};
  v[field]+=quantity;byRegion.set(key,v);
 };
 for(let h=0;h<horseCount;h++)add(regions?.[h]??'GLOBAL','horseCount',1);
 let available=0;
 for(const trainer of book){
  const tier=TRAINING_BARN_TIERS.find(x=>x.id===trainer.capacityTier)??trainerTier(seed,trainer.id);
  const cap=trainer.maxHorses??proposedCapacity(seed,trainer.id,tier);
  available+=cap;
  add(regions===null?'GLOBAL':trainer.baseRegion,'capacity',cap);
  add(regions===null?'GLOBAL':trainer.baseRegion,'trainerCount',1);
 }
 const report=Object.fromEntries([...byRegion].map(([key,v])=>[key,Object.freeze({
  ...v,shortfall:Math.max(0,v.horseCount-v.capacity)
 })]));
 return Object.freeze({schema:FICTIONAL_TRAINING_CAPACITY_MODEL,
  horseCount,trainerCount:book.length,availableSlots:available,
  shortfall:[...byRegion.values()].reduce((n,v)=>n+Math.max(0,v.horseCount-v.capacity),0),
  byRegion:Object.freeze(report)});
}
/**
 * Allocate each training horse to exactly one existing trainer/stable.
 * Historical locked trainer indexes and all previous committed assignments
 * remain untouched; no ownership assignment is changed or inferred.
 */
export function planFictionalTrainingAssignments({
 seed=19990101,trainers,horseCount,horseRegions=null,
 lockedAssignments=[],existingPlan=null
}={}){
 assertSeed(seed);nonnegative(horseCount,'horseCount');
 const regions=validRegions(horseRegions,horseCount);
 const book=validTrainerBook(trainers,regions!==null);
 if(!Array.isArray(lockedAssignments))throw Error('lockedAssignments must be an array');
 const trainerIds=Object.freeze(book.map(x=>x.id)),
  stableIds=Object.freeze(book.map(x=>x.stableId));
 const byId=new Map(trainerIds.map((id,i)=>[id,i]));
 const past=validatePrior(existingPlan,seed,horseCount,trainerIds,stableIds,regions);
 const capacities=new Uint32Array(book.length),counts=new Uint32Array(book.length);
 const tiers=Object.freeze(book.map(x=>x.capacityTier??trainerTier(seed,x.id).id));
 for(let i=0;i<book.length;i++){
  const tier=TRAINING_BARN_TIERS.find(x=>x.id===tiers[i]);
  capacities[i]=book[i].maxHorses??proposedCapacity(seed,book[i].id,tier);
 }
 const assignment=new Uint32Array(horseCount);
 assignment.fill(NONE);
 if(existingPlan)for(let h=0;h<past;h++){
  const t=existingPlan.trainerIndexForHorse[h];
  if(t>=book.length)throw Error('Previous trainer index is invalid');
  assignment[h]=t;counts[t]++;
 }
 const locks=new Set();
 for(const lock of lockedAssignments){
  if(!lock||!Number.isInteger(lock.horseIndex)||lock.horseIndex<0||
   lock.horseIndex>=horseCount||!byId.has(lock.trainerId)||locks.has(lock.horseIndex))
   throw Error('Invalid or duplicated historical trainer assignment');
  locks.add(lock.horseIndex);
  const h=lock.horseIndex,t=byId.get(lock.trainerId);
  if(regions!==null&&book[t].baseRegion!==regions[h])
   throw Error('Historical trainer/horse location mismatch');
  if(assignment[h]!==NONE&&assignment[h]!==t)
   throw Error('Historical trainer assignment conflicts with previous plan');
  if(assignment[h]===NONE){assignment[h]=t;counts[t]++}
 }
 for(let i=0;i<book.length;i++){
  if(book[i].maxHorses!==null&&counts[i]>capacities[i])
   throw Error('Existing trainer assignments exceed explicit barn capacity '+book[i].id);
  if(book[i].maxHorses===null&&counts[i]>capacities[i])
   capacities[i]=counts[i];
 }
 const groups=makeGroups(horseCount,regions,book,assignment);
 const reports=Object.create(null);
 for(const [key,group] of groups){
  let spare=0;
  for(const i of group.trainerIndexes)spare+=capacities[i]-counts[i];
  const amount=group.horseIndexes.length;
  if(amount>spare)throw Error('Insufficient training capacity in '+key+': '+amount+
   ' unassigned horses, '+spare+' available trainer slots');
  const extra=allocateRegionalCounts(seed,book,group.trainerIndexes,counts,capacities,amount,key);
  const slots=new Uint32Array(amount);let j=0;
  for(const i of group.trainerIndexes)
   for(let n=0;n<extra[i];n++)slots[j++]=i;
  if(j!==amount)throw Error('Trainer region allocation did not reconcile');
  const random=nextRandom(hash(seed,'barn-shuffle:'+key+':'+horseCount+':'+past));
  for(let i=slots.length-1;i>0;i--){
   const k=random()%(i+1);
   [slots[i],slots[k]]=[slots[k],slots[i]];
  }
  for(let i=0;i<amount;i++)assignment[group.horseIndexes[i]]=slots[i];
  for(const i of group.trainerIndexes)counts[i]+=extra[i];
  reports[key]=Object.freeze({trainers:group.trainerIndexes.length,
   newlyAssigned:amount});
 }
 const offsets=new Uint32Array(book.length+1);
 for(let i=0;i<book.length;i++)offsets[i+1]=offsets[i]+counts[i];
 if(offsets.at(-1)!==horseCount)throw Error('Trainer assignment count reconciliation failed');
 const reverse=new Uint32Array(horseCount),cursor=Uint32Array.from(offsets.slice(0,-1));
 for(let h=0;h<horseCount;h++){
  const t=assignment[h];
  if(t===NONE||t>=book.length)throw Error('Horse lacks valid trainer '+h);
  if(regions!==null&&regions[h]!==book[t].baseRegion)
   throw Error('Cross-region fictional stable assignment rejected for horse '+h);
  reverse[cursor[t]++]=h;
 }
 let idle=0,small=0,large=0,biggest=0;
 for(const count of counts){
  if(count===0)idle++;
  if(count>=1&&count<=10)small++;
  if(count>=100)large++;
  if(count>biggest)biggest=count;
 }
 const indexToTrainer=new Map(trainerIds.map((id,i)=>[id,i]));
 const summary=Object.freeze({
  horseCount,trainerCount:book.length,previousHorseCount:past,
  lockedHorseCount:locks.size,unassignedHorses:0,
  idleTrainers:idle,trainersWithOneToTenHorses:small,
  trainersWithHundredPlusHorses:large,largestBarn:biggest,
  byRegion:Object.freeze(reports)
 });
 return Object.freeze({
  schema:FICTIONAL_TRAINING_CAPACITY_MODEL,seed,horseCount,
  trainerIds,stableIds,horseRegions:regions,
  trainerIndexForHorse:assignment,horseCountsByTrainer:counts,
  trainerCapacities:capacities,trainerTiers:tiers,
  trainerHorseOffsets:offsets,horseIndexesByTrainer:reverse,summary,
  trainerIdAtHorse(h){
   if(!Number.isInteger(h)||h<0||h>=horseCount)
    throw Error('Invalid training horse index');
   return trainerIds[assignment[h]];
  },
  stableIdAtHorse(h){
   if(!Number.isInteger(h)||h<0||h>=horseCount)
    throw Error('Invalid training horse index');
   return stableIds[assignment[h]];
  },
  trainerHorses(trainerId,{offset=0,limit=30}={}){
   const i=indexToTrainer.get(trainerId);
   if(i===undefined)throw Error('Unknown trainer '+trainerId);
   nonnegative(offset,'trainer portfolio offset');
   nonnegative(limit,'trainer portfolio page size',1000);
   const start=offsets[i],count=counts[i];
   return Object.freeze({trainerId,stableId:stableIds[i],count,capacity:capacities[i],
    barnTier:tiers[i],offset,
    horseIndexes:Object.freeze(Array.from(reverse.slice(
     start+Math.min(offset,count),start+Math.min(count,offset+limit))))
   });
  }
 });
}
/**
 * Read-only ownership/training cross-check. A big owner may use several
 * trainers; each trainer may have many independent ownership connections.
 */
export function auditFictionalOwnerTrainerNetwork({ownerPlan,trainingPlan}={}){
 if(!ownerPlan||!(ownerPlan.ownerIndexForHorse instanceof Uint32Array)||
  !Array.isArray(ownerPlan.ownerIds)||
  !trainingPlan||trainingPlan.schema!==FICTIONAL_TRAINING_CAPACITY_MODEL||
  !(trainingPlan.trainerIndexForHorse instanceof Uint32Array)||
  ownerPlan.horseCount!==trainingPlan.horseCount)
  throw Error('Incompatible owner/trainer plans');
 const ownerConnections=Array.from({length:ownerPlan.ownerIds.length},()=>new Set()),
  trainerConnections=Array.from({length:trainingPlan.trainerIds.length},()=>new Set());
 for(let h=0;h<trainingPlan.horseCount;h++){
  const o=ownerPlan.ownerIndexForHorse[h],t=trainingPlan.trainerIndexForHorse[h];
  if(o>=ownerConnections.length||t>=trainerConnections.length)
   throw Error('Invalid owner/trainer index for horse '+h);
  ownerConnections[o].add(t);trainerConnections[t].add(o);
 }
 let ownersWithMultipleTrainers=0,trainersWithMultipleOwners=0;
 let maxTrainersPerOwner=0,maxOwnersPerTrainer=0;
 for(const s of ownerConnections){
  if(s.size>1)ownersWithMultipleTrainers++;
  if(s.size>maxTrainersPerOwner)maxTrainersPerOwner=s.size;
 }
 for(const s of trainerConnections){
  if(s.size>1)trainersWithMultipleOwners++;
  if(s.size>maxOwnersPerTrainer)maxOwnersPerTrainer=s.size;
 }
 return Object.freeze({horseCount:trainingPlan.horseCount,
  distinctOwners:ownerConnections.length,distinctTrainers:trainerConnections.length,
  ownersWithMultipleTrainers,trainersWithMultipleOwners,
  maxTrainersPerOwner,maxOwnersPerTrainer});
}
