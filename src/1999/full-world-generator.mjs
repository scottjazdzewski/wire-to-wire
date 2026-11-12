/**
 * WTW 1999 V1 full-scale, deterministic TEST population. This is a game model,
 * not a historic-data exporter or a second canonical archive.
 * Canon-anchored mode locks every sourced name, ID and inherited connection;
 * only unregistered TEST names may later be refreshed by the naming engine.
 * All entities have a stable ID, human name, physical geography, operational
 * capacity, reputation and applicable catalog attributes on demand.
 */
import {openingWorld1999 as canon} from './opening-world.v1.mjs';
import attributeCatalog from '../../public/assets/game/attribute-catalog.v1.json' with {type:'json'};
import {WTW_TEST_START_DATE} from './test-clock.mjs';
export const FULL_WORLD_SCHEMA='WTW_1999_FULL_SCALE_TEST_V1';
export const HORSE_POPULATION=87500;
export const MODES=['CANON_ANCHORED_TEST','FULLY_FICTIONAL_TEST'];
const A=['Quiet','Silver','Cross','High','Small','Golden','West','Blue','North','Grand','River','Long','Fine','Little','Black','Red','White','Early','Late','Open','Second','True','Bold','Bright','Old','Wild','Brave','Fair','Deep','Steady','Autumn','Winter','Summer','Spring','First','Last','Hidden','Clear','Royal','Southern','Eastern','Western','Broken','Sweet','Dark','Plain','Soft','Strong','Lucky','Amber','Coastal','Morning','Evening','Bluebird','Overland','Free','Willow','Maple','Copper','Northern','Harbor','Stone'];
const B=['Road','Window','River','Harbor','Sunday','Market','Garden','Coast','Day','Night','Friend','Mountain','Valley','Song','Hope','Memory','Light','Thunder','Stone','Hill','Crown','Map','Letter','Gold','Silver','Rain','Wind','Paper','Town','Home','Glass','Gate','Watch','Train','Seventh','Riddle','Field','Cloud','Sky','Moon','Sun','Lark','Chance','Grace','Whisper','Bell','Drift','Fire','Autumn','Pocket','April','June','Mabel','Ruth','Clara','Doyle','Fitch','Carson','Mercer','Kettle'];
const C=['Again','Ahead','Today','Tomorrow','Morning','Tonight','Somewhere','Way','Reply','Ticket','Story','Time','Road','Mark','Rose','Light','Harbor','Echo','Day','Night','Dawn','Parade','Letter','Promise','Reason','Habit','Idea','Home','Song','Breeze','Measure','Ledger','Signal','Sunrise','Chance','Question','Crown','Rider','Course','Country','Money','Sunday','Quietly','Early','Forever','Later','North','West','East','South'];
const GIVEN=['James','Anne','Robert','Maria','Charles','Elizabeth','Thomas','Daniel','Helen','Frank','Joseph','Ellen','Catherine','Ruth','Richard','Louise','Henry','Walter','Arthur','Sarah','David','Harold','Carolyn','George','Patrick','Albert','Nora','William','Martha','Edith','Eugene','Paul','Andrew','Lydia','Francis','Irene','Michael','Martin','Katherine','Victor','Rebecca','Peter','John','Susan','Margaret','Louis','Gordon','Claire','Dominic','Raymond','Caroline','Miguel','Nadia','Marianne','Edwin','Christopher','Diane','Samuel','Evelyn','Warren'];
const FAMILY=['Morgan','Bennett','Harlan','Doyle','Whitcomb','Reed','Fletcher','Baxter','Norton','Hayes','Keller','Miller','Sullivan','Carter','Grady','Bishop','Rivers','Palmer','Foster','Quinn','Harrison','Weller','Franklin','Graham','Benton','Mercer','Langley','Donovan','Keene','Holloway','Murphy','Dalton','Crawford','Hawthorne','Parker','Sloan','Conway','Walsh','Beckett','Everett','Rowan','Dawson','Lancaster','Montrose','Sterling','Calhoun','Fitzgerald','Harris','Lowell','Willis','Thatcher','Henderson','Barrett','Simmons','Stanton','Callahan','Powers','Larkin','Davenport','Weston','Bradshaw'];
const OWNER_TERMS=['Racing','Stables','Partnership','Bloodstock','Farms','Thoroughbreds','Racing Club','Farm & Racing','Racing Group','Farm','Racing Partners','Stud & Racing'];
const ROLES=[['trainer',4200],['jockey',1800],['groom',7600],['exercise_rider',1700],['farm_manager',550],['veterinarian',430],['farrier',420],['bloodstock_agent',360],['racing_secretary',134]];
const hor=Object.values(attributeCatalog.horse_categories).flat();
const common=attributeCatalog.person_common;
const roleDef=attributeCatalog.person_roles;
const pad=(n,width=6)=>String(n).padStart(width,'0');
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const money=n=>Math.round(n);
function hash(seed,x){
 let h=(2166136261^(seed>>>0))>>>0;
 for(let i=0;i<String(x).length;i++){h^=String(x).charCodeAt(i);h=Math.imul(h,16777619)}
 h^=h>>>16;h=Math.imul(h,2246822507);h^=h>>>13;
 return h>>>0;
}
const unit=(seed,key)=>hash(seed,key)/4294967296;
const pick=(arr,seed,key)=>arr[Math.floor(unit(seed,key)*arr.length)];
const round=n=>Math.round(n*10000)/10000;
const fmtLoc=x=>({city:x.locality??x.city??null,state:x.region??x.state??null,country:x.country??'USA'});
const sourceTracks=canon.tracks;
function mixName(seed,i){const total=A.length*B.length*C.length,k=(i*71083+seed)%total;
 const a=A[k%A.length],b=B[Math.floor(k/A.length)%B.length],c=C[Math.floor(k/(A.length*B.length))%C.length];
 return a+' '+b+(i%6===0?' '+c:'');}
