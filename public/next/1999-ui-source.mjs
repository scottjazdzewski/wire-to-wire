/* 1999 SOURCE DATA ADAPTER FOR EXISTING PREMIUM MANAGEMENT UI.
 * Adds no HTML screens, CSS, alternate game state, or fictional race results.
 * Reuses the same browser 1999 world projection as the diagnostic test lab.
 * All generated values are TEST state, canonical values retain source authority.
 */
import {trackProgram1999,trackMeetOpen1999} from '/next/1999-track-program.mjs';
import {WTW_ALTERNATE_STAKES_1999} from '/next/1999-alternate-stakes.mjs';
import {WTW_REGIONAL_STAKES_1999} from '/next/1999-regional-stakes.mjs';
import {readLocal1999World} from '/1999/engine/local-api.mjs?rev=wtw1999-founding-history-v3';
import attributeCatalog from '/1999/engine/attribute-catalog.mjs';
import {TRAINING_PLANS,createHorseTrainingRecord,horseTrainingSnapshot,
 assignHorseTrainingPlan,simulateStableTrainingThrough,trainingFinancials}
 from '/1999/engine/horse-development.mjs';
let viewDate='1999-01-01';
const saveKey=()=>window.__WTW_1999_MANAGEMENT__?.saveKey||'wtw1999ManagementStateV1';
let cachedCareerRaw=null,cachedCareer=null,trainerYear='',trainerModels=null;
function gameCareer(){
 if(typeof localStorage==='undefined'||!window.__WTW_1999_MANAGEMENT__)return null;
 const raw=localStorage.getItem(saveKey());if(!raw)return null;
 if(raw===cachedCareerRaw)return cachedCareer;
 const game=JSON.parse(raw);
 if(game?.worldAnchor?.schema!==window.__WTW_1999_MANAGEMENT__.schema)return null;
 cachedCareerRaw=raw;cachedCareer=game;return game;
}
function storeCareer(game){
 const raw=JSON.stringify(game);localStorage.setItem(saveKey(),raw);
 cachedCareerRaw=raw;cachedCareer=game;
}
function trainingTrainerMap(){
 const year=viewDate.slice(0,4);
 if(trainerYear===year&&trainerModels)return trainerModels;
 const trainers=get('trainers','/api/1999/sim/trainers',worldCounts.trainers);
 trainerModels=Object.fromEntries(trainers.map(t=>[t.id,t]));
 trainerYear=year;
 return trainerModels;
}
function syncDevelopment(date){
 const game=gameCareer();
 if(!game||game.date!==date)return game;
 if(game.horseDevelopment?.processedThrough===date)return game;
 const done=simulateStableTrainingThrough(game,{
  horses:stableHorses,trainerById:trainingTrainerMap(),seed:game.worldAnchor.seed,date
 });
 if(done.daysProcessed){
  storeCareer(done.game);
  return done.game;
 }
 return game;
}
function horseTraining(nameOrId){
 const h=stableHorses.find(x=>x.id===nameOrId||x.name===nameOrId);
 if(!h)return null;
 const game=gameCareer();
 return horseTrainingSnapshot(game,h);
}
function trainingCosts(){return trainingFinancials(gameCareer())}
function assignTraining(horseId,plan){
 const game=gameCareer();if(!game)throw Error('Active 1999 career save unavailable');
 if(game.date!==viewDate)throw Error('Game date and training date are not synchronized');
 const h=stableHorses.find(x=>x.id===horseId);
 if(!h)throw Error('That horse is not in your stable');
 const prepared=syncDevelopment(game.date)||game;
 const updated=assignHorseTrainingPlan(prepared,{horse:h,plan,stableHorses, date:game.date});
 if(updated!==prepared){
  storeCareer(updated);
 }
 return horseTrainingSnapshot(updated,h);
}
const gameWorldProfile=window.__WTW_1999_MANAGEMENT__?.worldProfile||
 window.WTW1999CommercialConfig?.current?.()||
 {seed:19990101,mode:'FOUNDING_1999',population:112};
const worldQuery='seed='+encodeURIComponent(gameWorldProfile.seed)+
 '&mode='+encodeURIComponent(gameWorldProfile.mode)+
 '&population='+encodeURIComponent(gameWorldProfile.population);
const q=(route,extras='')=>readLocal1999World(route+(route.includes('?')?'&':'?')+
 worldQuery+(viewDate==='1999-01-01'?'':'&date='+viewDate)+(extras?'&'+extras:''));
const allPages=(route,total)=>{
 const first=q(route,'offset=0&limit=100');
 const count=Number.isInteger(first.total)?first.total:total;
 const rows=[...(first.items||[])];
 for(let offset=100;offset<count;offset+=100){
  const page=q(route,'offset='+offset+'&limit=100');
  rows.push(...(page.items||[]));
 }
 return rows;
};
const srcHorses=gameWorldProfile.mode==='FULLY_FICTIONAL_TEST'?[]:allPages('/api/1999/horses',267);
const sourceHorseOffset=new Map(srcHorses.map((h,index)=>[h.id,index]));
const srcOrgs=gameWorldProfile.mode==='FULLY_FICTIONAL_TEST'?[]:allPages('/api/1999/organizations',108);
const srcPeople=gameWorldProfile.mode==='FULLY_FICTIONAL_TEST'?[]:allPages('/api/1999/people',154);
const worldCounts=q('/api/1999/sim/overview').counts;
const generatedPeopleCount=worldCounts.people-srcPeople.length;
const activeStallions=q('/api/1999/stallions').active;
const ownerNames=new Map(srcOrgs.map(o=>[o.id,o.name]));
const peopleNames=new Map(srcPeople.map(p=>[p.id,p.name]));
const ownership=new Map();for(const h of srcHorses){ownership.set(h.ownerId,(ownership.get(h.ownerId)||0)+1);}
const fictionalOpeningOwners=q('/api/1999/sim/world-horse-directory','offset=0&limit=100').items||[];
const fictionalOwnerTally=new Map();
for(const h of fictionalOpeningOwners)if(h.ownerId)
 fictionalOwnerTally.set(h.ownerId,(fictionalOwnerTally.get(h.ownerId)||0)+1);
const fictionalOwner=[...fictionalOwnerTally].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]?.[0]||null;
const activeOwnerId=gameWorldProfile.mode==='FULLY_FICTIONAL_TEST'?fictionalOwner:
 [...ownership].filter(([id])=>id).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]?.[0]||null;
const fictionalOwnerIndex=activeOwnerId&&gameWorldProfile.mode==='FULLY_FICTIONAL_TEST'?
 Math.max(0,Number(String(activeOwnerId).match(/(\d+)$/)?.[1]||1)-1):0;
const ownerRecord=activeOwnerId&&gameWorldProfile.mode==='FULLY_FICTIONAL_TEST'?
 q('/api/1999/sim/owners','offset='+fictionalOwnerIndex+'&limit=1').items?.[0]:null;
const selectedOwner=ownerNames.get(activeOwnerId)||
 (ownerRecord?.id===activeOwnerId?ownerRecord.name:'')||activeOwnerId||'1999 Foundation Stable';
// The player's entire horse portfolio is resolved from the ONE deterministic world.
// This does not fabricate additional historical source records or outcomes.
const portfolioQuery='ownerId='+encodeURIComponent(activeOwnerId||'');
const ownedHorseCount=q('/api/1999/sim/owner-horses',portfolioQuery+'&offset=0&limit=1').total;
let stableHorses=allPages('/api/1999/sim/owner-horses?'+portfolioQuery,ownedHorseCount);
if(gameWorldProfile.population<325000){
 // The old 87.5k scheduling API is not the reduced directory. Never show
 // nonmember horses as if the player owned them in a smaller selected world.
 stableHorses=stableHorses.filter(h=>{
  try{return q('/api/1999/sim/world-horse-profile','id='+encodeURIComponent(h.id)).index>=0}
  catch{return false}
 });
}
let horseLookup=new Map([...srcHorses,...stableHorses].map(h=>[h.name,h]));
const sourceHorseIds=new Set(srcHorses.map(h=>h.id));

