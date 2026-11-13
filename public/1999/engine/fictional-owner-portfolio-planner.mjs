/**
 * WIRE TO WIRE — high-scale fictional owner portfolios (V9).
 *
 * Pure allocation planner only: DOES NOT invent new people, horses, farms or
 * partnerships, and DOES NOT write to the live 1999 game or its saves.
 * A fixed horseIndex must be a stable index from the calling horse registry.
 *
 * Owner portfolio tiers and their frequency weights are EDITORIAL GAME
 * PARAMETERS, not measured real-world percentages. They are deliberately
 * independent of whether an owner is an individual or a partnership.
 *
 * Space: O(horseCount + owners). Time: O(horseCount + owners log owners).
 * Owner-to-horse reverse lookup uses a compressed sparse row (CSR) index:
 * no per-owner scans over the entire 100,000+ horse population.
 */
export const FICTIONAL_PORTFOLIO_MODEL='WTW_FICTIONAL_OWNER_PORTFOLIOS_V9';
export const PORTFOLIO_TIERS=Object.freeze([
 Object.freeze({id:'HANDFUL',weight:57,min:1,max:5}),
 Object.freeze({id:'SMALL',weight:24,min:6,max:25}),
 Object.freeze({id:'REGIONAL',weight:12,min:26,max:75}),
 Object.freeze({id:'MAJOR',weight:6,min:76,max:200}),
 Object.freeze({id:'ELITE',weight:1,min:201,max:900})
]);
// A tier suggests a size range, not a company classification or legal type.
// The tier ID "HANDFUL" is used for the 1–5-horse long tail.
const TIER_LABELS=Object.freeze(['HANDFUL','SMALL','REGIONAL','MAJOR','ELITE']);
const NONE=0xffffffff,MAX_HORSES=1000000,MAX_OWNERS=150000;
const keyOf=name=>String(name||'').trim();
function hash(seed,key){
 let h=(2166136261^(seed>>>0))>>>0;
 for(const c of String(key)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
 h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;
 h=Math.imul(h,0x846ca68b);h^=h>>>16;return h>>>0;
}
function random32(seed){
 let x=seed>>>0||0x6d2b79f5;
 return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0};
}
function positiveInt(value,label,max=MAX_HORSES){
 if(!Number.isSafeInteger(value)||value<0||value>max)
  throw Error('Invalid '+label+': expected integer in 0..'+max);
 return value;
}
function tierFor(seed,id){
 const roll=hash(seed,'portfolio-tier:'+id)%100;
 let running=0;
 for(const entry of PORTFOLIO_TIERS){
  running+=entry.weight;
  if(roll<running)return entry;
 }
 return PORTFOLIO_TIERS.at(-1);
}
function suggestedCapacity(seed,id,tier){
 const u=(hash(seed,'portfolio-scale:'+id)+.5)/4294967296;
 // Skew toward the lower end within each tier, leaving credible outliers.
 return tier.min+Math.floor(Math.pow(u,1.35)*(tier.max-tier.min+1));
}
function verifyPrior(existingPlan,seed,horseCount,ownerIds){
 if(!existingPlan)return;
 if(existingPlan.schema!==FICTIONAL_PORTFOLIO_MODEL||
  existingPlan.seed!==seed||
  !Number.isInteger(existingPlan.horseCount)||
  existingPlan.horseCount>horseCount||
  !Array.isArray(existingPlan.ownerIds)||
  !(existingPlan.ownerIndexForHorse instanceof Uint32Array)||
  existingPlan.ownerIndexForHorse.length!==existingPlan.horseCount)
  throw Error('Incompatible existing portfolio plan');
 // Owner additions are append-only. An existing ID cannot change its index.
 if(existingPlan.ownerIds.length>ownerIds.length||
  existingPlan.ownerIds.some((id,i)=>id!==ownerIds[i]))
  throw Error('Existing owner IDs/order cannot be changed while extending');
}
function validateOwners(owners){
 if(!Array.isArray(owners)||!owners.length||owners.length>MAX_OWNERS)
  throw Error('Portfolio planner requires 1..'+MAX_OWNERS+' owners');
 const seen=new Set();
 return Object.freeze(owners.map((owner,i)=>{
  if(!owner||typeof owner!=='object'||Array.isArray(owner))
   throw Error('Invalid owner record '+i);
  const id=keyOf(owner.id);
  if(!id||id.length>200||seen.has(id))throw Error('Duplicate or missing owner ID '+i);
  seen.add(id);
  const tier=owner.portfolioTier===undefined?null:PORTFOLIO_TIERS.find(t=>t.id===owner.portfolioTier);
  if(owner.portfolioTier!==undefined&&!tier)
   throw Error('Unknown owner portfolio tier '+owner.portfolioTier);
  if(owner.maxHorses!==undefined)
   positiveInt(owner.maxHorses,'owner maxHorses',MAX_HORSES);
  return Object.freeze({id,portfolioTier:tier?.id??null,
   maxHorses:owner.maxHorses??null});
 }));
}
function allocateCounts(seed,owners,existingCounts,capacity,remaining,horseCount){
 const count=Uint32Array.from(existingCounts);
 const needOne=[];
 for(let i=0;i<owners.length;i++){
  if(!count[i]&&capacity[i]>0)needOne.push(i);
 }
 // Preserve the long tail: when the population can support every owner,
 // each owner should be able to have one horse before elite owners absorb
 // additional capacity. This does NOT override historical assignments.
 if(horseCount>=owners.length&&remaining>=needOne.length){
  for(const i of needOne){count[i]++;remaining--}
 }
 if(!remaining)return count;
 const available=new Uint32Array(owners.length);
 let totalAvailable=0;
 for(let i=0;i<owners.length;i++){
  available[i]=Math.max(0,capacity[i]-count[i]);
  totalAvailable+=available[i];
 }
 if(remaining>totalAvailable)
  throw Error('Insufficient existing-owner capacity: add owners or raise explicit limits');
 const extras=new Uint32Array(owners.length),fraction=[];
 let allocated=0;
 for(let i=0;i<owners.length;i++){
  if(!available[i])continue;
  const ideal=remaining*available[i]/totalAvailable;
  const floor=Math.min(available[i],Math.floor(ideal));
  extras[i]=floor;allocated+=floor;
  if(floor<available[i])fraction.push({i,part:ideal-floor,
   order:hash(seed,'portfolio-remainder:'+owners[i].id)});
 }
 let left=remaining-allocated;
 // Largest-remainder apportionment is O(owners log owners), not one
 // expensive lottery / scan for each of the 100,000 horse assignments.
 fraction.sort((a,b)=>b.part-a.part||a.order-b.order||a.i-b.i);
 if(left>fraction.length)throw Error('Portfolio remainder allocation failed');
 for(let j=0;j<left;j++)extras[fraction[j].i]++;
 for(let i=0;i<owners.length;i++)count[i]+=extras[i];
 return count;
}
/**
 * Build or extend a horse-to-owner plan over stable horse-directory indexes.
 *
 * Inputs:
 *   owners: [{id, portfolioTier?, maxHorses?}]
 *   horseCount: number of training horse slots (supports >=100k)
 *   lockedAssignments: [{horseIndex, ownerId}], e.g. historical canon links
 *   existingPlan: earlier plan, for growth WITHOUT moving existing horses
 *
 * Capacity comes from a deterministic fictional tier unless maxHorses is
 * explicitly supplied by the game. Fixed horse ownership is authoritative;
 * an explicit capacity below a fixed count is rejected, never silently
 * overwriting canon relationships.
 */