function makeSlots(count,available,seed,kind){
 const weights=[],min=1;
 for(let i=0;i<count;i++)weights.push(Math.pow(i+10,-.82)*(.83+unit(seed,kind+':weight:'+i)*.34));
 const total=weights.reduce((a,b)=>a+b,0);
 const counts=new Array(count).fill(min),fraction=[];
 let used=count;
 for(let i=0;i<count;i++){const exact=(available-count)*(weights[i]/total);const n=Math.floor(exact);counts[i]+=n;used+=n;fraction.push([exact-n,i]);}
 fraction.sort((a,b)=>b[0]-a[0]||a[1]-b[1]);
 for(let j=0;j<available-used;j++)counts[fraction[j][1]]++;
 const ends=[];let running=0;for(const n of counts){running+=n;ends.push(running);}
 if(running!==available)throw Error('Owner/trainer slots do not equal generated population');
 return {counts,ends,at(slot){let l=0,r=ends.length-1;while(l<r){let m=(l+r)>>1;if(slot<ends[m])r=m;else l=m+1;}return l;}};
}
const gcd=(a,b)=>b?gcd(b,a%b):a;
const perm=(i,total,seed,constant)=>{let mult=constant;while(gcd(mult,total)!==1)mult+=2;return (i*mult+(seed%total))%total;};
function traits(definitions,seed,id,base){
 const out={};
 for(const d of definitions){
  const u=unit(seed,id+':trait:'+d.key),v=clamp(.12+base*.34+u*.54,.01,.99);
  if(d.scope==='latent'||d.scope==='dynamic'||d.scope==='derived')out[d.key]=round(v);
  else if(d.scope==='measured')out[d.key]=d.key.includes('stride_length')?round(5.5+2*v):d.key.includes('stride_frequency')?round(1.5+v):round(v);
  else out[d.key]=d.key.includes('style')?pick(['front','press','stalk','midpack','close'],seed,id+d.key):d.key.includes('distance')?pick(['sprint','mile','route','classic'],seed,id+d.key):d.key.includes('surface')?pick(['dirt','turf','all_weather'],seed,id+d.key):round(v);
 }
 return out;
}
function standing(seed,id,level=0.5){const n=clamp(Math.round(12+level*71+(unit(seed,id+':reputation')-.5)*18),1,99);
 return {overall:n,regional:clamp(n+Math.round((unit(seed,id+'reg')-.5)*17),1,99),national:clamp(Math.round(n*.8),1,99),commercialTrust:clamp(n+Math.round((unit(seed,id+'trust')-.5)*19),1,99),asOf:WTW_TEST_START_DATE,provenance:'GENERATED_TEST_REPUTATION_NOT_HISTORICAL_VERIFIED'};}