const ownerIndex=srcOrgs.findIndex(o=>o.id===activeOwnerId);
const initialOwner=q('/api/1999/sim/owners','offset='+Math.max(0,gameWorldProfile.mode==='FULLY_FICTIONAL_TEST'?fictionalOwnerIndex:ownerIndex)+'&limit=1').items?.[0]||null;
const openingCash=initialOwner?.finances?.cash??null;
const messageSpecs=[
 ['opening-stable','Stable Office','1999 opening roster: '+selectedOwner,
  'Source-locked horses · ownership and barns',true,'Stable'],
 ['opening-stakes','Racing Secretary','1999 domestic stakes program',
  'No entries or results recorded',true,'Racing'],
 ['opening-breeding','Breeding Office','31 stallions and 2,036 mare boarding files',
  'Source records, not declared matings',false,'Breeding'],
 ['opening-market','Sales Desk','36 generated sale dates to test',
  'Auction transactions have NOT occurred',false,'Sales'],
 ['opening-finance','Accounting','Opening cash and budgets are TEST valuations',
  'No accounting transactions have posted',true,'Finances'],
 ['opening-tracks','Track Operations',worldCounts.tracks+' U.S., Canadian and Cuban tracks available',
  'Operating conditions and meet dates remain test data',false,'Tracks'],
 ['opening-people','Personnel Office','4,200 trainers in the test economy',
  'Only known people identities are source-locked',false,'Personnel'],
 ['opening-universe','World Registrar',(worldCounts.worldHorses||worldCounts.horses).toLocaleString('en-US')+' distinct horses in the 1999 world',
  'Source-locked horses preserved; other population groups simulated',false,'World']
];
const officeMessages=messageSpecs.map(([caseId,from,title,meta,urgent,section],i)=>({
 case:caseId,from,title,meta,time:'DAY 1',urgent,resolved:false,
 initials:from.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase(),section
}));
const officeDesks=Object.fromEntries(messageSpecs.map(([key,from,title,meta,urgent,section])=>[key,{
 type:'1999 OPENING / '+(urgent?'REVIEW':'INTELLIGENCE'),title,summary:meta,
 pressure:urgent?'Review before 1999 play':'Planning',
 risk:'No 1999 result or payment may be precommitted',
 read:'Source canon preserved; simulated attributes flagged',source:from,
 moves:[{tag:'INSPECT',title:'Open '+section+' department',menu:section},
  {tag:'CROSS-CHECK',title:'Open World directory',menu:'World'}],
 intel:[{title:'Evidence boundary',body:'Source identities remain locked; operating values are test-world assumptions.'},
  {title:'Calendar boundary',body:'January 1, 1999 start. No future race result, auction settlement, or mating is preloaded.'},
  {title:'Production status',body:'World is populated for UI testing; transaction and race engines are not yet operational.'}]
}]));

const records=new Map();
const get=(key,route,count)=>{if(!records.has(key))records.set(key,allPages(route,count));return records.get(key);};
const city=v=>[v?.city||v?.locality,v?.state||v?.region].filter(Boolean).join(', ');
const money=v=>Number.isFinite(Number(v))?'$'+Math.round(Number(v)).toLocaleString('en-US'):'';
const label=v=>v==null?'':String(v);
const rep=v=>Number.isFinite(Number(v?.overall))?String(v.overall)+'/99':'';
function sourceFacts(name){
 const h=horseLookup.get(name);if(!h)return null;
 const source=sourceHorseIds.has(h.id);
 const trainer=peopleNames.get(h.trainerId)||get('trainerNames','/api/1999/sim/trainers',4200).find(t=>t.id===h.trainerId)?.name||'';
 return {age:String(h.ageAtDate??h.ageAtOpening??1999-Number(h.foalYear)),sex:h.sex||'',
  connections:{trainer,owner:ownerNames.get(h.ownerId)||selectedOwner,breeder:h.breeder||h.breederName||''},
  name:h.name,ability:h.ability||null,source:source?'1999_CANON_LOCKED':'1999_TEST_GENERATED',
  racing_status:h.racingStatus1999||h.racingStatus||'SOURCE_STATUS_NOT_VERIFIED',
  openingCondition:h.openingCondition||null,
  record:!source&&h.career&&Number.isInteger(h.career.starts)?{
   starts:h.career.starts,wins:h.career.wins,seconds:h.career.seconds,thirds:h.career.thirds,
   earnings:h.career.earnings,lastRaced:h.career.lastRaceDate,
   provenance:h.career.provenance}:null,
  modelRaceHistory:!source?h.career?.raceHistory||[]:[],
  current_base:h.openingStable?.locality||h.location?.city||'',
  sire_id:h.sireId,dam_id:h.damId};
}
const ownerFor=name=>{const h=horseLookup.get(name);return h?(h.ownerId===activeOwnerId?selectedOwner:ownerNames.get(h.ownerId)||h.ownerId||''):null;};
function roster(){return stableHorses.map((h,i)=>({name:h.name,
 activity:sourceHorseIds.has(h.id)?h.trainingStatus||'SOURCE · CONDITION NOT OBSERVED':
  'TEST · '+String(h.racingStatus1999||'STATUS UNAVAILABLE').replaceAll('_',' '),
  currentAbility:h.ability?.currentStars??null,potentialAbility:h.ability?.potentialStars??null,
 tag:(sourceHorseIds.has(h.id)?'CANON':'TEST')+' · '+h.sex+' · '+(h.ageAtDate??1999-Number(h.foalYear))+'YO',index:i+1,horseId:h.id}));}
