/* 1999 SOURCE DATA ADAPTER FOR EXISTING PREMIUM MANAGEMENT UI.
 * Adds no HTML screens, CSS, alternate game state, or fictional race results.
 * Reuses the same browser 1999 world projection as the diagnostic test lab.
 * All generated values are TEST state, canonical values retain source authority.
 */
import {readLocal1999World} from '/1999/engine/local-api.mjs';
const q=(route,extras='')=>readLocal1999World(route+(route.includes('?')?'&':'?')+'seed=19990101&mode=CANON_ANCHORED_TEST'+(extras?'&'+extras:''));
const allPages=(route,total)=>{const rows=[];for(let offset=0;offset<total;offset+=100){const page=q(route,'offset='+offset+'&limit=100');rows.push(...(page.items||[]));}return rows;};
const srcHorses=allPages('/api/1999/horses',267);
const srcOrgs=allPages('/api/1999/organizations',108);
const srcPeople=allPages('/api/1999/people',154);
const activeStallions=q('/api/1999/stallions').active;
const ownerNames=new Map(srcOrgs.map(o=>[o.id,o.name]));
const peopleNames=new Map(srcPeople.map(p=>[p.id,p.name]));
const horseLookup=new Map(srcHorses.map(h=>[h.name,h]));
const ownership=new Map();for(const h of srcHorses){ownership.set(h.ownerId,(ownership.get(h.ownerId)||0)+1);}
const activeOwnerId=[...ownership].filter(([id])=>id).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]?.[0]||null;
const stableHorses=srcHorses.filter(h=>h.ownerId===activeOwnerId && h.foalYear<=1997).slice(0,24);
const selectedOwner=ownerNames.get(activeOwnerId)||activeOwnerId||'1999 Foundation Stable';