export function create1999Universe({seed=19990101,mode=MODES[0]}={}){
 if(!Number.isSafeInteger(seed)||seed<1||!MODES.includes(mode))throw Error('Invalid world seed or mode');
 const anchored=mode===MODES[0],locked=anchored?canon.horses:[],sourcePeople=anchored?canon.people:[],sourceOrgs=anchored?canon.organizations:[];
 const generatedCount=HORSE_POPULATION-locked.length;
 const ownersTotal=3308,trainersTotal=4200,ownersSlots=makeSlots(ownersTotal,generatedCount,seed,'owner'),trainerSlots=makeSlots(trainersTotal,generatedCount,seed,'trainer');
 const trackCache=new Map(),ownerCache=new Map(),trainerCache=new Map(),horseCache=new Map();
 const trackCount=sourceTracks.length,canonicalNames=new Set(locked.map(x=>x.name.toLowerCase()));
 if(trackCount<130)throw Error('Fewer than 130 physical tracks');
 function trackAt(i){
  if(i<0||i>=trackCount)throw Error('Track index out of range');
  if(trackCache.has(i))return trackCache.get(i);
  const base=sourceTracks[i],generatedName=A[i%A.length]+' '+B[Math.floor(i/A.length)%B.length]+' Downs';
  const obj={id:anchored?base.id:'T-TEST-1999-'+pad(i+1,4),name:anchored?base.name:generatedName,
   location:fmtLoc(base),nameStatus:anchored?'CANON_LOCKED':'TEST_RENAME_ALLOWED',surface:unit(seed,'track:'+i)<.2?'TURF':'DIRT',
   reputation:standing(seed,'track:'+i,.4+unit(seed,'track:quality:'+i)*.5),
   facility:{grandstandCapacity:money(3000+unit(seed,'stand:'+i)*40000),barnStalls:0,
    trainingTrack:true,medicalCenter:true,startingGates:2,groundsCondition:round(.55+unit(seed,'ground:'+i)*.4)},
   racing:{racesPerCard:8+Math.floor(unit(seed,'races:'+i)*3),firstPostHour:12+Math.floor(unit(seed,'post:'+i)*4),
    meetStatus:'SCHEDULE_DEPENDENT',annualPurseBudget:money(2000000+unit(seed,'purse:'+i)*24000000)},
   finances:{cash:money(300000+unit(seed,'tcash:'+i)*7500000),annualOperatingBudget:money(700000+unit(seed,'tbgt:'+i)*7000000)},
   sourceTrackId:base.id};
  trackCache.set(i,obj);return obj;
 }
 function ownerAt(i){
  if(i<0||i>=ownersTotal)throw Error('Owner index out of range');
  if(ownerCache.has(i))return ownerCache.get(i);
  const canonSource=anchored&&i<sourceOrgs.length?sourceOrgs[i]:null;
  const id=canonSource?.id||'O-TEST-1999-'+pad(i+1),t=trackAt(hash(seed,'owner:'+id)%trackCount);
  const portfolio=ownersSlots.counts[i],tier=portfolio>=200?'major':portfolio>=40?'established':portfolio>=8?'regional':'small';
  const family=FAMILY[(i+seed)%FAMILY.length],name=canonSource?.name||(family+' '+pick(OWNER_TERMS,seed,id));
  const annualRun=portfolio*money(12000+unit(seed,id+'run')*25000),wealthScale=tier==='major'?12:tier==='established'?5:tier==='regional'?2:1;
  const cash=money(annualRun*(.75+unit(seed,id+'liquidity')*2.5)*wealthScale);
  const obj={id,name,nameStatus:canonSource?'CANON_LOCKED':'TEST_RENAME_ALLOWED',type:canonSource?.type||'RACING_OWNER',
   location:canonSource?.geographyRecords?.[0]?fmtLoc({city:canonSource.geographyRecords[0].locality,state:canonSource.geographyRecords[0].region,country:canonSource.geographyRecords[0].country}):t.location,
   mainTrackId:t.id,portfolio:{generatedHorseSlots:portfolio,sourceHorseCount:0,tier},
   finances:{cash,annualHorseOperatingBudget:annualRun,propertyAndEquineAssets:money(cash*(.6+unit(seed,id+'assets')*3)),debt:money(cash*unit(seed,id+'debt')*.4),
     monthlyFixedOverhead:money(annualRun/12*.2),currency:'USD',basis:'1999_TEST_MODEL_NOT_VERIFIED_CANON_FUNDS'},
   reputation:standing(seed,id,clamp(.2+Math.log1p(portfolio)/Math.log(700)*.7,0,1)),authority:canonSource?'CANON_ID_AND_ORIGIN__TEST_FINANCES':'FULLY_TEST_GENERATED'};
  ownerCache.set(i,obj);return obj;
 }
 function trainerAt(i){
  if(i<0||i>=trainersTotal)throw Error('Trainer index');
  if(trainerCache.has(i))return trainerCache.get(i);
  const canonSource=anchored&&i<sourcePeople.filter(x=>String(x.role).toLowerCase().includes('trainer')).length?sourcePeople.filter(x=>String(x.role).toLowerCase().includes('trainer'))[i]:null;
  const id=canonSource?.id||'P-TEST-TRAINER-'+pad(i+1),track=trackAt(hash(seed,id+':track')%trackCount);
  const slots=trainerSlots.counts[i],name=canonSource?.name||GIVEN[(i+seed)%GIVEN.length]+' '+FAMILY[Math.floor(i/GIVEN.length)%FAMILY.length];
  const obj={id,name,nameStatus:canonSource?'CANON_LOCKED':'TEST_RENAME_ALLOWED',role:'trainer',location:canonSource?.base?fmtLoc(canonSource.base):track.location,
   homeTrackId:track.id,barnId:'F-TEST-BARN-'+pad(i+1),barnCapacity:Math.max(slots+Math.ceil(slots*.12),slots+2),
   generatedRunners:slots,roleAttributes:traits([...common,...(roleDef.trainer||[])],seed,id,.3+unit(seed,id+'talent')*.6),
   reputation:standing(seed,id,.25+unit(seed,id+'status')*.55),annualBaseSalary:money(28000+slots*4000),
   authority:canonSource?'CANON_ID__TEST_ATTRIBUTES':'FULLY_TEST_GENERATED'};
  trainerCache.set(i,obj);return obj;
 }
 const reserved=anchored?new Set(locked.map(x=>x.id)):new Set();
 const generatedId=i=>'H-TEST-1999-'+pad(i+1);
 const sireCount=1400,damCount=26000;
 function parentAt(i,sex){
  const isSire=sex==='SIRE',id='H-TEST-'+sex+'-'+pad(i+1,6),t=trackAt(hash(seed,id+':home')%trackCount);
  return {id,name:mixName(seed+1,isSire?i+100000:i+101500),sex:isSire?'STALLION':'MARE',
   foalYear:isSire?1970+(i%12):1971+(i%13),location:t.location,farmId:'F-TEST-FARM-'+pad(i%900+1),
   reputation:standing(seed,id,.25+unit(seed,id+'rep')*.5),nameStatus:'TEST_RENAME_ALLOWED',
   source:'GENERATED_ANCESTRAL_STOCK'};
 }
 function horseAt(index){
  if(!Number.isInteger(index)||index<0||index>=HORSE_POPULATION)throw Error('Horse index out of range');
  if(horseCache.has(index))return horseCache.get(index);
  if(anchored&&index<locked.length){
   const c=locked[index];const o={...c,location:fmtLoc({city:c.openingStable.locality,state:c.openingStable.region,country:c.openingStable.country}),
    nameStatus:'CANON_LOCKED',reputation:standing(seed,c.id,.4),attributes:traits(hor,seed,c.id,.45),
    attributesProvenance:'SIMULATED_TEST_TRAITS_NOT_HISTORICAL_FACT',
    finances:{estimatedValue:money(5000+unit(seed,c.id+':value')*700000),monthlyCareCost:money(1200+unit(seed,c.id+':cost')*1500)},
    career:c.sourceRecordedStakesSeasons,ownerId:c.ownerId,trainerId:c.trainerId,stableTrackId:c.openingStable.trackId,authority:'LOCKED_NAME_ID_HISTORY_TEST_TRAITS'};
   horseCache.set(index,o);return o;
  }
  const i=anchored?index-locked.length:index,oi=ownersSlots.at(perm(i,generatedCount,seed,65537)),
   ti=trainerSlots.at(perm(i,generatedCount,seed+32,8191)),owner=ownerAt(oi),trainer=trainerAt(ti);
  const id=generatedId(i),k=perm(i,generatedCount,seed,71083),n=(mixName(seed,k));
  const foalYear=pick([1998,1997,1996,1995,1994,1993,1992,1991,1990,1989],seed,id+':age');
  const sex=foalYear<=1994?pick(['MARE','GELDING','STALLION','MARE','GELDING'],seed,id+':sex'):pick(['COLT','FILLY','COLT','FILLY','GELDING'],seed,id+':sex');
  const si=hash(seed,id+':sire')%sireCount,di=hash(seed,id+':dam')%damCount;
  const sire=parentAt(si,'SIRE'),dam=parentAt(di,'DAM'),age=1999-foalYear;
  const raced=age>=2&&sex!=='STALLION',starts=raced?Math.floor(unit(seed,id+'starts')*Math.max(2,(age-1)*6)):0;
  const wins=starts?Math.min(starts,Math.floor(starts*(.08+unit(seed,id+'win')*.27))):0;
  const tempName=canonicalNames.has(n.toLowerCase())?n+' from '+FAMILY[i%FAMILY.length]:n;
  const horse={id,name:tempName,nameStatus:'TEST_RENAME_ALLOWED',foalYear,ageAtOpening:age,sex,
   sireId:sire.id,damId:dam.id,ownerId:owner.id,trainerId:trainer.id,stableTrackId:trainer.homeTrackId,
   location:trainer.location,stableId:trainer.barnId,source:'SIMULATED_HORSE_NOT_CANON',
   pedigree:{sireId:sire.id,damId:dam.id,parentBirthYears:[sire.foalYear,dam.foalYear]},
   attributes:traits(hor,seed,id,.25+unit(seed,id+':talent')*.7),
   reputation:standing(seed,id,.15+unit(seed,id+'standing')*.65),
   career:{starts,wins,places:Math.max(wins,Math.floor(starts*(.2+unit(seed,id+'place')*.2))),earnings:money(wins*8000+starts*1700*unit(seed,id+'prize')),
    provenance:'GENERATED_1998_AND_PRIOR_NONCANON_TEST_RACES_ONLY'},
   finances:{estimatedValue:money(3000+Math.pow(unit(seed,id+'market'),3)*1200000),monthlyCareCost:money(1100+unit(seed,id+'care')*2200)},
   eligibility:{licensedAt1999Start:age>=2&&!['STALLION'].includes(sex),soundnessEvidence:'SIMULATED_TEST_STATE',futureRaceStarts:[]}};
  horseCache.set(index,horse);return horse;
 }
 function personAt(index){
  if(!Number.isInteger(index)||index<0||index>=ROLES.reduce((s,r)=>s+r[1],0))throw Error('Person index');
  let j=index,role;
  for(const r of ROLES){if(j<r[1]){role=r[0];break}j-=r[1]}
  if(role==='trainer')return trainerAt(j);
  const id='P-TEST-'+role.toUpperCase()+'-'+pad(j+1),track=trackAt(hash(seed,id)%trackCount);
  return {id,name:GIVEN[(j+index+seed)%GIVEN.length]+' '+FAMILY[Math.floor(j/GIVEN.length)%FAMILY.length],
   nameStatus:'TEST_RENAME_ALLOWED',role,location:track.location,baseTrackId:track.id,
   attributes:traits([...common,...(roleDef[role]||[])],seed,id,.22+unit(seed,id+'talent')*.7),
   reputation:standing(seed,id,.2+unit(seed,id+'standing')*.65),payrollAnnual:money(18000+unit(seed,id+'pay')*90000),
   age:21+hash(seed,id+':age')%48,licenseStatus:'SIMULATED_TEST_ACTIVE',source:'SIMULATED_WORKFORCE'};
 }
 function meetOpen(track,date){
  const month=+date.slice(5,7),day=new Date(date+'T12:00:00Z').getUTCDay(),region=String(track.location.state).toLowerCase();
  const winter=/fl|ca|arizona|la|tx|nm|arkansas|louisiana|california|florida|texas/.test(region);
  const active=winter?[1,2,3,4,10,11,12]:[3,4,5,6,7,8,9,10,11];
  return active.includes(month)&&([2,4,6,0].includes(day)||hash(seed,track.id+':weekday:'+day)%4===0);
 }
 function conditionBook(date,trackIndex){
  if(typeof date!=='string'||!/^1999-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+'T12:00:00Z')))throw Error('1999 date required');
  const track=trackAt(trackIndex);if(!meetOpen(track,date))return [];
  const count=track.racing.racesPerCard,classes=['Maiden Special Weight','Maiden Claiming','Claiming','Allowance','Allowance Optional Claiming','Starter Allowance','Handicap','Open Allowance','Claiming','Maiden Special Weight'];
  const result=[];
  for(let n=1;n<=count;n++){
   const id='R-TEST-1999-'+date.replaceAll('-','')+'-'+pad(trackIndex+1,3)+'-'+pad(n,2),cl=classes[(n+trackIndex)%classes.length],
    minAge=2+hash(seed,id+':age')%3,sprint=unit(seed,id+':dist')<.52;
   result.push({id,date,trackId:track.id,trackName:track.name,number:n,conditions:cl,
    ageRequirement:minAge+'YO+',sexRestriction:hash(seed,id+'female')%7===0?'FILLIES_AND_MARES':'OPEN',
    surface:hash(seed,id+'surface')%5===0?'TURF':'DIRT',distanceFurlongs:sprint?6+hash(seed,id+'sprint')%3:8+hash(seed,id+'route')%5,
    purse:money((cl.includes('Maiden')?22000:cl.includes('Claiming')?13000:39000)*(0.65+unit(seed,id+'purse')*1.5)),
    fieldCapacity:8+hash(seed,id+'field')%7,currentEntries:[],results:[],status:'CONDITION_BOOK_PROPOSAL_NOT_RUN',canonical:false});
  }
  return result;
 }
 function auctionAt(index){
  if(!Number.isInteger(index)||index<0||index>=36)throw Error('Auction index');
  const track=trackAt(hash(seed,'auction:'+index)%trackCount),month=1+Math.floor(index/3),day=[6,14,22][index%3];
  const id='A-TEST-1999-'+pad(index+1,3);
  return {id,name:pick(['Midwinter','Spring','Summer','Autumn','Regional','Select','Yearling','Mixed'],seed,id)+' '+track.location.city+' Sale',
   location:track.location,trackId:track.id,date:'1999-'+pad(month,2)+'-'+pad(day,2),
   sellerFeeRate:round(.03+unit(seed,id+'sellerFee')*.04),buyerPremiumRate:round(.01+unit(seed,id+'buyerFee')*.03),
   catalogLots:120+hash(seed,id+'lots')%570,reputation:standing(seed,id,.35+unit(seed,id+'rep')*.6),
   cashOperatingReserve:money(250000+unit(seed,id+'cash')*3000000),
   source:'SIMULATED_TEST_AUCTION',outcomes:[]};
 }
 function facilityAt(index){
  if(!Number.isInteger(index)||index<0||index>=trainersTotal+900+trackCount)throw Error('Facility index');
  if(index<trainersTotal){const tr=trainerAt(index);return {id:tr.barnId,name:tr.name+' Racing Barn',type:'RACE_BARN',
   location:tr.location,trainerId:tr.id,trackId:tr.homeTrackId,capacity:tr.barnCapacity,occupied:tr.generatedRunners,
   landAcres:0,equipmentCondition:round(.4+unit(seed,tr.id+'eq')*.58),staffingRequirement:Math.max(1,Math.ceil(tr.barnCapacity/6)),
   annualOperatingCost:money(tr.barnCapacity*29000),reputation:tr.reputation,source:'TEST_BARN'};}
  if(index<trainersTotal+900){const i=index-trainersTotal,t=trackAt(hash(seed,'farm:'+i)%trackCount),id='F-TEST-FARM-'+pad(i+1);
   return {id,name:FAMILY[i%FAMILY.length]+' '+pick(['Stud','Farm','Bloodstock','Thoroughbreds'],seed,id),
   type:'BREEDING_FARM',location:t.location,trackId:t.id,capacity:80+hash(seed,id+'cap')%350,occupied:0,
   landAcres:80+hash(seed,id+'acres')%1100,foalingBarns:2+hash(seed,id+'foal')%10,
   annualOperatingCost:money(120000+unit(seed,id+'cost')*1400000),
   reputation:standing(seed,id,.3+unit(seed,id+'rep')*.6),source:'TEST_FARM'};}
  const t=trackAt(index-trainersTotal-900);
  return {id:'F-TEST-TRACK-'+pad(index-trainersTotal-900+1,3),name:t.name+' Training Center',type:'TRAINING_CENTER',location:t.location,trackId:t.id,
   capacity:money(120+unit(seed,t.id+'cap')*500),occupied:0,landAcres:45+hash(seed,t.id+'land')%230,
   annualOperatingCost:money(950000+unit(seed,t.id+'cost')*4800000),reputation:t.reputation,source:'TEST_TRACK_CENTER'};
 }
 const peopleCount=ROLES.reduce((s,r)=>s+r[1],0);
 return {schema:FULL_WORLD_SCHEMA,seed,mode,startDate:WTW_TEST_START_DATE,currentDate:WTW_TEST_START_DATE,
  canonProtected:anchored,identityLayer:'CANON_LOCKS_PLUS_REPLACEABLE_TEST_IDENTITIES',attributesSchema:attributeCatalog.schema,
  counts:{horses:HORSE_POPULATION,canonicalHorses:anchored?CANON_HORSES:0,generatedHorses:generatedCount,owners:ownersTotal,trainers:trainersTotal,
   people:peopleCount+(anchored?sourcePeople.length:0),tracks:trackCount,facilities:trainersTotal+900+trackCount,auctions:36,
   sourceStallions:anchored?canon.activeStallions1999.length:0,sourceBroodmareLocations:anchored?canon.productionBroodmareBoarding1999.length:0},
  ownerAt,trainerAt,trackAt,horseAt,personAt,auctionAt,facilityAt,conditionBook,horseNameStatus:'TEST_NAMES_MAY_BE_REPLACED_AFTER_NAMING_ENGINE_UPDATES',
  parentAt,attributeCatalog,sourceStakes:anchored?canon.stakes1999:[],sourceOrganizations:sourceOrgs,sourcePeople,
  audit:{ownershipSlots:ownersSlots.counts.reduce((a,b)=>a+b,0),trainerSlots:trainerSlots.counts.reduce((a,b)=>a+b,0),
   maxOwnerHorses:Math.max(...ownersSlots.counts),minOwnerHorses:Math.min(...ownersSlots.counts),
   maxTrainerHorses:Math.max(...trainerSlots.counts),minTrainerHorses:Math.min(...trainerSlots.counts)}};
}