function stableHorsePreview(name){
 const h=horseLookup.get(name);
 if(!h)return null;
 const source=sourceHorseIds.has(h.id);
 return {_kind:'horse',_name:h.name,name:h.name,_canonId:source?h.id:'',
  _id:h.id,_testGenerated:!source,_testAttrs:h.attributes||{},_testCareer:h.career||{},_testFinances:h.finances||{},
  _testReputation:h.reputation||{},_testAbility:h.ability||null,
  _testRelationships:h.relationships||{},_preferredJockeyId:h.preferredJockeyId||'',
  _openingCondition:h.openingCondition||null,
  racingStatus1999:h.racingStatus1999||h.racingStatus||'SOURCE_STATUS_NOT_VERIFIED',
   ca:String(h.ability?.currentStars??''),pa:String(h.ability?.potentialStars??''),
   age:String(h.ageAtDate??h.ageAtOpening??1999-Number(h.foalYear)),foalYear:h.foalYear,dateOfBirth:h.dateOfBirth||'',
  foalingGeography:h.foalingGeography||h.foalingLocation||h.foalingPlace||null,
  ownerId:h.ownerId||'',trainerId:h.trainerId||'',
  breederId:h.breederId||'',breeder:h.breeder||h.breederName||'',
  breedingFarmId:h.breedingFarmId||'',breedingFarm:h.breedingFarm||'',homebred:h.homebred===true,
  sex:h.sex||'',sire:h.sireId||'',dam:h.damId||'',owner:ownerFor(name)||'',
  trainer:sourceFacts(name)?.connections.trainer||'',track:h.openingStable?.name||h.stableTrackId||'',
  location:city(h.location||h.openingStable)||'',
  status:source?h.racingStatus||'SOURCE OPENING':'1999 GENERATED TEST — NO RESULTS'};
}
function auctionList(){
 const source=get('sales','/api/1999/sim/auctions',36);
 return source.map((a,i)=>({id:a.id,name:a.name,date:a.date,endDate:a.date,sortKey:a.date,
  companyId:'TEST_SALES_'+String(i%7),company:'1999 Test Auction House '+String(i%7+1),
  city:city(a.location),category:'SIMULATED SALE — NOT A COMPLETED TRANSACTION',
  confirmedDate:true,dateLabel:a.date,lots:[],previewIndex:i,source:'TEST_CONDITION_AND_MARKET'}));
}
function makeDepartmentRows(section,page,context={}){
 if(section==='Racing'){
  const date=context.date||'1999-01-01';
  const meets=context.racingMode||'meets';
  if(page==='Overview')return meets==='mine'?[]:null;
  if(page==='Entries'||page==='Results')return []; // No committed 1999 runners/results.
  if(page==='Stakes'){
   const stakes=allStakes1999;
   return stakes.filter(r=>r.localDate>=date).map(r=>({
    _kind:'race',_name:r.name,_track:r.trackName,_iso:r.localDate,_raceId:r.id,_raceData:r,
    date:r.localDate,track:r.trackName,race:r.name,
    class:r.status||r.division||'STAKES',surface:r.surface||'',
    distance:r.distanceF?String(r.distanceF)+'f':'',
    purse:r.purse1999?money(r.purse1999):'',horse:'',base:'',ship:'',
    jockey:'',trainer:'',ready:'',status:r.canonical===false?'WTW 1999 GAME STAKES · NOT ENTERED':'1999 CANON SCHEDULE · NOT ENTERED'}));
  }
  if(page==='Race Planning'){
   const tracks=get('racing-tracks','/api/1999/sim/tracks',worldCounts.tracks);
   const rows=[];
   for(let i=0;i<tracks.length;i++){
    const card=q('/api/1999/sim/conditions','date='+encodeURIComponent(date)+'&trackIndex='+i);
    for(const r of card.races||[])rows.push({
     _kind:'race',_name:r.id,_track:r.trackName,_iso:r.date,_raceId:r.id,_raceData:r,
     date:r.date,track:r.trackName,race:'R'+r.number,class:r.conditions,
     surface:r.surface,distance:String(r.distanceFurlongs)+'f',
     purse:money(r.purse),horse:'',base:'',ship:'',jockey:'',trainer:'',
     ready:'',status:'TEST CONDITION BOOK · NOT ENTERED'});
   }
   return rows;
  }
 }
 if(section==='Breeding'&&page==='Stallions'){
  // In FOUNDING_1999, the sourced stallions are the entire small roster.
  // They are NOT an extra 18 to append to the same 18 modeled parents.
  const source=activeStallions.map(h=>({_kind:'horse',_name:h.name,_canonId:h.id,_id:h.id,
   name:h.name,horse:h.name,age:h.foalYear?String(1999-h.foalYear):'',
   sex:'STALLION',sire:h.sireId||'',dam:h.damId||'',farm:h.standingFarm1999?.farmName||'',
   status:'STANDING 1999 · SOURCE',health:'UNASSESSED',pedigree:'',
   value:'',owner:'',studFee:'NOT ESTABLISHED',bookings:'NOT RECORDED',
   foals:'NOT RECORDED',winners:'NOT RECORDED'}));
  if(gameWorldProfile.mode==='FOUNDING_1999')return source;
  const modeled=get('breeding-sires','/api/1999/sim/breeding-stock?sex=SIRE',
   worldCounts.breedingStallions);
  return [...source,...modeled.map(h=>({_kind:'horse',_name:h.name,_id:h.id,_testGenerated:true,
   name:h.name,horse:h.name,age:String(h.ageAtOpening??h.age??''),sex:'STALLION',
   sire:h.sireId||'',dam:h.damId||'',farm:h.farmName||'',
   status:String(h.breedingStatus1999||h.status||'UNASSESSED').replaceAll('_',' ')+' · TEST',
   health:'TEST · NOT EXAMINED',pedigree:'',value:'',owner:'',
   studFee:h.studFee1999?'$'+Number(h.studFee1999).toLocaleString('en-US'):'NOT ESTABLISHED',
   bookings:String(h.projected1999BookSize||0),foals:'NOT RECORDED',winners:'NOT RECORDED'}))];
 }
 if(section==='Breeding'&&page==='Broodmares'){
  // Broodmares are a large virtual list, paged by the same deterministic model.
  return null;
 }
 if(section==='Breeding'&&page==='Stud Farms'){
  return get('breeding-farms','/api/1999/sim/facilities',worldCounts.facilities)
   .filter(f=>f.facilityClass==='STUD_FARM'||f.type==='STUD_FARM').map(f=>({_kind:'farm',_name:f.name,_id:f.id,
    _testGenerated:true,name:f.name,type:'STUD FARM',location:city(f.location),
    capacity:String(f.capacity),occupied:String(f.occupied),free:String(f.capacity-f.occupied),
    condition:Math.round((f.equipmentCondition||0)*100)+'%',quality:Math.round((f.attributes?.horse_care||0)*100)+'/100',
    staff:String(f.staffingRequirement||''),cost:money(f.annualOperatingCost),
    owner:'',status:'1999 TEST STUD FARM'}));
 }
 if(section==='Breeding'&&page==='Foals'){
  const forecast=q('/api/1999/sim/foaling-forecast');
  return [{_kind:'foal-forecast',_name:'1999 test foaling pipeline',horse:'1999 PROJECTED FOAL CROP',
   age:'0',sex:'—',sire:String(forecast.stallionPopulation??worldCounts.breedingStallions)+' SOURCE STALLIONS',
   dam:Number(forecast.mares||0).toLocaleString('en-US')+' MARES',
   farm:forecast.farmCount==null?'FARM COUNT UNASSESSED':String(forecast.farmCount)+' FARMS',status:'FORECAST · NOT BORN',health:'NOT APPLICABLE',pedigree:'',
   value:'',owner:'',studFee:'',bookings:forecast.projectedCoverings.toLocaleString('en-US'),
   foals:forecast.projectedLiveFoals.toLocaleString('en-US'),winners:'—'}];
 }
 if(section==='Personnel'&&page==='Ownership Groups')return [];
 if(section==='Personnel'&&page==='Owners'){
  return get('owners','/api/1999/sim/owners',worldCounts.owners).map(o=>({
   _kind:'farm',_name:o.name,_id:o.id,name:o.name,type:o.type,
   location:city(o.location),principal:o.principalOwner||'Not recorded',principalId:o.principalOwnerId||'',
   status:'1999 · '+o.portfolio?.tier,principalAge:o.principalAgeAtDate??o.principalAge??'',
    _testAbility:o.principalAbility||null,_canonId:o.authority?.startsWith('CANON')?o.id:'',
   _testGenerated:!o.authority?.startsWith('CANON'),_testAttrs:o.attributes||{},
   _testFinances:o.finances||{},_testNegotiation:o.negotiation||null,
   _testReputation:o.reputation||{}}));
 }
 if(section==='Personnel'){
  const trainerRelations=new Map(),jockeyRelations=new Map();
  for(const h of stableHorses){
   const own=h.relationships?.ownerTrainer,ride=h.relationships?.trainerJockey;
   if(own&&h.trainerId){const entry=trainerRelations.get(h.trainerId)||{total:0,count:0};
    entry.total+=own.trust;entry.count++;trainerRelations.set(h.trainerId,entry)}
   if(ride&&h.preferredJockeyId){const entry=jockeyRelations.get(h.preferredJockeyId)||{total:0,count:0};
    entry.total+=ride.chemistry;entry.count++;jockeyRelations.set(h.preferredJockeyId,entry)}
  }
  const roles={Trainers:'trainer',Jockeys:'jockey',Staff:'staff'},wanted=roles[page]||'all';
  const workforce=get('workforce','/api/1999/sim/people',generatedPeopleCount);
  const base=page==='Trainers'?
   [...get('trainers','/api/1999/sim/trainers',worldCounts.trainers),
    ...workforce.filter(p=>p.role==='trainer')]:
   page==='Jockeys'||page==='Staff'||page==='Overview'?workforce:[];
  return base.filter(p=>wanted==='all'?p.role!=='owner':
   wanted==='staff'?!['trainer','jockey','owner','groom','exercise_rider'].includes(p.role):p.role===wanted).map(p=>{
   const attrs=p.attributes||p.roleAttributes||{},rating=v=>v==null?'':String(v);
   const roleNames={trainer:'Conditioning & placement',jockey:'Riding & tactics',farm_manager:'Farm management',
    veterinarian:'Veterinary medicine',farrier:'Hoof care',bloodstock_agent:'Bloodstock selection',jockey_agent:'Jockey representation',racing_secretary:'Race conditions'};
   const link=(p.role==='trainer'?trainerRelations:jockeyRelations).get(p.id);
   const stableRelationship=link?Math.round(link.total/link.count):null;
   return {_kind:'person',_name:p.name,_id:p.id,name:p.name,age:p.age||'',role:p.role||'',reputation:rep(p.reputation),
    relationship:stableRelationship!=null?stableRelationship+'/100 · '+link.count+' HORSES':'',
    ca:rating(p.ability?.currentStars),pa:rating(p.ability?.potentialStars),specialty:roleNames[p.role]||'',
    morale:typeof p.morale==='number'?Math.round(p.morale*100)+'%':'',
    workload:typeof p.workload==='number'?Math.round(p.workload*100)+'%':'',
    salary:p.employmentStatus==='AVAILABLE_UNCONTRACTED'?'—':
     p.role==='jockey'?money(p.compensation?.projectedAnnualGross||0):
     money(p.compensation?.estimatedAnnualFees??p.payrollAnnual??p.annualBaseSalary??0),
    contract:p.employmentStatus==='AVAILABLE_UNCONTRACTED'?'UNCONTRACTED · AVAILABLE':
     p.role==='jockey'?'MOUNT + PURSE SHARE · TEST':
     p.role==='trainer'?'DAY FEE + PURSE SHARE · TEST':'1999 test appointment',
    assignment:p.employmentStatus==='AVAILABLE_UNCONTRACTED'?'':
     p.barnId||p.organizationId||'',base:city(p.location||p.base),birthCountry:p.birthCountry||'',wins:'',
    commission:p.compensation?.winShareRate!=null?(Math.round(p.compensation.winShareRate*1000)/10)+'%':'',
    demand:p.bookingMarket?.demandTier||p.bookingDemand?.tier||'',
    competingBarns:p.bookingMarket?.competingBarns?.length!=null?String(p.bookingMarket.competingBarns.length):'',
    quotedMount:p.bookingMarket?.suggestedMountFee?'$'+Number(p.bookingMarket.suggestedMountFee).toLocaleString('en-US'):'',
    _testMarket:p.bookingMarket||null,_testCompensation:p.compensation||null,
    _testGenerated:!p.authority?.startsWith('CANON'),_testAttrs:attrs,_testAbility:p.ability||null,
    _testReputation:p.reputation||{},ageBasis:p.ageBasis||'',
    _testOrigin:!srcPeople.some(source=>source.id===p.id)};
  });
 }
 if(section==='Facilities'){
  const names={'Training Centers':'TRAINING_CENTER','Breaking Facilities':'BREAKING_FACILITY',
   'Racing Stables':'RACE_BARN'};
  const filtered=get('facilities','/api/1999/sim/facilities',worldCounts.facilities).filter(f=>{
   if(page==='Stud Farms')return f.facilityClass==='STUD_FARM'||f.type==='STUD_FARM';
   if(page==='Farms')return f.type==='FARM'||
    (f.type==='BREEDING_FARM'&&f.facilityClass!=='STUD_FARM');
   if(!names[page])return true;return f.type===names[page];});
  return filtered.map(f=>({_kind:'farm',_name:f.name,name:f.name,
   type:f.type==='RACE_BARN'?'RACING STABLE':
    f.type==='BREEDING_FARM'?(f.facilityClass==='STUD_FARM'?'STUD FARM':'FARM'):
    f.type.replaceAll('_',' '),
   location:city(f.location),capacity:String(f.capacity),occupied:String(f.occupied),
    _id:f.id,_facilityClass:f.facilityClass||'',_testGenerated:true,
    _testAttrs:f.attributes||{},_testReputation:f.reputation||{},
    _testFinances:{annualOperatingCost:f.annualOperatingCost},
   free:String(f.capacity-f.occupied),condition:typeof f.equipmentCondition==='number'?Math.round(f.equipmentCondition*100)+'%':'',
    quality:typeof f.attributes?.horse_care==='number'?Math.round(f.attributes.horse_care*100)+'/100':'',
   staff:String(f.staffingRequirement||''),cost:money(f.annualOperatingCost),owner:f.trainerId||'',
   status:'1999 TEST FACILITY',_testOrigin:true}));
 }
 if(section==='Finances'){
  if(gameWorldProfile.mode==='FOUNDING_1999')return [{
   _kind:'finance',_name:'FOUNDING-ACCOUNTS-NOT-CERTIFIED',
   date:'1/1/99',_iso:'1999-01-01',category:'OPENING ACCOUNTS',
   description:'New founding-world finances awaiting gameplay-engine opening balance certification',
   department:'1999 FOUNDING WORLD',income:'—',expense:'—',balance:'—',
   source:'FOUNDING_FINANCE_NOT_CERTIFIED__NO_SETTLEMENT_AUTHORITY'
  }].filter(()=>page!=='Operating Costs');
  const o=get('ownerSample','/api/1999/sim/owners',3308).find(o=>o.id===activeOwnerId)||get('ownerSample2','/api/1999/sim/owners',3308)[0];
  if(!o)return [];
  const rows=[{category:'OPENING CAPITAL',description:o.name+' · Test-world opening cash',income:o.finances.cash,expense:0,balance:o.finances.cash},
    {category:'ANNUAL HORSE BUDGET',description:'1999 operating budget, not a posted transaction',income:0,expense:o.finances.annualHorseOperatingBudget,balance:o.finances.cash},
    {category:'DEBT EXPOSURE',description:'Opening test liabilities; no payment committed',income:0,expense:o.finances.debt,balance:o.finances.cash}];
  return rows.map((r,i)=>({_kind:'finance',_name:'TEST-OPENING-'+i,date:'1/1/99',
   category:r.category,description:r.description,department:'TEST WORLD',
   income:r.income?money(r.income):'',expense:r.expense?money(r.expense):'',
   balance:money(r.balance),_iso:'1999-01-01',source:'GENERATED_TEST_BASELINE'})).filter(r=>
    page!=='Operating Costs'||Boolean(r.expense));
 }
 return null;
}
const departmentCache=new Map();
function setGameDate(date){
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||date<'1999-01-01'||date>'2080-12-31')return;
 if(date===viewDate)return;
 // Model reads validate the date and return deterministic as-of ability.
 const previous=viewDate;viewDate=date;
 try{
  q('/api/1999/sim/overview');
  records.clear();departmentCache.clear();
  stableHorses=allPages('/api/1999/sim/owner-horses?'+portfolioQuery,ownedHorseCount);
  horseLookup=new Map([...srcHorses,...stableHorses].map(h=>[h.name,h]));
  syncDevelopment(date);
  if(window.__WTW_1999_UI_DATA__)window.__WTW_1999_UI_DATA__.stableHorses=roster();
 }catch(error){
  viewDate=previous;
  throw error;
 }
}
function departmentRows(section,page,context={}){
 if(context.date)setGameDate(context.date);
 const key=section+'|'+page+(section==='Racing'?'|'+(context.date||'1999-01-01')+'|'+(context.racingMode||'meets'):'');
 if(departmentCache.has(key))return departmentCache.get(key);
 const rows=makeDepartmentRows(section,page,context);
 if(Array.isArray(rows))departmentCache.set(key,rows);
 return rows;
}
let universeLabels=null;
// All breeding mares can be sorted and filtered globally without loading
// 60,000 complete attribute/ancestry profiles into the page.
const mareDirectorySummaries=[];
let mareDirectoryProgress=0,mareDirectoryComplete=false,mareDirectoryStarted=false;
let mareDirectoryKey='',mareDirectoryCache=[];
function scanMareDirectory(){
 const page=q('/api/1999/sim/mare-directory','offset='+mareDirectoryProgress+'&limit=100');
 if(!page.items?.length){mareDirectoryComplete=true;return window.__WTW_NEXT__?.paint?.()}
 mareDirectorySummaries.push(...page.items);
 mareDirectoryProgress=mareDirectorySummaries.length;
 if(mareDirectoryProgress>=worldCounts.breedingMares){
  mareDirectoryComplete=true;window.__WTW_NEXT__?.paint?.();return;
 }
 if(mareDirectoryProgress%3000===0)window.__WTW_NEXT__?.paint?.();
 setTimeout(scanMareDirectory,0);
}
function breedingMareBrowse({offset=0,limit=160,search='',sort='horse',desc=false,filters={}}={}){
 if(!mareDirectoryStarted){mareDirectoryStarted=true;setTimeout(scanMareDirectory,0)}
 const registered=get('mares','/api/1999/broodmare-boarding',2036);
 if(!mareDirectoryComplete)return {total:registered.length+worldCounts.breedingMares,
  items:[],indexing:true,progress:mareDirectoryProgress};
 const all=[...registered.map((h,i)=>({
  _mareIndex:null,_kind:'horse',_name:h.name,_canonId:h.id,name:h.name,horse:h.name,
  age:String(1999-Number(h.foalYear)),sex:h.sex||'MARE',
  farm:h.boardingFarm1999?.farmName||'',status:'REGISTERED BOARDING · SOURCE',
  sire:h.sireId||'',dam:h.damId||'',bookings:'NOT VERIFIED',foals:'NOT VERIFIED',
  health:'UNASSESSED',pedigree:'',value:'',owner:'',studFee:'',winners:''
 })),...mareDirectorySummaries.map(h=>({
  _mareIndex:h.index,_kind:'horse',_name:h.name,_testGenerated:true,_id:h.id,
  name:h.name,horse:h.name,age:String(h.age),sex:'MARE',sire:'',dam:'',
  farm:h.farm,status:h.status.replaceAll('_',' ')+' · TEST',
  bookings:h.bookings?'1 PROJECTED':'0',foals:h.foals?'1 EXPECTED':'0',
  health:'TEST · NOT EXAMINED',pedigree:'',value:'',owner:'',studFee:'',winners:'NOT RECORDED'
 }))];
 const key=JSON.stringify([search,sort,desc,filters]);
 if(key!==mareDirectoryKey){
  const norm=v=>String(v??'').toLowerCase().replaceAll('_',' ');
  const needle=norm(search),filterQuery=norm(filters.query);
  mareDirectoryCache=all.filter(h=>{
   if(needle&&!['horse','farm','status','name','age','sex'].some(k=>norm(h[k]).includes(needle)))return false;
   if(filters.ageMin!==''&&filters.ageMin!=null&&Number(h.age)<Number(filters.ageMin))return false;
   if(filters.ageMax!==''&&filters.ageMax!=null&&Number(h.age)>Number(filters.ageMax))return false;
   if(filters.sex&&norm(h.sex)!==norm(filters.sex))return false;
   if(filters.status&&!norm(h.status).includes(norm(filters.status)))return false;
   if(filters.field&&filterQuery&&!norm(h[filters.field]).includes(filterQuery))return false;
   return true;
  });
  const sign=desc?-1:1;
  mareDirectoryCache.sort((a,b)=>{
   const av=a[sort]??'',bv=b[sort]??'';
   const na=Number(av),nb=Number(bv);
   const cmp=av!==''&&bv!==''&&Number.isFinite(na)&&Number.isFinite(nb)?
    na-nb:String(av).localeCompare(String(bv),undefined,{numeric:true,sensitivity:'base'});
   return sign*cmp||String(a._name).localeCompare(String(b._name));
  });
  mareDirectoryKey=key;
 }
 return {total:mareDirectoryCache.length,indexing:false,progress:mareDirectoryProgress,
  items:mareDirectoryCache.slice(0,Math.min(mareDirectoryCache.length,Math.max(1,limit)))};
}
function breedingMarePage(offset=0,limit=100,filter=''){
 const source=get('mares','/api/1999/broodmare-boarding',2036),sourceCount=source.length;
 const allCount=sourceCount+worldCounts.breedingMares;
 const start=Math.max(0,Math.min(allCount,Number(offset)||0));
 const count=Math.max(1,Math.min(100,Number(limit)||100));
 const items=[];
 const modelStart=Math.max(0,start-sourceCount);
 const modelLength=Math.max(0,Math.min(allCount,start+count)-Math.max(sourceCount,start));
 const model=modelLength?q('/api/1999/sim/breeding-stock',
  'sex=DAM&offset='+modelStart+'&limit='+modelLength).items||[]:[];
 for(let i=start;i<Math.min(allCount,start+count);i++){
  if(i<sourceCount){
   const h=source[i];
   items.push({_kind:'horse',_name:h.name,_canonId:h.id,name:h.name,horse:h.name,
    age:String(1999-Number(h.foalYear)),sex:h.sex||'MARE',sire:h.sireId||'',dam:h.damId||'',
    farm:h.boardingFarm1999?.farmName||'',owner:'',
    status:'1999 REGISTERED BOARDING · SOURCE',health:'UNASSESSED',pedigree:'',value:'',
    studFee:'',bookings:'NOT VERIFIED',foals:'NOT VERIFIED',winners:'NOT VERIFIED'});
  }else{
   const h=model[i-Math.max(sourceCount,start)];
   if(!h)continue;
   const founding=gameWorldProfile.mode==='FOUNDING_1999';
   items.push({_kind:'horse',_name:h.name,_id:h.id,
    _canonId:founding?h.id:undefined,_testGenerated:!founding,
    _testAttrs:h.attributes||{},_testAbility:h.ability||{},_testReputation:h.reputation||{},
    name:h.name,horse:h.name,age:String(h.ageAtOpening??h.age??(1999-Number(h.foalYear))),
    sex:'MARE',sire:h.sireId||'',dam:h.damId||'',
    farm:h.farmName||h.standingFarm1999?.farmName||h.boardingFarm1999?.farmName||'',
    location:city(h.location||h.boardingFarm1999||h.standingFarm1999),
    status:String(h.breedingStatus1999||h.status||'BROODMARE_UNASSESSED').replaceAll('_',' ')+
     (founding?' · SOURCE':' · TEST'),
    health:'NOT EXAMINED',pedigree:'',value:'',owner:'',studFee:'',
    bookings:'NOT RECORDED',foals:'NOT RECORDED',winners:'NOT RECORDED'});
  }
 }
 const needle=String(filter||'').trim().toLowerCase();
 return {total:allCount,items:needle?items.filter(h=>[h.name,h.farm,h.status,h.sex].some(v=>String(v||'').toLowerCase().includes(needle))):items,
  isPageFilter:Boolean(needle)};
}
// Build one lightweight global index in small browser tasks. Never scan all
// 87,500 full race files or block user interaction with a giant synchronous load.

