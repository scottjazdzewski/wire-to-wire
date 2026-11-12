/**
 * WTW 1999 V1 full-scale, deterministic TEST population. This is a game model,
 * not a historic-data exporter or a second canonical archive.
 * Canon-anchored mode locks every sourced name, ID and inherited connection;
 * only unregistered TEST names may later be refreshed by the naming engine.
 * All entities have a stable ID, human name, physical geography, operational
 * capacity, reputation and applicable catalog attributes on demand.
 */
import {openingWorld1999 as canon} from './opening-world.v1.mjs';
import {createGeographicNameRoster,GEO_NAME_MODEL} from '../../public/1999/engine/geographic-names.mjs';
import {existingPrincipals1999} from '../../public/1999/engine/source-principals-1999.mjs';
import {trackProgram1999,trackMeetOpen1999,trackCardSurface1999} from '../../public/next/1999-track-program.mjs';
import {applyVerifiedStakeDay1999} from '../../public/next/1999-verified-stakes-dates.mjs';
import {trackConditionProfile1999,buildConditionBook1999} from '../../public/next/1999-condition-book-engine.mjs';
import {createAgeAbility,inferProfessionalRole,project1999CareerEntity,validateCareerGameDate} from '../../public/1999/engine/age-ability.mjs';
import attributeCatalog from '../../public/1999/engine/attribute-catalog.mjs';
import {WTW_TEST_START_DATE} from './test-clock.mjs';
export const FULL_WORLD_SCHEMA='WTW_1999_FULL_SCALE_TEST_V1';
export const HORSE_POPULATION=87500;
export const CANON_HORSES=267;
export const MODES=['CANON_ANCHORED_TEST','FULLY_FICTIONAL_TEST'];
const A=['Quiet','Silver','Cross','High','Small','Golden','West','Blue','North','Grand','River','Long','Fine','Little','Black','Red','White','Early','Late','Open','Second','True','Bold','Bright','Old','Wild','Brave','Fair','Deep','Steady','Autumn','Winter','Summer','Spring','First','Last','Hidden','Clear','Royal','Southern','Eastern','Western','Broken','Sweet','Dark','Plain','Soft','Strong','Lucky','Amber','Coastal','Morning','Evening','Bluebird','Overland','Free','Willow','Maple','Copper','Northern','Harbor','Stone'];
const B=['Road','Window','River','Harbor','Sunday','Market','Garden','Coast','Day','Night','Friend','Mountain','Valley','Song','Hope','Memory','Light','Thunder','Stone','Hill','Crown','Map','Letter','Gold','Silver','Rain','Wind','Paper','Town','Home','Glass','Gate','Watch','Train','Seventh','Riddle','Field','Cloud','Sky','Moon','Sun','Lark','Chance','Grace','Whisper','Bell','Drift','Fire','Autumn','Pocket','April','June','Mabel','Ruth','Clara','Doyle','Fitch','Carson','Mercer','Kettle'];
const C=['Again','Ahead','Today','Tomorrow','Morning','Tonight','Somewhere','Way','Reply','Ticket','Story','Time','Road','Mark','Rose','Light','Harbor','Echo','Day','Night','Dawn','Parade','Letter','Promise','Reason','Habit','Idea','Home','Song','Breeze','Measure','Ledger','Signal','Sunrise','Chance','Question','Crown','Rider','Course','Country','Money','Sunday','Quietly','Early','Forever','Later','North','West','East','South'];
const GIVEN=['James','Anne','Robert','Maria','Charles','Elizabeth','Thomas','Daniel','Helen','Frank','Joseph','Ellen','Catherine','Ruth','Richard','Louise','Henry','Walter','Arthur','Sarah','David','Harold','Carolyn','George','Patrick','Albert','Nora','William','Martha','Edith','Eugene','Paul','Andrew','Lydia','Francis','Irene','Michael','Martin','Katherine','Victor','Rebecca','Peter','John','Susan','Margaret','Louis','Gordon','Claire','Dominic','Raymond','Caroline','Miguel','Nadia','Marianne','Edwin','Christopher','Diane','Samuel','Evelyn','Warren'];
const FAMILY=['Morgan','Bennett','Harlan','Doyle','Whitcomb','Reed','Fletcher','Baxter','Norton','Hayes','Keller','Miller','Sullivan','Carter','Grady','Bishop','Rivers','Palmer','Foster','Quinn','Harrison','Weller','Franklin','Graham','Benton','Mercer','Langley','Donovan','Keene','Holloway','Murphy','Dalton','Crawford','Hawthorne','Parker','Sloan','Conway','Walsh','Beckett','Everett','Rowan','Dawson','Lancaster','Montrose','Sterling','Calhoun','Fitzgerald','Harris','Lowell','Willis','Thatcher','Henderson','Barrett','Simmons','Stanton','Callahan','Powers','Larkin','Davenport','Weston','Bradshaw'];
const OWNER_TERMS=['Racing','Stables','Partnership','Bloodstock','Farms','Thoroughbreds','Racing Club','Farm & Racing','Racing Group','Farm','Racing Partners','Stud & Racing'];
const ROLES=[['trainer',4200],['jockey',1800],['farm_manager',550],['veterinarian',430],['farrier',420],['bloodstock_agent',360],['racing_secretary',134]];
const EXTRA_GIVEN='Aaron|Adelaide|Adriana|Aileen|Alejandro|Alfred|Alma|Amelia|Anita|Antonio|Beatrice|Bernard|Blanche|Brenda|Calvin|Carmen|Cecilia|Clarence|Claudia|Colin|Constance|Curtis|Daphne|Darius|Deborah|Dennis|Douglas|Elaine|Elena|Elias|Emilio|Esther|Felix|Fernando|Florence|Frederick|Gabriel|Gloria|Grace|Gregory|Guillermo|Hector|Hilda|Howard|Hugh|Ingrid|Isabel|Jacqueline|Javier|Jean|Jerome|Joaquin|Judith|Julian|Karen|Keith|Kenneth|Laura|Leon|Leonard|Lillian|Linda|Lionel|Loretta|Lucia|Malcolm|Manuel|Marcel|Marcia|Marilyn|Marjorie|Maxwell|Meredith|Mildred|Monica|Nathan|Neil|Nicholas|Olivia|Oscar|Pamela|Patricia|Philip|Phyllis|Raul|Regina|Renee|Ricardo|Rosa|Rosalind|Ruben|Russell|Sandra|Sergio|Sharon|Simon|Sofia|Sylvia|Teresa|Theodore|Timothy|Valerie|Veronica|Vincent|Wesley|Yvonne'.split('|'),EXTRA_FAMILY="Abbott|Aguilar|Alvarez|Anderson|Armstrong|Atkinson|Baldwin|Banks|Barnes|Bell|Blair|Bolton|Boyle|Bradley|Brennan|Brooks|Burke|Campbell|Castillo|Chambers|Chavez|Chen|Clark|Cohen|Collins|Cooper|Cruz|Daniels|Delgado|Dixon|Dominguez|Douglas|Duarte|Edwards|Elliott|Espinoza|Estrada|Faulkner|Ferguson|Fernandez|Fields|Fisher|Fleming|Flores|Ford|Fowler|Garcia|Gardner|Garrett|Gibson|Gilbert|Gomez|Gonzales|Goodman|Grant|Griffin|Gutierrez|Hamilton|Hanson|Harding|Hart|Hernandez|Higgins|Hines|Holland|Hughes|Hunt|Ibarra|Ingram|Jackson|Jacobs|James|Jennings|Jimenez|Johnson|Jones|Kaufman|Kennedy|Kim|King|Knight|Lamb|Lawson|Lee|Lewis|Lloyd|Logan|Lopez|Lynch|Mackenzie|Maddox|Manning|Marquez|Marshall|Martinez|Mason|Matthews|McCarthy|McConnell|McDonald|McIntyre|McKay|Mendoza|Mitchell|Morales|Moreno|Morris|Navarro|Nelson|Nichols|O'Brien|Ochoa|Olson|Ortega|Owens|Page|Patel|Patterson|Pearson|Pena|Peters|Peterson|Phillips|Pierce|Porter|Price|Ramirez|Ramos|Reyes|Rhodes|Richardson|Riley|Roberts|Robinson|Rodriguez|Rogers|Romero|Rose|Ross|Russell|Salazar|Sanchez|Sandoval|Santos|Schneider|Scott|Shaw|Shepherd|Silva|Smith|Soto|Stevens|Stewart|Stone|Strickland|Taylor|Thompson|Torres|Turner|Valdez|Vargas|Vasquez|Vega|Wagner|Walker|Wallace|Ward|Watkins|Weaver|Webb|Wells|White|Williams|Wilson|Wong|Wood|Wright|Young".split('|');
const ALL_GIVEN=[...GIVEN,...EXTRA_GIVEN],ALL_FAMILY=[...FAMILY,...EXTRA_FAMILY];
const PLACE_WORDS='Ashbrook|Briarfield|Cedar Gate|Clearwater|Copper Creek|Crescent Hill|Deep Hollow|Eastbrook|Elm Grove|Fairfield|Fernwood|Fox Chase|Glenhaven|Grandview|Green Briar|Hearthstone|Highland|Hillcrest|Iron Gate|Laurel Run|Little Creek|Long Meadow|Maple Hill|Meadowbrook|Midland|Millstone|Morning Star|North Point|Oak Ridge|Old Bridge|Overlook|Pine Hollow|Quarry Hill|Red Clay|Red Oak|Ridgefield|Riverton|Rockbridge|Rose Hill|Sagebrush|Silver Brook|South Fork|Springbank|Stonebrook|Stonegate|Summer Hill|Sun Valley|Tall Oaks|Three Pines|Timberline|Twin Oaks|Valley Gate|Westbank|Westbrook|White Fence|Wildwood|Willow Creek|Windward|Winter Hill|Woodhaven|Yellow Creek'.split('|');
const ACTIVE_STAFF_COUNT=ROLES.reduce((n,[,count])=>n+count,0);
function generatedPersonName(seed,ordinal,locked){const total=ALL_GIVEN.length*ALL_FAMILY.length,k=(ordinal*7919+(seed%total))%total;
 const name=ALL_GIVEN[k%ALL_GIVEN.length]+' '+ALL_FAMILY[Math.floor(k/ALL_GIVEN.length)];
 return locked.has(name.toLowerCase())?name+' '+String.fromCharCode(65+ordinal%26)+'.':name;}