export function planFictionalOwnerPortfolios({
 seed=19990101,owners,horseCount,lockedAssignments=[],existingPlan=null
}={}){
 positiveInt(seed,'owner allocation seed',4294967295);
 if(!seed)throw Error('Owner allocation seed must be positive');
 positiveInt(horseCount,'horseCount');
 const book=validateOwners(owners);
 if(!Array.isArray(lockedAssignments))throw Error('lockedAssignments must be an array');
 const ownerIds=Object.freeze(book.map(x=>x.id)),idToIndex=new Map(ownerIds.map((id,i)=>[id,i]));
 verifyPrior(existingPlan,seed,horseCount,ownerIds);
 const tierLabels=Object.freeze(book.map(owner=>owner.portfolioTier||
  tierFor(seed,owner.id).id));
 const capacity=new Uint32Array(book.length);
 for(let i=0;i<book.length;i++){
  const tier=PORTFOLIO_TIERS.find(t=>t.id===tierLabels[i]);
  capacity[i]=book[i].maxHorses??suggestedCapacity(seed,book[i].id,tier);
 }
 const assignment=new Uint32Array(horseCount);
 assignment.fill(NONE);
 const counts=new Uint32Array(book.length);
 const past=existingPlan?.horseCount??0;
 if(existingPlan){
  for(let i=0;i<past;i++){
   const o=existingPlan.ownerIndexForHorse[i];
   if(o>=book.length)throw Error('Invalid previous owner index');
   assignment[i]=o;counts[o]++;
  }
 }
 const seenLocked=new Set();
 for(const item of lockedAssignments){
  if(!item||!Number.isSafeInteger(item.horseIndex)||
   item.horseIndex<0||item.horseIndex>=horseCount||
   !idToIndex.has(item.ownerId)||seenLocked.has(item.horseIndex))
   throw Error('Invalid or repeated locked horse ownership');
  seenLocked.add(item.horseIndex);
  const i=item.horseIndex,owner=idToIndex.get(item.ownerId);
  if(assignment[i]!==NONE&&assignment[i]!==owner)
   throw Error('Locked historical ownership conflicts with existing plan');
  if(assignment[i]===NONE){assignment[i]=owner;counts[owner]++}
 }
 for(let i=0;i<book.length;i++){
  if(book[i].maxHorses!==null&&counts[i]>capacity[i])
   throw Error('Explicit maximum horses is below existing/locked assignments for '+book[i].id);
  // Synthetic capacity may be raised to honor a previously committed
  // allocation. Never change an existing horse to fit the new generator.
  if(book[i].maxHorses===null&&counts[i]>capacity[i])capacity[i]=counts[i];
 }
 let occupied=0,limit=0;
 for(let i=0;i<counts.length;i++){occupied+=counts[i];limit+=capacity[i]}
 if(horseCount>limit)throw Error('Insufficient owner capacity for '+horseCount+
  ' horses: '+limit+' slots; provide more owners or explicit capacities');
 const finalCounts=allocateCounts(seed,book,counts,capacity,horseCount-occupied,horseCount);
 let slotsNeeded=horseCount-occupied;
 const slots=new Uint32Array(slotsNeeded);
 let pos=0;
 for(let i=0;i<book.length;i++){
  const extra=finalCounts[i]-counts[i];
  for(let j=0;j<extra;j++)slots[pos++]=i;
 }
 if(pos!==slotsNeeded)throw Error('Portfolio count reconciliation failed');
 const rand=random32(hash(seed,'portfolio-shuffle:'+horseCount+':'+past));
 for(let i=slots.length-1;i>0;i--){
  const j=rand()%(i+1);
  [slots[i],slots[j]]=[slots[j],slots[i]];
 }
 let assigned=0;
 for(let h=0;h<horseCount;h++){
  if(assignment[h]===NONE)assignment[h]=slots[assigned++];
 }
 if(assigned!==slotsNeeded)throw Error('Horse ownership slot reconciliation failed');
 const offsets=new Uint32Array(book.length+1);
 for(let i=0;i<book.length;i++)offsets[i+1]=offsets[i]+finalCounts[i];
 const indexes=new Uint32Array(horseCount),cursor=Uint32Array.from(offsets.slice(0,-1));
 for(let h=0;h<horseCount;h++){
  const o=assignment[h];
  if(o===NONE||o>=book.length)throw Error('Horse has no valid owner '+h);
  indexes[cursor[o]++]=h;
 }
 const byTier={};
 for(const tier of TIER_LABELS)byTier[tier]={owners:0,horses:0};
 let oneToFive=0,atLeast200=0,empty=0,maxPortfolio=0;
 for(let i=0;i<book.length;i++){
  const c=finalCounts[i];byTier[tierLabels[i]].owners++;
  byTier[tierLabels[i]].horses+=c;
  if(c>=1&&c<=5)oneToFive++;
  if(c>=200)atLeast200++;
  if(!c)empty++;
  if(c>maxPortfolio)maxPortfolio=c;
 }
 const top=Array.from(finalCounts).sort((a,b)=>b-a);
 const topPercent=Math.max(1,Math.ceil(book.length*.01));
 let topHorses=0;
 for(let i=0;i<topPercent;i++)topHorses+=top[i];
 const summary=Object.freeze({
  horseCount,ownerCount:book.length,lockedHorseCount:seenLocked.size,
  priorHorseCount:past,unownedHorses:0,
  ownersWithOneToFive:oneToFive,ownersWithAtLeastTwoHundred:atLeast200,
  inactiveOwners:empty,largestPortfolio:maxPortfolio,
  topOnePercentHorseShare:horseCount?topHorses/horseCount:0,
  byTier:Object.freeze(Object.fromEntries(
   Object.entries(byTier).map(([k,v])=>[k,Object.freeze(v)])))
 });
 return Object.freeze({
  schema:FICTIONAL_PORTFOLIO_MODEL,seed,horseCount,ownerIds,
  ownerIndexForHorse:assignment,ownerHorseOffsets:offsets,
  horseIndexesByOwner:indexes,horseCounts:finalCounts,
  ownerCapacity:capacity,ownerTier:tierLabels,summary,
  ownerIdAtHorse(horseIndex){
   if(!Number.isInteger(horseIndex)||horseIndex<0||horseIndex>=horseCount)
    throw Error('Invalid horse index');
   return ownerIds[assignment[horseIndex]];
  },
  ownerPortfolio(ownerId,{offset=0,limit=30}={}){
   const i=idToIndex.get(ownerId);
   if(i===undefined)throw Error('Unknown owner ID '+ownerId);
   positiveInt(offset,'portfolio offset');
   positiveInt(limit,'portfolio page size',1000);
   const start=offsets[i],count=finalCounts[i];
   return Object.freeze({
    ownerId,count,portfolioTier:tierLabels[i],
    capacity:capacity[i],offset,
    horseIndexes:Object.freeze(Array.from(
     indexes.slice(start+Math.min(offset,count),
      start+Math.min(count,offset+limit))))
   });
  }
 });
}