/* Keep 325k global index and sort state outside the game-render thread.
 * Worker replies contain one visible page, never the complete population.
 * The original incremental browser index remains as compatibility fallback. */
let worldBrowseWorker=null,worldBrowseWorkerUnavailable=false;
let worldBrowseRequest=null,worldBrowseResponse=null,worldBrowseSerial=0;
let worldBrowseProgress=0,worldBrowseProgressTotal=worldCounts.worldHorses||worldCounts.horses;
function fallbackWorldBrowse(){
 worldBrowseWorkerUnavailable=true;
 try{worldBrowseWorker?.terminate()}catch{}
 worldBrowseWorker=null;worldBrowseRequest=null;worldBrowseResponse=null;
 window.__WTW_NEXT__?.paint?.();
}
function getWorldBrowseWorker(){
 if(worldBrowseWorkerUnavailable||typeof Worker==='undefined')return null;
 if(worldBrowseWorker)return worldBrowseWorker;
 try{
  const worker=new Worker('/next/1999-world-index.worker.mjs?rev=wtw1999-founding-history-v3&'+worldQuery,
   {type:'module',name:'wtw1999-world-registry'});
  worker.onmessage=event=>{
   const message=event.data||{};
   if(message.type==='progress'||message.type==='index-ready'){
    worldBrowseProgress=message.loaded||0;
    worldBrowseProgressTotal=message.total||worldBrowseProgressTotal;
    window.__WTW_NEXT__?.paint?.();
   }
   if(message.type==='result'&&message.requestId===worldBrowseRequest?.id){
    worldBrowseResponse={key:worldBrowseRequest.key,data:message.result};
    window.__WTW_NEXT__?.paint?.();
   }
   if(message.type==='error'){
    // Real error is never presented as a false empty population.
    console.warn('World roster worker fallback:',message.message||'unavailable');
    fallbackWorldBrowse();
   }
  };
  worker.onerror=()=>fallbackWorldBrowse();
  worldBrowseWorker=worker;
  return worker;
 }catch(error){worldBrowseWorkerUnavailable=true;return null}
}
function workerWorldBrowse(query){
 const worker=getWorldBrowseWorker();
 if(!worker)return null;
 const key=JSON.stringify(query);
 if(worldBrowseResponse?.key===key)return worldBrowseResponse.data;
 if(worldBrowseRequest?.key!==key){
  const id=++worldBrowseSerial;
  worldBrowseRequest={id,key};worldBrowseResponse=null;
  try{worker.postMessage({type:'browse',requestId:id,query})}
  catch{fallbackWorldBrowse();return null}
 }
 return {total:worldCounts.worldHorses||worldCounts.horses,indexing:true,items:[],
  progress:worldBrowseProgress,loaded:worldBrowseProgress,
  worldWorker:true,progressTotal:worldBrowseProgressTotal};
}