function generatedOrganizationName(seed,i,kind){const total=PLACE_WORDS.length*ALL_FAMILY.length,k=(i*307+(seed%total))%total;
 const p=PLACE_WORDS[k%PLACE_WORDS.length],f=ALL_FAMILY[Math.floor(k/PLACE_WORDS.length)];
 if(kind==='farm')return [p+' '+f+' Farm',f+' '+p+' Stud',p+' '+f+' Bloodstock',f+' '+p+' Nursery'][i%4];
 if(kind==='barn')return [p+' '+f+' Racing',f+' '+p+' Stables',p+' '+f+' Training Yard',f+' '+p+' Racing Stable'][i%4];
 return [p+' '+f+' Racing',f+' & '+p+' Partners',p+' '+f+' Bloodstock',f+' '+p+' Thoroughbreds',p+' '+f+' Syndicate',f+' '+p+' Racing Club'][i%6];}
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
const sourceTracks=canon.tracks.filter(t=>trackProgram1999(t.id)?.trackOperating==='OPEN_1999');
function mixName(seed,i){const total=A.length*B.length*C.length,k=(i*71081+seed)%total;
 const a=A[k%A.length],b=B[Math.floor(k/A.length)%B.length],c=C[Math.floor(k/(A.length*B.length))%C.length];
 return a+' '+b+' '+c;}