const ownerIndex=srcOrgs.findIndex(o=>o.id===activeOwnerId);
const initialOwner=q('/api/1999/sim/owners','offset='+Math.max(0,ownerIndex)+'&limit=1').items?.[0]||null;
const openingCash=initialOwner?.finances?.cash??null;
const messageSpecs=[
 ['opening-stable','Stable Office','1999 opening roster: '+selectedOwner,
  'Source-locked horses · ownership and barns',true,'Stable'],
 ['opening-stakes','Racing Secretary','1999 stakes calendar: 93 scheduled events',
  'No entries or results recorded',true,'Racing'],
 ['opening-breeding','Breeding Office','31 stallions and 2,036 mare boarding files',
  'Source records, not declared matings',false,'Breeding'],
 ['opening-market','Sales Desk','36 generated sale dates to test',
  'Auction transactions have NOT occurred',false,'Sales'],
 ['opening-finance','Accounting','Opening cash and budgets are TEST valuations',
  'No accounting transactions have posted',true,'Finances'],
 ['opening-tracks','Track Operations','134 racecourses available for test planning',
  'Operating conditions and meet dates remain test data',false,'Tracks'],
 ['opening-people','Personnel Office','4,200 trainers in the test economy',
  'Only known people identities are source-locked',false,'Personnel'],
 ['opening-universe','World Registrar','87,500-horse 1999 universe loaded',
  '267 source-locked opening runners, remainder test-generated',false,'World']
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
 return {age:String(h.ageAtOpening||1999-Number(h.foalYear)),sex:h.sex||'',
  connections:{trainer:peopleNames.get(h.trainerId)||'',owner:ownerNames.get(h.ownerId)||'',breeder:''},
  name:h.name,source:'1999_CANON_LOCKED',
  racing_status:h.racingStatus||'',current_base:h.openingStable?.locality||'',
  sire_id:h.sireId,dam_id:h.damId};
}
const ownerFor=name=>{const h=horseLookup.get(name);return h?ownerNames.get(h.ownerId)||h.ownerId||'':null;};
function roster(){return stableHorses.map((h,i)=>({name:h.name,activity:h.trainingStatus||'CURRENT CONDITION NOT OBSERVED',
 tag:h.sex+' · '+(1999-Number(h.foalYear))+'YO',index:i+1,horseId:h.id}));}
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
   const stakes=get('stakes','/api/1999/calendar',93);
   return stakes.filter(r=>r.localDate>=date).map(r=>({
    _kind:'race',_name:r.name,_track:r.trackName,_iso:r.localDate,
    date:r.localDate,track:r.trackName,race:r.name,
    class:r.status||r.division||'STAKES',surface:r.surface||'',
    distance:r.distanceF?String(r.distanceF)+'f':'',
    purse:r.purse1999?money(r.purse1999):'',horse:'',base:'',ship:'',
    jockey:'',trainer:'',ready:'',status:'1999 CANON SCHEDULE · NOT ENTERED'}));
  }
  if(page==='Race Planning'){
   const tracks=get('racing-tracks','/api/1999/sim/tracks',134);
   const rows=[];
   for(let i=0;i<tracks.length;i++){
    const card=q('/api/1999/sim/conditions','date='+encodeURIComponent(date)+'&trackIndex='+i);
    for(const r of card.races||[])rows.push({
     _kind:'race',_name:r.id,_track:r.trackName,_iso:r.date,
     date:r.date,track:r.trackName,race:'R'+r.number,class:r.conditions,
     surface:r.surface,distance:String(r.distanceFurlongs)+'f',
     purse:money(r.purse),horse:'',base:'',ship:'',jockey:'',trainer:'',
     ready:'',status:'TEST CONDITION BOOK · NOT ENTERED'});
   }
   return rows;
  }
 }
 if(section==='Breeding'&&page==='Stallions'){
  return activeStallions.map(h=>({_kind:'horse',_name:h.name,_canonId:h.id,name:h.name,horse:h.name,
   age:String(1999-Number(h.firstBreedingSeason)),sex:'STALLION',sire:'',dam:'',
   farm:h.standingFarm1999?.farmName||'',status:'STANDING 1999 · SOURCE',health:'UNASSESSED',pedigree:'',
   value:'',owner:'',studFee:'NOT ESTABLISHED',bookings:'',foals:'',winners:''}));
 }
 if(section==='Breeding'&&page==='Broodmares'){
  const x=get('mares','/api/1999/broodmare-boarding',2036);
  return x.map(h=>({_kind:'horse',_name:h.name,_canonId:h.id,name:h.name,horse:h.name,
   age:String(1999-Number(h.foalYear)),sex:h.sex,sire:h.sireId||'',dam:h.damId||'',
   farm:h.boardingFarm1999?.farmName||'',owner:'',status:'BOARDING · NO PREGNANCY ASSUMED',
   health:'UNASSESSED',pedigree:'',value:'',studFee:'',bookings:'',foals:'',winners:''}));
 }
 if(section==='Personnel'&&page==='Ownership Groups'){
  return get('owners','/api/1999/sim/owners',3308).map(o=>({_kind:'farm',_name:o.name,name:o.name,
   type:o.type,location:city(o.location),principal:'',status:'TEST · '+o.portfolio?.tier,
   _canonId:o.authority?.startsWith('CANON')?o.id:''}));
 }
 if(section==='Personnel'){
  const roles={Trainers:'trainer',Jockeys:'jockey',Owners:'owner',Staff:'staff'};
  const wanted=roles[page]||'all';
  const base=page==='Trainers'?get('trainers','/api/1999/sim/trainers',4200):
   page==='Owners'?srcPeople.filter(p=>/owner|patron/i.test(p.role||'')):
   page==='Jockeys'||page==='Staff'||page==='Overview'?get('workforce','/api/1999/sim/people',17194):[];
  return base.filter(p=>wanted==='all'?true:wanted==='staff'?!['trainer','jockey'].includes(p.role):wanted==='owner'?/owner|patron/i.test(p.role||''):p.role===wanted).map(p=>({
   _kind:'person',_name:p.name,name:p.name,age:p.age||'',role:p.role||'',reputation:rep(p.reputation),
   ca:'',pa:'',specialty:'',morale:'',workload:'',salary:money(p.payrollAnnual||p.annualBaseSalary),
   contract:'',assignment:p.barnId||'',base:city(p.location||p.base),wins:'',_testOrigin:!srcPeople.some(source=>source.id===p.id)}));
 }
 if(section==='Facilities'){
  const names={'Stud Farms':'BREEDING_FARM','Training Centers':'TRAINING_CENTER',
   'Breaking Facilities':'BREAKING_FACILITY','Racing Stables':'RACE_BARN','Barns':'RACE_BARN'};
  const filtered=get('facilities','/api/1999/sim/facilities',5234).filter(f=>{
   if(page==='Farms')return f.type==='BREEDING_FARM';
   if(!names[page])return true;return f.type===names[page];});
  return filtered.map(f=>({_kind:'farm',_name:f.name,name:f.name,type:f.type.replaceAll('_',' '),
   location:city(f.location),capacity:String(f.capacity),occupied:String(f.occupied),
   free:String(f.capacity-f.occupied),condition:f.equipmentCondition||'',quality:'',
   staff:String(f.staffingRequirement||''),cost:money(f.annualOperatingCost),owner:f.trainerId||'',
   status:'1999 TEST FACILITY',_testOrigin:true}));
 }
 if(section==='Finances'){
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
function departmentRows(section,page,context={}){
 const key=section+'|'+page+(section==='Racing'?'|'+(context.date||'1999-01-01')+'|'+(context.racingMode||'meets'):'');
 if(departmentCache.has(key))return departmentCache.get(key);
 const rows=makeDepartmentRows(section,page,context);
 if(Array.isArray(rows))departmentCache.set(key,rows);
 return rows;
}
let universeLabels=null;
function worldHorsePage(offset=0,limit=20,filter=''){
 if(!universeLabels){
  const owners=get('world-owners','/api/1999/sim/owners',3308);
  const trainers=get('world-trainers','/api/1999/sim/trainers',4200);
  universeLabels={owners:new Map(owners.map(o=>[o.id,o.name])),trainers:new Map(trainers.map(t=>[t.id,t.name]))};
 }
 const start=Math.max(0,Math.min(87499,Number(offset)||0)),count=Math.max(1,Math.min(100,Number(limit)||20));
 const data=q('/api/1999/sim/horses','offset='+start+'&limit='+count);
 const sourceIds=new Set(srcHorses.map(h=>h.id));
 const rows=(data.items||[]).map(h=>{
  const source=sourceIds.has(h.id);
  const sireName=source?srcHorses.find(p=>p.id===h.sireId)?.name:null;
  const damName=source?srcHorses.find(p=>p.id===h.damId)?.name:null;
  return {_kind:'horse',_name:h.name,_canonId:source?h.id:'',
   _worldKey:source?'horse:'+h.id:undefined,_testGenerated:!source,
   _testAttrs:h.attributes||{},_testFinances:h.finances||{},_testReputation:h.reputation||{},
   name:h.name,age:String(h.ageAtOpening||1999-Number(h.foalYear)),sex:h.sex,
   sire:sireName||h.sireId||'',dam:damName||h.damId||'',
   owner:universeLabels.owners.get(h.ownerId)||ownerNames.get(h.ownerId)||h.ownerId||'',
   trainer:universeLabels.trainers.get(h.trainerId)||peopleNames.get(h.trainerId)||h.trainerId||'',
   track:source?h.openingStable?.name||'':h.stableTrackId,
   status:source?h.racingStatus||'SOURCE OPENING':
    'GENERATED TEST · NO ENTRY/RESULT',_id:h.id,
   location:city(h.location||h.openingStable)||''};
 });
 const needle=String(filter||'').trim().toLowerCase();
 return {total:data.total,items:needle?rows.filter(row=>
  [row.name,row._id,row.owner,row.trainer,row.sire,row.dam,row.track].some(value=>String(value||'').toLowerCase().includes(needle))):rows,
  isPageFilter:Boolean(needle),pageStart:start};
}
function extraTracks(){
 const ts=get('tracks','/api/1999/sim/tracks',134);
 return ts.map(t=>({...t,location:city(t.location),region:t.location?.state||'',country:t.location?.country||'',
    operating:'TEST_1999_MEET_STATUS_UNVERIFIED',racingStatus:'TEST',_source1999:true,
    meetWindow:'1999 test meet rules',raceDays:'SCHEDULE_DEPENDENT',preferredDays:'',stakes:[]}));
}
window.__WTW_1999_UI_DATA__={
 schema:'WTW_1999_CANON_ANCHORED_UI_ADAPTER_V1',
 sourceOwnerId:activeOwnerId,sourceOwnerName:selectedOwner,stableHorses:roster(),
 sourceFacts,ownerFor,departmentRows,auctionList,extraTracks,
 officeMessages,officeDesks,openingCash,worldHorsePage,
 counts:q('/api/1999/sim/overview').counts,
 bridgeStatus:'SOURCE_IDS_LOCKED; OTHER VALUES_MARKED_TEST; NO_1999_OUTCOME_COMMITTED'
};
if(window.__WTW_NEXT__?.app)window.__WTW_NEXT__.app.activeCase='opening-stable';
window.__WTW_NEXT__?.paint?.();