const globalHorseSummaries=[];
let globalHorseComplete=false,globalHorseStarted=false,globalHorseProgress=0;
let globalHorseCacheKey='',globalHorseCache=[];
const knownWorldHorseTraits=new Set(Object.values(attributeCatalog.horse_categories).flat().map(d=>d.key));
const globalHorseTraitScores=new Map();
function scanWorldHorseTrait(key){
 const job=globalHorseTraitScores.get(key);
 if(!job||job.complete)return;
 const page=q('/api/1999/sim/world-horse-attribute',
  'key='+encodeURIComponent(key)+'&offset='+job.progress+'&limit=100');
 for(const entry of page.items||[])job.scores[entry.index]=entry.value;
 job.progress+=(page.items||[]).length;
 if(!page.items?.length||job.progress>=(worldCounts.worldHorses||(worldCounts.worldHorses||worldCounts.horses))){
  job.complete=true;globalHorseCacheKey='';
  return window.__WTW_NEXT__?.paint?.();
 }
 if(job.progress%5000===0)window.__WTW_NEXT__?.paint?.();
 setTimeout(()=>scanWorldHorseTrait(key),0);
}
function worldTraitProjection(key){
 if(!knownWorldHorseTraits.has(key))return null;
 let job=globalHorseTraitScores.get(key);
 if(!job){
  // Project only the selected trait, not 53 attributes for each horse.
  if(globalHorseTraitScores.size>=4)globalHorseTraitScores.delete(globalHorseTraitScores.keys().next().value);
  job={progress:0,complete:false,scores:new Array(worldCounts.worldHorses||(worldCounts.worldHorses||worldCounts.horses))};
  globalHorseTraitScores.set(key,job);
  setTimeout(()=>scanWorldHorseTrait(key),0);
 }
 return job;
}
function scanGlobalHorseIndex(){
 const offset=globalHorseProgress;
 const page=q('/api/1999/sim/world-horse-directory','offset='+offset+'&limit=100');
 if(!page.items?.length){globalHorseComplete=true;return window.__WTW_NEXT__?.paint?.()}
 globalHorseSummaries.push(...page.items);
 globalHorseProgress=globalHorseSummaries.length;
 if(globalHorseProgress>=(worldCounts.worldHorses||(worldCounts.worldHorses||worldCounts.horses))){
  globalHorseComplete=true;
  window.__WTW_NEXT__?.paint?.();
  return;
 }
 if(globalHorseProgress%5000===0)window.__WTW_NEXT__?.paint?.();
 setTimeout(scanGlobalHorseIndex,0);
}
function worldHorseBrowse({offset=0,limit=160,search='',sort='name',desc=false,filters={},attributeKey=''}={}){
 const worker=workerWorldBrowse({offset,limit,search,sort,desc,filters,attributeKey});
 if(worker)return worker;
 if(!globalHorseStarted){
  globalHorseStarted=true;
  setTimeout(scanGlobalHorseIndex,0);
 }
 if(!globalHorseComplete)return {total:(worldCounts.worldHorses||worldCounts.horses),loaded:globalHorseProgress,
  indexing:true,items:[],progress:globalHorseProgress};
 const selectedTrait=knownWorldHorseTraits.has(attributeKey)?attributeKey:'';
 const attributeJob=selectedTrait?worldTraitProjection(selectedTrait):null;
 if(attributeJob&&!attributeJob.complete)return {total:(worldCounts.worldHorses||worldCounts.horses),
  indexing:true,attributeIndexing:true,items:[],progress:attributeJob.progress};
 if(!universeLabels){
  const owners=get('world-owners','/api/1999/sim/owners',worldCounts.owners);
  const trainers=get('world-trainers','/api/1999/sim/trainers',worldCounts.trainers);
  universeLabels={owners:new Map(owners.map(o=>[o.id,o.name])),
   trainers:new Map(trainers.map(p=>[p.id,p.name]))};
 }
 const trackLabels=new Map(activeRacecourses.map(t=>[t.id,t.name]));
 const text=v=>String(v??'').replaceAll('_',' ').toLowerCase().trim();
 const ageMin=filters.ageMin===''||filters.ageMin==null?null:Number(filters.ageMin);
 const ageMax=filters.ageMax===''||filters.ageMax==null?null:Number(filters.ageMax);
 const key=JSON.stringify([search,sort,desc,filters,selectedTrait]);
 if(key!==globalHorseCacheKey){
  const needle=text(search),filterValue=text(filters.query);
  globalHorseCache=globalHorseSummaries.map(h=>({
   ...(selectedTrait?{['attr:'+selectedTrait]:attributeJob.scores[h.index]}:{}),
   ...h,owner:universeLabels.owners.get(h.ownerId)||ownerNames.get(h.ownerId)||h.ownerId||'',
   breeder:universeLabels.owners.get(h.breederId)||ownerNames.get(h.breederId)||h.breederId||'',
   trainer:universeLabels.trainers.get(h.trainerId)||peopleNames.get(h.trainerId)||h.trainerId||'',
   track:trackLabels.get(h.trackId)||h.trackId||'',status:h.status||''
  })).filter(h=>{
   if(needle&&!['name','id','owner','breeder','trainer','track','sire','dam','status']
    .some(k=>text(h[k]).includes(needle)))return false;
   if(ageMin!==null&&(h.age==null||h.age<ageMin))return false;
   if(ageMax!==null&&(h.age==null||h.age>ageMax))return false;
   if(filters.sex&&text(h.sex)!==text(filters.sex))return false;
   if(filters.status&&!text(h.status).includes(text(filters.status)))return false;
   if(filters.field&&filters.query&&!text(h[filters.field]).includes(filterValue))return false;
   return true;
  });
  const sortKey=sort==='attr:'+selectedTrait&&selectedTrait?sort:
   ['name','age','sex','sire','dam','owner','breeder','homebred','trainer','track','status','registryGroup','ca','pa'].includes(sort)?sort:'name';
  const sign=desc?-1:1;
  globalHorseCache.sort((a,b)=>{
   const av=a[sortKey],bv=b[sortKey];
   if(av==null)return bv==null?0:1;
   if(bv==null)return -1;
   const cmp=typeof av==='number'&&typeof bv==='number'?av-bv:
     String(av).localeCompare(String(bv),undefined,{numeric:true,sensitivity:'base'});
   return sign*cmp||a.index-b.index;
  });
  globalHorseCacheKey=key;
 }
 const total=globalHorseCache.length;
 const items=globalHorseCache.slice(Math.max(0,offset),Math.max(0,offset)+Math.min((worldCounts.worldHorses||worldCounts.horses),Math.max(1,limit)))
  .map(h=>({_directoryIndex:h.index,_kind:'horse',_name:h.name,_id:h.id,
   _canonId:h.canonical?h.id:'',_worldKey:h.canonical?'horse:'+h.id:undefined,
   _testGenerated:!h.canonical,name:h.name,age:String(h.age),sex:h.sex,
   sire:h.sire,dam:h.dam,owner:h.owner,breeder:h.breeder,
   homebred:h.homebred?'YES':'NO',trainer:h.trainer,track:h.track,
   status:String(h.status).replaceAll('_',' '),registryGroup:String(h.registryGroup||'REGISTERED').replaceAll('_',' '),ca:String(h.ca??''),pa:String(h.pa??''),
   ...(selectedTrait?{['attr:'+selectedTrait]:h['attr:'+selectedTrait]}:{})}));
 return {total,loaded:(worldCounts.worldHorses||worldCounts.horses),indexing:false,items,progress:globalHorseProgress};
}
const breedingMareByModelIndex=index=>{
 const sourceCount=get('mares','/api/1999/broodmare-boarding',2036).length;
 return breedingMarePage(sourceCount+Number(index),1).items?.[0]||null;
};
function worldHorsePage(offset=0,limit=20,filter=''){
 if(!universeLabels){
  const owners=get('world-owners','/api/1999/sim/owners',3308);
  const trainers=get('world-trainers','/api/1999/sim/trainers',4200);
  universeLabels={owners:new Map(owners.map(o=>[o.id,o.name])),trainers:new Map(trainers.map(t=>[t.id,t.name]))};
 }
 const start=Math.max(0,Math.min((worldCounts.worldHorses||worldCounts.horses)-1,Number(offset)||0));
 const count=Math.max(1,Math.min(100,Number(limit)||20,
   (worldCounts.worldHorses||worldCounts.horses)-start));
 const data={total:worldCounts.worldHorses,items:Array.from({length:count},(_,n)=>
  q('/api/1999/sim/world-horse-profile','index='+(start+n)).horse)};
 const sourceIds=new Set(srcHorses.map(h=>h.id));
 const rows=(data.items||[]).map((h,rowOffset)=>{
  const source=sourceIds.has(h.id)||gameWorldProfile.mode==='FOUNDING_1999';
  const sireName=source?srcHorses.find(p=>p.id===h.sireId)?.name:null;
  const damName=source?srcHorses.find(p=>p.id===h.damId)?.name:null;
  return {_kind:'horse',_name:h.name,_directoryIndex:start+rowOffset,registryGroup:h.registryGroup||'',_canonId:source?h.id:'',
   _worldKey:source?'horse:'+h.id:undefined,_testGenerated:!source,
   _testAttrs:h.attributes||{},_testCareer:h.career||{},_testFinances:h.finances||{},_testReputation:h.reputation||{},
   _testAbility:h.ability||null,ca:String(h.ability?.currentStars??''),pa:String(h.ability?.potentialStars??''),
   racingStatus1999:h.racingStatus1999||h.racingStatus||'SOURCE_STATUS_NOT_VERIFIED',
   _testRelationships:h.relationships||{},_preferredJockeyId:h.preferredJockeyId||'',
   _openingCondition:h.openingCondition||null,
    foalYear:h.foalYear,dateOfBirth:h.dateOfBirth||'',foalingGeography:h.foalingGeography||h.foalingLocation||h.foalingPlace||null,
   ownerId:h.ownerId||'',trainerId:h.trainerId||'',
   breederId:h.breederId||'',breeder:h.breeder||h.breederName||universeLabels.owners.get(h.breederId)||'',
   breedingFarmId:h.breedingFarmId||'',breedingFarm:h.breedingFarm||'',homebred:h.homebred===true,
   name:h.name,age:String(h.ageAtDate??h.ageAtOpening??1999-Number(h.foalYear)),sex:h.sex,
   sire:sireName||h.sireId||'',dam:damName||h.damId||'',
   owner:universeLabels.owners.get(h.ownerId)||ownerNames.get(h.ownerId)||h.ownerId||'',
   trainer:universeLabels.trainers.get(h.trainerId)||peopleNames.get(h.trainerId)||h.trainerId||'',
   track:source?h.openingStable?.name||'':h.stableTrackId,
   status:source?String(h.racingStatus1999||h.racingStatus||h.status||'SOURCE STATUS NOT VERIFIED').replaceAll('_',' '):
    String(h.racingStatus1999||h.breedingStatus1999||h.status||'GENERATED TEST · NO ENTRY/RESULT').replaceAll('_',' '),_id:h.id,
   location:city(h.location||h.openingStable)||''};
 });
 const needle=String(filter||'').trim().toLowerCase();
 return {total:data.total,items:needle?rows.filter(row=>
  [row.name,row._id,row.owner,row.trainer,row.sire,row.dam,row.track].some(value=>String(value||'').toLowerCase().includes(needle))):rows,
  isPageFilter:Boolean(needle),pageStart:start};
}
const worldHorseById=id=>{
 if(!/^H-[A-Za-z0-9-]+$/.test(String(id||'')))return null;
 try{
  const found=q('/api/1999/sim/world-horse-profile','id='+encodeURIComponent(id));
  return found?.index>=0?worldHorsePage(found.index,1).items?.[0]||null:null;
 }catch{return null}
};
const activeRacecourses=get('1999-active-tracks','/api/1999/sim/tracks',worldCounts.tracks);
const activeTrackIds=new Set(activeRacecourses.map(t=>t.id));
const activeTrackNames=new Set(activeRacecourses.map(t=>t.name));
const sourceStakes=get('1999-source-stakes','/api/1999/calendar',93);
const allStakes1999=[...sourceStakes,...WTW_ALTERNATE_STAKES_1999,...WTW_REGIONAL_STAKES_1999]
 .filter(r=>activeTrackIds.has(r.trackId)||activeTrackNames.has(r.trackName));