function makeSlots(count,available,seed,kind){
 const owner=kind==='owner',counts=new Array(count).fill(0),eligible=[],weights=[];
 let used=0;
 for(let i=0;i<count;i++){
  if(owner&&i>=Math.floor(count*.48)){counts[i]=1+hash(seed,kind+':tiny:'+i)%3;}
  else if(owner&&i<90){counts[i]=135;eligible.push(i);}
  else if(owner&&i<510){counts[i]=26;eligible.push(i);}
  else if(owner){counts[i]=5;eligible.push(i);}
  else if(i<80){counts[i]=80;eligible.push(i);}
  else if(i<800){counts[i]=11;eligible.push(i);}
  else if(i<2600){counts[i]=3;eligible.push(i);}
  else counts[i]=2;
  used+=counts[i];
 }
 if(used>available)throw Error('Minimum roster exceeds population');
 for(const i of eligible)weights.push(Math.pow(i+14,-.71)*(.83+unit(seed,kind+':weight:'+i)*.34));
 const weightTotal=weights.reduce((a,b)=>a+b,0),fraction=[],extra=available-used;
 for(let j=0;j<eligible.length;j++){
  const exact=extra*(weights[j]/weightTotal),n=Math.floor(exact),i=eligible[j];
  counts[i]+=n;used+=n;fraction.push([exact-n,i]);
 }
 fraction.sort((a,b)=>b[0]-a[0]||a[1]-b[1]);
 for(let j=0;j<available-used;j++)counts[fraction[j][1]]++;
 const ends=[];let running=0;for(const n of counts){running+=n;ends.push(running)}
 if(running!==available)throw Error('Owner/trainer slots do not equal generated population');
 return {counts,ends,at(slot){let l=0,r=ends.length-1;while(l<r){const m=(l+r)>>1;if(slot<ends[m])r=m;else l=m+1;}return l;}};
}
const gcd=(a,b)=>b?gcd(b,a%b):a;
const perm=(i,total,seed,constant)=>{let mult=constant;while(gcd(mult,total)!==1)mult+=2;return (i*mult+(seed%total))%total;};
// Age and ability are assigned before professional/athletic traits.
function traits(definitions,seed,id,ability){
 const out={};
 for(const d of definitions){
  if(d.key==='maturation_curve'&&ability.role==='horse'){
   // A high maturation value means genetically modeled early development.
   out[d.key]=round(clamp((7.8-ability.peakAge)/6,.01,.99));continue;
  }
  const u=unit(seed,id+':trait:'+d.key);
  const permanent=ability.role==='horse'&&/aptitude|tolerance|adaptability|durability|maturation_curve|soundness_risk/.test(d.key);
  const level=(permanent?ability.peakCeiling:ability.current)/100;
  const v=clamp(.07+.86*(level*.76+u*.24)+(unit(seed,id+':noise:'+d.key)-.5)*.08,.01,.99);
  if(d.scope==='latent')out[d.key]=round(d.key==='soundness_risk'?1-v:v);
  else if(d.scope==='dynamic'||d.scope==='derived')
   out[d.key]=round(d.key==='fitness'||d.key==='race_readiness'?
    clamp(.1+ability.ageFactor*.45+u*.35,.01,.99):clamp(.14+u*.72,.01,.99));
  else if(d.scope==='measured')out[d.key]=d.key.includes('stride_length')?round(5.5+2*v):d.key.includes('stride_frequency')?round(1.5+v):round(v);
  else out[d.key]=d.key.includes('style')?pick(['front','press','stalk','midpack','close'],seed,id+d.key):
   d.key.includes('distance')?pick(['sprint','mile','route','classic'],seed,id+d.key):
   d.key.includes('surface')?pick(['dirt','turf','all_weather'],seed,id+d.key):round(v);
 }
 return out;
}
function personAge(seed,id,role,source=null){
 const raw=source?.birthYear??source?.birth_year??source?.yearOfBirth??
  (typeof source?.dateOfBirth==='string'?source.dateOfBirth.slice(0,4):null);
 const year=raw==null||raw===''?NaN:Number(raw);
 if(Number.isInteger(year)&&year>=1905&&year<=1982)return {age:1999-year,basis:'SOURCE_RECORDED_BIRTH_YEAR'};
 const limits={jockey:[18,58],trainer:[26,75],owner:[29,83],breeder:[29,78],farm_manager:[24,72],
  veterinarian:[27,72],farrier:[20,69],bloodstock_agent:[24,75],racing_secretary:[27,73]};
 const [min,max]=limits[role]||limits.owner;
 return {age:min+hash(seed,id+':test:age')%(max-min+1),basis:'SIMULATED_TEST_AGE_BIRTH_YEAR_NOT_ESTABLISHED'};
}
function standing(seed,id,level=0.5){const n=clamp(Math.round(12+level*71+(unit(seed,id+':reputation')-.5)*18),1,99);
 return {overall:n,regional:clamp(n+Math.round((unit(seed,id+'reg')-.5)*17),1,99),national:clamp(Math.round(n*.8),1,99),commercialTrust:clamp(n+Math.round((unit(seed,id+'trust')-.5)*19),1,99),asOf:WTW_TEST_START_DATE,provenance:'GENERATED_TEST_REPUTATION_NOT_HISTORICAL_VERIFIED'};}