// Browsable 1999 day cards: read the ONE deterministic condition-book generator.
 // No live results, horses entered, or official race-card fixtures are inferred.
 const racingTrackIndexByName=new Map(activeRacecourses.map((t,i)=>[t.name,i]));
 const racingCardCache=new Map();
 const validCalendarDate=date=>/^1999-\d{2}-\d{2}$/.test(String(date||''))&&
  !Number.isNaN(Date.parse(date+'T12:00:00Z'))&&
  new Date(date+'T12:00:00Z').toISOString().slice(0,10)===date;
 function racingDaySummary(date,trackName=''){
  if(!validCalendarDate(date))return {date,trackCount:0,plannedStakes:0};
  const eligible=activeRacecourses.filter(t=>(!trackName||t.name===trackName)&&trackMeetOpen1999(t.id,date));
  const ids=new Set(eligible.map(t=>t.id)),names=new Set(eligible.map(t=>t.name));
  return {date,trackCount:eligible.length,
   plannedStakes:allStakes1999.filter(r=>r.localDate===date&&(ids.has(r.trackId)||names.has(r.trackName))).length};
 }
 function racingDayCards(date,trackName=''){
  if(!validCalendarDate(date))return [];
  const key=date+'|'+trackName;
  if(racingCardCache.has(key))return racingCardCache.get(key);
  const records=[];
  const chosen=trackName?racingTrackIndexByName.get(trackName):null;
  const indices=trackName?(chosen===undefined?[]:[chosen]):activeRacecourses.map((_,i)=>i);
  for(const index of indices){
   const t=activeRacecourses[index];
   if(!trackMeetOpen1999(t.id,date))continue;
   const conditions=readLocal1999World('/api/1999/sim/conditions?'+worldQuery+'&date='+
     encodeURIComponent(date)+'&trackIndex='+index);
   for(const race of conditions.races||[]){
   const feature=Boolean(race.stakeId);
   records.push({_kind:'race',_name:race.name||'Race '+race.number,_track:t.name,_iso:date,_raceId:race.id,_raceData:race,
    _stakeId:race.stakeId||null,date,track:t.name,
    race:feature?'R'+race.number+' · '+race.stakeName:'R'+race.number,
    number:race.number,class:feature?'STAKES · '+race.stakesGrade:(race.conditions||'MODELED'),
    surface:race.surface||'',distance:Number(race.distanceFurlongs)+'f',
    purse:money(race.purse),
    status:feature?'PLANNED STAKES · NOT RUN':'CONDITION BOOK · PROPOSED',
    _cardOrder:race.number});
  }
 }
  records.sort((a,b)=>a.track.localeCompare(b.track)||a._cardOrder-b._cardOrder||a.race.localeCompare(b.race));
  if(racingCardCache.size>=16)racingCardCache.delete(racingCardCache.keys().next().value);
  racingCardCache.set(key,records);
  return records;
 }

const stakesForTrack=name=>allStakes1999.filter(r=>r.trackName===name);
const findStake=id=>allStakes1999.find(r=>r.id===id)||null;
const findRace=id=>{
 const stake=findStake(id);if(stake)return stake;
 const test=/^R-TEST-1999-(\d{8})-(\d{3})-(\d{2})$/.exec(String(id||''));
 if(!test)return null;
 const ymd=test[1],date=ymd.slice(0,4)+'-'+ymd.slice(4,6)+'-'+ymd.slice(6);
 const trackIndex=Number(test[2])-1;
 if(trackIndex<0||trackIndex>=worldCounts.tracks)return null;
 return q('/api/1999/sim/conditions','date='+encodeURIComponent(date)+'&trackIndex='+trackIndex)
  .races?.find(r=>r.id===id)||null;
};
// Rehydrate a generated 1999 PERSON by its established test person ID, not
// by a possibly duplicated display name. Read only; no new people created.
function personProfileById(id){
 if(typeof id!=='string'||!id)return null;
 for(const page of ['Trainers','Jockeys','Staff']){
  const exact=departmentRows('Personnel',page).find(p=>p._id===id);
  if(exact)return exact;
 }
 return null;
}
const ownedHorses=()=>stableHorses;
const horseAttributeGroups=Object.entries(attributeCatalog.horse_categories).map(([name,defs])=>({
 name,definitions:defs.map(d=>({key:d.key,label:d.label,scope:d.scope}))
}));
const stableHorseAttributes=name=>horseLookup.get(name)?.attributes||null;
const stableHorseCareer=name=>horseLookup.get(name)?.career||null;
const breederProfile=id=>{
 if(!id)return null;
 return get('breeder-owners','/api/1999/sim/owners',worldCounts.owners).find(o=>o.id===id)||null;
};
const foalingFarmProfile=id=>{
 const n=/^F-TEST-FARM-(\d+)$/.exec(String(id||''));
 if(!n||Number(n[1])<1||Number(n[1])>900)return null;
 return q('/api/1999/sim/facilities','offset='+(worldCounts.trainers+Number(n[1])-1)+'&limit=1').items?.[0]||null;
};
function extraTracks(){
 const ts=activeRacecourses;
 return ts.map(t=>{
  const p=trackProgram1999(t.id);
  return {...t,location:city(t.location),region:t.location?.state||'',country:t.location?.country||'',
   operating:p?.trackOperating||'1999_SCHEDULE_UNVERIFIED',racingStatus:p?.basis||'TEST',
   surfaces:p?.surfaces||'Not certified',meetWindow:p?.meetWindow||'',raceDays:p?.raceDays||'—',
   preferredDays:p?.preferredDays||'',calendarBasis:p?.basis||'NOT_VERIFIED',
   calendarSource:p?.sourceUrl||'',surfaceStatus:p?.surfaceStatus||'NOT_VERIFIED',
   _source1999:!p,stakes:[]};
 });
}
// Source identities are exact; generated ratings remain explicitly TEST-only.
const sourceHorseModelCache=new Map(),sourcePersonModelCache=new Map();
const sourcePersonOffset=new Map(srcPeople.map((p,index)=>[p.id,index]));
const sourceHorseModel=id=>{
 const index=sourceHorseOffset.get(id);
 if(index===undefined)return null;
 if(!sourceHorseModelCache.has(id)){
  const row=q('/api/1999/sim/horses','offset='+index+'&limit=1').items?.[0]||null;
  sourceHorseModelCache.set(id,row?.id===id?row:null);
 }
 return sourceHorseModelCache.get(id);
};
const sourcePersonModel=id=>{
 const index=sourcePersonOffset.get(id);
 if(index===undefined)return null;
 if(!sourcePersonModelCache.has(id)){
  const row=q('/api/1999/sim/source-people','offset='+index+'&limit=1').items?.[0]||null;
  sourcePersonModelCache.set(id,row?.id===id?row:null);
 }
 return sourcePersonModelCache.get(id);
};
window.__WTW_1999_UI_DATA__={
 schema:'WTW_1999_CANON_ANCHORED_UI_ADAPTER_V1',
 sourceOwnerId:activeOwnerId,sourceOwnerName:selectedOwner,stableHorses:roster(),
  generatedStaffRoles:['trainer','jockey','farm_manager','veterinarian','farrier','bloodstock_agent','racing_secretary'],
 ownedHorseCount,
 sourceFacts,ownerFor,stableHorsePreview,personProfileById,setGameDate,departmentRows,auctionList,extraTracks,
 TRAINING_PLANS,horseTraining,assignTraining,trainingCosts,
 officeMessages,officeDesks,openingCash,worldHorsePage,worldHorseById,worldHorseBrowse,breedingMarePage,breedingMareBrowse,breedingMareByModelIndex,
 horseAttributeGroups,stableHorseAttributes,stableHorseCareer,
 stakesForTrack,findStake,findRace,racingDayCards,racingDaySummary,ownedHorses,breederProfile,foalingFarmProfile,trackProgramById:trackProgram1999,
 sourceHorseModel,sourceHorseAbility:id=>sourceHorseModel(id)?.ability||null,
 sourcePersonModel,
 counts:q('/api/1999/sim/overview').counts,
 bridgeStatus:'SOURCE_IDS_LOCKED; OTHER VALUES_MARKED_TEST; NO_1999_OUTCOME_COMMITTED'
};
if(window.__WTW_NEXT__?.app)window.__WTW_NEXT__.app.activeCase='opening-stable';
window.__WTW_NEXT__?.paint?.();