export function create1999Universe({seed=19990101,mode=MODES[0]}={}){
 if(!Number.isSafeInteger(seed)||seed<1||!MODES.includes(mode))throw Error('Invalid world seed or mode');
 const anchored=mode===MODES[0],locked=anchored?canon.horses:[],sourcePeople=anchored?canon.people:[],sourceOrgs=anchored?canon.organizations:[];
 const generatedCount=HORSE_POPULATION-locked.length;
 const ownersTotal=3308,trainersTotal=4200,ownersSlots=makeSlots(ownersTotal,generatedCount,seed,'owner'),trainerSlots=makeSlots(trainersTotal,generatedCount,seed,'trainer');
 const trackCache=new Map(),ownerCache=new Map(),trainerCache=new Map(),horseCache=new Map();
  const canonTrainers=sourcePeople.filter(x=>String(x.role||'').toLowerCase().includes('trainer'));
  const protectedPersonNames=new Set(sourcePeople.map(x=>String(x.name||'').toLowerCase()));
  const generatedPrincipalCount=ownersTotal-sourceOrgs.length;
  const roleForIndex=index=>{if(index>=ACTIVE_STAFF_COUNT)return 'owner';let j=index;for(const [role,count] of ROLES){if(j<count)return role;j-=count}return 'owner';};
  const namedPeople=createGeographicNameRoster(seed,ACTIVE_STAFF_COUNT+ownersTotal,roleForIndex,sourcePeople.map(x=>x.name));
 const trackCount=sourceTracks.length,canonicalNames=new Set(locked.map(x=>x.name.toLowerCase()));
 if(trackCount<100)throw Error('Fewer than 100 playable U.S., Canadian and Cuban racecourses');
 function regionTrack(geo,id){
  if(!geo)return trackAt(hash(seed,id+':track')%trackCount);
  const reg=String(geo.region??geo.state??'').toLowerCase(),city=String(geo.locality??geo.city??'').toLowerCase();
  let index=sourceTracks.findIndex(t=>city&&t.locality&&t.locality.toLowerCase()===city&&t.region&&reg.includes(t.region.toLowerCase()));
  if(index<0)index=sourceTracks.findIndex(t=>t.region&&reg.includes(t.region.toLowerCase()));
  if(index<0)index=sourceTracks.findIndex(t=>t.region&&t.region.toLowerCase().includes(reg)&&reg.length>2);
  if(index<0)index=hash(seed,id+':track')%trackCount;
  return trackAt(index);
 }
 function trackAt(i){
  if(i<0||i>=trackCount)throw Error('Track index out of range');
  if(trackCache.has(i))return trackCache.get(i);
  const base=sourceTracks[i],racingProfile=trackConditionProfile1999(base.id,seed),generatedName=A[i%A.length]+' '+B[Math.floor(i/A.length)%B.length]+' Downs';
  const obj={id:anchored?base.id:'T-TEST-1999-'+pad(i+1,4),name:anchored?base.name:generatedName,
   location:fmtLoc(base),nameStatus:anchored?'CANON_LOCKED':'TEST_RENAME_ALLOWED',surface:trackCardSurface1999(base.id,1)||'HISTORICAL',surfaces:trackProgram1999(base.id)?.surfaces||'Not recorded',
   reputation:standing(seed,'track:'+i,.4+unit(seed,'track:quality:'+i)*.5),
   facility:{grandstandCapacity:money(3000+unit(seed,'stand:'+i)*40000),barnStalls:0,
    trainingTrack:true,medicalCenter:true,startingGates:2,groundsCondition:round(.55+unit(seed,'ground:'+i)*.4)},
   racing:{racesPerCard:racingProfile.typicalRaces,firstPostHour:12+Math.floor(unit(seed,'post:'+i)*4),
     meetStatus:'SCHEDULE_DEPENDENT',programTier:racingProfile.tier,conditionBookBasis:'WTW_1999_TRACK_SPECIFIC_MODELED',
     annualPurseBudget:money(racingProfile.typicalRaces*
      (racingProfile.purses.claim+racingProfile.purses.allowance)/2*
      (Number(String(trackProgram1999(base.id)?.raceDays||'').match(/\d+/)?.[0])||100))},
   finances:{cash:money(300000+unit(seed,'tcash:'+i)*7500000),annualOperatingBudget:money(700000+unit(seed,'tbgt:'+i)*7000000)},
    attributes:{surface_quality:round(.3+unit(seed,'surf:'+i)*.69),horse_safety:round(.3+unit(seed,'safe:'+i)*.69),grounds_maintenance:round(.3+unit(seed,'maint:'+i)*.69),race_program:round(.3+unit(seed,'program:'+i)*.69),fan_experience:round(.3+unit(seed,'fan:'+i)*.69)},
   sourceTrackId:base.id};
  trackCache.set(i,obj);return obj;
 }
 function ownerAt(i){
  if(i<0||i>=ownersTotal)throw Error('Owner index out of range');
  if(ownerCache.has(i))return ownerCache.get(i);
  const canonSource=anchored&&i<sourceOrgs.length?sourceOrgs[i]:null;
  const id=canonSource?.id||'O-TEST-1999-'+pad(i+1),t=regionTrack(canonSource?.geographyRecords?.[0]||null,id);
  const portfolio=ownersSlots.counts[i],tier=portfolio>=200?'major':portfolio>=40?'established':portfolio>=8?'regional':'small';
  const syntheticPrincipal=namedPeople[ACTIVE_STAFF_COUNT+i].name;
   const name=canonSource?.name||(i%11===0?syntheticPrincipal:generatedOrganizationName(seed,i,'owner'));
   const principalOwner=canonSource?(canonSource.publicPrincipal||existingPrincipals1999[id]?.name||null):syntheticPrincipal;
   const principalOwnerId=canonSource?(canonSource.publicPrincipalId||existingPrincipals1999[id]?.personId||null):'P-TEST-OWNER-'+pad(i+1);
   const principalSource=sourcePeople.find(p=>p.id===principalOwnerId)||null;
   const principalAge=principalOwnerId?personAge(seed,principalOwnerId,'owner',principalSource):null;
   const principalAbility=principalAge?createAgeAbility({seed,id:principalOwnerId,role:'owner',age:principalAge.age}):null;
  const annualRun=portfolio*money(12000+unit(seed,id+'run')*25000),wealthScale=tier==='major'?12:tier==='established'?5:tier==='regional'?2:1;
  const cash=money(annualRun*(.75+unit(seed,id+'liquidity')*2.5)*wealthScale);
  const obj={id,name,nameStatus:canonSource?'CANON_LOCKED':'TEST_RENAME_ALLOWED',type:canonSource?.type||(i%11===0?'SOLE_OWNER':'OWNERSHIP_OPERATION'),
    principalOwner,principalOwnerId,principalAge:principalAge?.age??null,
    principalAgeBasis:principalAge?.basis??null,principalAbility,principalBasis:canonSource?'SOURCE_IF_RECORDED':'GENERATED_TEST_PRINCIPAL',
   location:canonSource?.geographyRecords?.[0]?.locality?fmtLoc({city:canonSource.geographyRecords[0].locality,state:canonSource.geographyRecords[0].region,country:canonSource.geographyRecords[0].country}):t.location,
   locationBasis:canonSource?.geographyRecords?.[0]?.locality?'SOURCE_VERIFIED_HISTORICAL_ORG_LOCALITY':'SIMULATED_1999_OPERATIONAL_BASE_NOT_HISTORICAL_HEADQUARTERS',
   mainTrackId:t.id,portfolio:{generatedHorseSlots:portfolio,sourceHorseCount:0,tier},
   finances:{cash,annualHorseOperatingBudget:annualRun,propertyAndEquineAssets:money(cash*(.6+unit(seed,id+'assets')*3)),debt:money(cash*unit(seed,id+'debt')*.4),
     monthlyFixedOverhead:money(annualRun/12*.2),currency:'USD',basis:'1999_TEST_MODEL_NOT_VERIFIED_CANON_FUNDS'},
   reputation:standing(seed,id,clamp(.2+Math.log1p(portfolio)/Math.log(700)*.7,0,1)),
    attributes:{capital_resilience:round(.2+unit(seed,id+':capital')*.75),management_quality:round(.2+unit(seed,id+':management')*.75),risk_appetite:round(.15+unit(seed,id+':risk')*.8),welfare_priority:round(.25+unit(seed,id+':welfare')*.7),commercial_judgment:round(.25+unit(seed,id+':market')*.7),long_term_strategy:round(.25+unit(seed,id+':strategy')*.7)},
    authority:canonSource?'CANON_ID_AND_ORIGIN__TEST_FINANCES':'FULLY_TEST_GENERATED'};
  ownerCache.set(i,obj);return obj;
 }
 function trainerAt(i){
  if(i<0||i>=trainersTotal)throw Error('Trainer index');
  if(trainerCache.has(i))return trainerCache.get(i);
  const canonSource=anchored&&i<canonTrainers.length?canonTrainers[i]:null;
  const id=canonSource?.id||'P-TEST-TRAINER-'+pad(i+1),track=regionTrack(canonSource?.base?{locality:canonSource.base.locality,region:canonSource.base.region,country:canonSource.base.country}:null,id);
  const slots=trainerSlots.counts[i],name=canonSource?.name||namedPeople[i].name;
   const ageInfo=personAge(seed,id,'trainer',canonSource);
   const ageAbility=createAgeAbility({seed,id,role:'trainer',age:ageInfo.age});
   const skillAttributes=traits([...common,...(roleDef.trainer||[])],seed,id,ageAbility);
  const obj={id,name,nameStatus:canonSource?'CANON_LOCKED':'TEST_RENAME_ALLOWED',role:'trainer',location:canonSource?.base?fmtLoc(canonSource.base):track.location,
   homeTrackId:track.id,barnId:'F-TEST-BARN-'+pad(i+1),barnCapacity:Math.max(slots+Math.ceil(slots*.12),slots+2),
   generatedRunners:slots,roleAttributes:skillAttributes,attributes:skillAttributes,ability:ageAbility,
    age:ageInfo.age,ageBasis:ageInfo.basis,birthCountry:canonSource?.birthplace?.country||namedPeople[i].birthCountry,
    nameOrigin:canonSource?'CANON_LOCKED':'GEO_ROLE_TEST_POPULATION',morale:round(.3+unit(seed,id+':morale')*.68),workload:round(clamp(slots/(slots+Math.max(2,Math.ceil(slots*.12))),0,1)),
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
   foalYear:isSire?1970+(i%12):1971+(i%13),ageAtOpening:1999-(isSire?1970+(i%12):1971+(i%13)),location:t.location,farmId:'F-TEST-FARM-'+pad(i%900+1),
   reputation:standing(seed,id,.25+unit(seed,id+'rep')*.5),
    ability:createAgeAbility({seed,id,role:'horse',age:1999-(isSire?1970+(i%12):1971+(i%13))}),
    attributes:traits(hor,seed,id,createAgeAbility({seed,id,role:'horse',age:1999-(isSire?1970+(i%12):1971+(i%13))})),
    nameStatus:'TEST_RENAME_ALLOWED',
   source:'GENERATED_ANCESTRAL_STOCK'};
 }
 function horseAt(index){
  if(!Number.isInteger(index)||index<0||index>=HORSE_POPULATION)throw Error('Horse index out of range');
  if(horseCache.has(index))return horseCache.get(index);
  if(anchored&&index<locked.length){
   const c=locked[index],known=Number.isInteger(Number(c.foalYear))&&Number(c.foalYear)>1850;
   const age=known?Math.max(0,1999-Number(c.foalYear)):3+hash(seed,c.id+':test:age')%5;
   const ability=createAgeAbility({seed,id:c.id,role:'horse',age,
    pedigree:{sireId:c.sireId||c.pedigree?.sireId||null,damId:c.damId||c.pedigree?.damId||null}});
   const o={...c,location:fmtLoc({city:c.openingStable.locality,state:c.openingStable.region,country:c.openingStable.country}),
    ageAtOpening:age,ageBasis:known?'SOURCE_RECORDED_FOAL_YEAR':'SIMULATED_TEST_AGE_FOAL_YEAR_UNKNOWN',ability,
    nameStatus:'CANON_LOCKED',reputation:standing(seed,c.id,.4),attributes:traits(hor,seed,c.id,ability),
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
  const ability=createAgeAbility({seed,id,role:'horse',age,pedigree:{sireId:sire.id,damId:dam.id}});
  const raced=age>=2&&sex!=='STALLION',starts=raced?Math.floor(unit(seed,id+'starts')*Math.max(2,(age-1)*6)):0;
  const wins=starts?Math.min(starts,Math.floor(starts*(.08+unit(seed,id+'win')*.27))):0;
  const tempName=canonicalNames.has(n.toLowerCase())?n+' from '+FAMILY[i%FAMILY.length]:n;
  const horse={id,name:tempName,nameStatus:'TEST_RENAME_ALLOWED',foalYear,ageAtOpening:age,sex,
   sireId:sire.id,damId:dam.id,ownerId:owner.id,trainerId:trainer.id,stableTrackId:trainer.homeTrackId,
   location:trainer.location,stableId:trainer.barnId,source:'SIMULATED_HORSE_NOT_CANON',
   pedigree:{sireId:sire.id,damId:dam.id,parentBirthYears:[sire.foalYear,dam.foalYear]},
   ability,attributes:traits(hor,seed,id,ability),
   reputation:standing(seed,id,.15+unit(seed,id+'standing')*.65),
   career:{starts,wins,places:Math.max(wins,Math.floor(starts*(.2+unit(seed,id+'place')*.2))),earnings:money(wins*8000+starts*1700*unit(seed,id+'prize')),
    provenance:'GENERATED_1998_AND_PRIOR_NONCANON_TEST_RACES_ONLY'},
   finances:{estimatedValue:money(3000+Math.pow(unit(seed,id+'market'),3)*1200000),monthlyCareCost:money(1100+unit(seed,id+'care')*2200)},
   eligibility:{licensedAt1999Start:age>=2&&!['STALLION'].includes(sex),soundnessEvidence:'SIMULATED_TEST_STATE',futureRaceStarts:[]}};
  horseCache.set(index,horse);return horse;
 }
 function personAt(index){
  if(!Number.isInteger(index)||index<0||index>=ACTIVE_STAFF_COUNT+generatedPrincipalCount)throw Error('Person index');
   if(index>=ACTIVE_STAFF_COUNT){const owner=ownerAt(index-ACTIVE_STAFF_COUNT+sourceOrgs.length),id=owner.principalOwnerId;
    const ageAbility=owner.principalAbility;
    return {id,name:owner.principalOwner,nameStatus:'TEST_RENAME_ALLOWED',role:'owner',organizationId:owner.id,location:owner.location,baseTrackId:owner.mainTrackId,
     birthCountry:namedPeople[ACTIVE_STAFF_COUNT+index-ACTIVE_STAFF_COUNT+sourceOrgs.length].birthCountry,
     nameOrigin:'GEO_ROLE_TEST_POPULATION',
     ability:ageAbility,attributes:traits([...common,...(roleDef.owner||[])],seed,id,ageAbility),
     reputation:standing(seed,id,.22+unit(seed,id+':standing')*.65),payrollAnnual:0,age:owner.principalAge,ageBasis:owner.principalAgeBasis,
     morale:round(.3+unit(seed,id+':morale')*.68),workload:round(.2+unit(seed,id+':load')*.65),licenseStatus:'SIMULATED_TEST_ACTIVE',source:'SIMULATED_OWNERSHIP_PRINCIPAL'};
   }
  let j=index,role;
  for(const r of ROLES){if(j<r[1]){role=r[0];break}j-=r[1]}
  if(role==='trainer')return trainerAt(j);
  const id='P-TEST-'+role.toUpperCase()+'-'+pad(j+1),track=trackAt(hash(seed,id)%trackCount);
  const ageInfo=personAge(seed,id,role),ageAbility=createAgeAbility({seed,id,role,age:ageInfo.age});
  return {id,name:namedPeople[index].name,birthCountry:namedPeople[index].birthCountry,
    nameOrigin:'GEO_ROLE_TEST_POPULATION',
   nameStatus:'TEST_RENAME_ALLOWED',role,location:track.location,baseTrackId:track.id,
   ability:ageAbility,attributes:traits([...common,...(roleDef[role]||[])],seed,id,ageAbility),
   reputation:standing(seed,id,.2+unit(seed,id+'standing')*.65),payrollAnnual:money(18000+unit(seed,id+'pay')*90000),
   age:ageInfo.age,ageBasis:ageInfo.basis,morale:round(.3+unit(seed,id+':morale')*.68),workload:round(.2+unit(seed,id+':load')*.7),licenseStatus:'SIMULATED_TEST_ACTIVE',source:'SIMULATED_WORKFORCE'};
 }
 function meetOpen(track,date){
  return trackMeetOpen1999(track.sourceTrackId||track.id,date);
 }
 function conditionBook(date,trackIndex){
  if(typeof date!=='string'||!/^1999-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+'T12:00:00Z')))throw Error('1999 date required');
  const track=trackAt(trackIndex);if(!meetOpen(track,date))return [];
  return buildConditionBook1999({date,track,trackIndex,seed,
   sourceStakes:anchored?canon.stakes1999:[],includeKnownStakes:anchored});
 }
 function auctionAt(index){
  if(!Number.isInteger(index)||index<0||index>=36)throw Error('Auction index');
  const track=trackAt(hash(seed,'auction:'+index)%trackCount),month=1+Math.floor(index/3),day=[6,14,22][index%3];
  const id='A-TEST-1999-'+pad(index+1,3);
  return {id,name:pick(['Midwinter','Spring','Summer','Autumn','Regional','Select','Yearling','Mixed'],seed,id)+' '+track.location.city+' Sale',
    attributes:{catalog_quality:round(.2+unit(seed,id+':catalog')*.75),buyer_demand:round(.2+unit(seed,id+':demand')*.75),vendor_depth:round(.2+unit(seed,id+':vendors')*.75),inspection_quality:round(.3+unit(seed,id+':inspection')*.65)},
   location:track.location,trackId:track.id,date:'1999-'+pad(month,2)+'-'+pad(day,2),
   sellerFeeRate:round(.03+unit(seed,id+'sellerFee')*.04),buyerPremiumRate:round(.01+unit(seed,id+'buyerFee')*.03),
   catalogLots:120+hash(seed,id+'lots')%570,reputation:standing(seed,id,.35+unit(seed,id+'rep')*.6),
   cashOperatingReserve:money(250000+unit(seed,id+'cash')*3000000),
   source:'SIMULATED_TEST_AUCTION',outcomes:[]};
 }
 function facilityAt(index){
  if(!Number.isInteger(index)||index<0||index>=trainersTotal+900+trackCount)throw Error('Facility index');
  if(index<trainersTotal){const tr=trainerAt(index);return {id:tr.barnId,name:generatedOrganizationName(seed,index+3308,'barn'),type:'RACE_BARN',
   location:tr.location,trainerId:tr.id,trackId:tr.homeTrackId,capacity:tr.barnCapacity,occupied:tr.generatedRunners,
   landAcres:0,equipmentCondition:round(.4+unit(seed,tr.id+'eq')*.58),staffingRequirement:Math.max(1,Math.ceil(tr.barnCapacity/6)),
    attributes:{horse_care:round(.3+unit(seed,tr.id+':care')*.69),training_environment:round(.3+unit(seed,tr.id+':training')*.69),biosecurity:round(.3+unit(seed,tr.id+':bio')*.69),facility_condition:round(.4+unit(seed,tr.id+'eq')*.58)},
   annualOperatingCost:money(tr.barnCapacity*29000),reputation:tr.reputation,source:'TEST_BARN'};}
  if(index<trainersTotal+900){const i=index-trainersTotal,t=trackAt(hash(seed,'farm:'+i)%trackCount),id='F-TEST-FARM-'+pad(i+1);
   return {id,name:generatedOrganizationName(seed,i+8000,'farm'),
   type:'BREEDING_FARM',location:t.location,trackId:t.id,capacity:80+hash(seed,id+'cap')%350,occupied:0,
   landAcres:80+hash(seed,id+'acres')%1100,foalingBarns:2+hash(seed,id+'foal')%10,
    equipmentCondition:round(.4+unit(seed,id+':eq')*.59),staffingRequirement:Math.ceil((80+hash(seed,id+'cap')%350)/25),
    attributes:{horse_care:round(.3+unit(seed,id+':care')*.69),breeding_management:round(.3+unit(seed,id+':breed')*.69),biosecurity:round(.3+unit(seed,id+':bio')*.69),facility_condition:round(.4+unit(seed,id+':eq')*.59)},
   annualOperatingCost:money(120000+unit(seed,id+'cost')*1400000),
   reputation:standing(seed,id,.3+unit(seed,id+'rep')*.6),source:'TEST_FARM'};}
  const t=trackAt(index-trainersTotal-900);
  return {id:'F-TEST-TRACK-'+pad(index-trainersTotal-900+1,3),name:t.name+' Training Center',type:'TRAINING_CENTER',location:t.location,trackId:t.id,
   capacity:money(120+unit(seed,t.id+'cap')*500),occupied:0,landAcres:45+hash(seed,t.id+'land')%230,
    equipmentCondition:round(.4+unit(seed,t.id+':eq')*.59),staffingRequirement:12+hash(seed,t.id+':staff')%35,
    attributes:{horse_care:round(.3+unit(seed,t.id+':care')*.69),training_environment:round(.3+unit(seed,t.id+':training')*.69),biosecurity:round(.3+unit(seed,t.id+':bio')*.69),facility_condition:round(.4+unit(seed,t.id+':eq')*.59)},
   annualOperatingCost:money(950000+unit(seed,t.id+'cost')*4800000),reputation:t.reputation,source:'TEST_TRACK_CENTER'};
 }
 const trackIndexById=new Map(sourceTracks.map((t,i)=>[anchored?t.id:'T-TEST-1999-'+pad(i+1,4),i]));
 for(let i=0;i<trainersTotal;i++){
  const tr=trainerAt(i),idx=trackIndexById.get(tr.homeTrackId);
  if(idx===undefined)throw Error('Trainer barn track missing');
  const track=trackAt(idx);
  track.facility.barnStalls+=tr.barnCapacity;
  track.facility.occupied=(track.facility.occupied||0)+tr.generatedRunners;
 }
 for(const h of locked){const idx=trackIndexById.get(h.openingStable.trackId);
  if(idx===undefined)throw Error('Canonical horse track not present');
  trackAt(idx).facility.occupied++;
  trackAt(idx).facility.barnStalls++;
 }
 // Source identities are immutable. Only a separate TEST career layer is added.
 function sourcePersonAt(index){
  if(!Number.isInteger(index)||index<0||index>=sourcePeople.length)throw Error('Source person index');
  const person=sourcePeople[index],role=inferProfessionalRole(person.role);
  const ageInfo=personAge(seed,person.id,role,person);
  const ability=createAgeAbility({seed,id:person.id,role,age:ageInfo.age});
  return {...person,modelRole:role,age:ageInfo.age,ageBasis:ageInfo.basis,ability,
   attributes:traits([...common,...(roleDef[role]||[])],seed,person.id,ability),
   testAbilityProvenance:'TEST_ONLY_NOT_VERIFIED_HISTORICAL_PERSON_FACTS'};
 }
 const peopleCount=ACTIVE_STAFF_COUNT+generatedPrincipalCount;
 
 // Read-only inverse of the existing horse allocation permutation.
 // Lets the game inspect a complete owner's stable without generating every horse.
 const ownerMultiplier=(()=>{let m=65537;while(gcd(m,generatedCount)!==1)m+=2;return m})();
 const modularInverse=(a,m)=>{
  let t=0,nextT=1,r=m,nextR=a;
  while(nextR!==0){const q=Math.floor(r/nextR);[t,nextT]=[nextT,t-q*nextT];[r,nextR]=[nextR,r-q*nextR]}
  if(r!==1)throw Error('Owner allocation is not invertible');
  return ((t%m)+m)%m;
 };
 const ownerInverse=modularInverse(ownerMultiplier,generatedCount);
 function ownedHorseIndexes(ownerId){
  if(typeof ownerId!=='string'||!ownerId)return [];
  const canonicalOwner=anchored?sourceOrgs.findIndex(o=>o.id===ownerId):-1;
  const testOwner=ownerId.match(/^O-TEST-1999-(\d+)$/);
  const ownerIndex=canonicalOwner>=0?canonicalOwner:testOwner?Number(testOwner[1])-1:-1;
  if(ownerIndex<0||ownerIndex>=ownersTotal)return [];
  const indices=[];
  if(anchored)locked.forEach((horse,index)=>{if(horse.ownerId===ownerId)indices.push(index)});
  const begin=ownerIndex===0?0:ownersSlots.ends[ownerIndex-1],end=ownersSlots.ends[ownerIndex];
  for(let slot=begin;slot<end;slot++){
   const normalized=(slot-(seed%generatedCount)+generatedCount)%generatedCount;
   const index=(normalized*ownerInverse)%generatedCount;
   indices.push((anchored?locked.length:0)+index);
  }
  return indices.sort((a,b)=>a-b);
 }
 // Project the existing immutable opening entity instead of resampling the world.
 function projectAtDate(record,date='1999-01-01'){
  validateCareerGameDate(date);
  if(record?.ability?.schema)return project1999CareerEntity(record,date,attributeCatalog);
  if(record?.principalAbility?.schema){
   const principal=project1999CareerEntity({
    id:record.principalOwnerId,name:record.principalOwner,age:record.principalAge,
    role:'owner',ability:record.principalAbility
   },date,attributeCatalog);
   return {...record,principalAbility:principal.ability,principalAgeAtDate:principal.age,
    gameDate:date,careerModelDate:date};
  }
  return record;
 }
  return {schema:FULL_WORLD_SCHEMA,seed,mode,startDate:WTW_TEST_START_DATE,currentDate:WTW_TEST_START_DATE,
  canonProtected:anchored,identityLayer:'CANON_LOCKS_PLUS_REPLACEABLE_TEST_IDENTITIES',attributesSchema:attributeCatalog.schema,
   nameModel:GEO_NAME_MODEL,
  counts:{horses:HORSE_POPULATION,canonicalHorses:anchored?CANON_HORSES:0,generatedHorses:generatedCount,owners:ownersTotal,trainers:trainersTotal,
   people:peopleCount+(anchored?sourcePeople.length:0),tracks:trackCount,facilities:trainersTotal+900+trackCount,auctions:36,
   sourceStallions:anchored?canon.activeStallions1999.length:0,sourceBroodmareLocations:anchored?canon.productionBroodmareBoarding1999.length:0},
  ownerAt,trainerAt,trackAt,horseAt,personAt,sourcePersonAt,projectAtDate,auctionAt,facilityAt,conditionBook,ownedHorseIndexes,horseNameStatus:'TEST_NAMES_MAY_BE_REPLACED_AFTER_NAMING_ENGINE_UPDATES',
  parentAt,attributeCatalog,sourceStakes:anchored?canon.stakes1999.filter(s=>sourceTracks.some(t=>t.id===s.trackId)).map(applyVerifiedStakeDay1999):[],sourceOrganizations:sourceOrgs,sourcePeople,excludedActiveStaffRoles:['groom','exercise_rider'],
  audit:{ownershipSlots:ownersSlots.counts.reduce((a,b)=>a+b,0),trainerSlots:trainerSlots.counts.reduce((a,b)=>a+b,0),
   maxOwnerHorses:Math.max(...ownersSlots.counts),minOwnerHorses:Math.min(...ownersSlots.counts),
   maxTrainerHorses:Math.max(...trainerSlots.counts),minTrainerHorses:Math.min(...trainerSlots.counts)}};
}
