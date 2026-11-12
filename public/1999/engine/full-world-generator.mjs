/**
 * WTW 1999 V1 full-scale, deterministic TEST population. This is a game model,
 * not a historic-data exporter or a second canonical archive.
 * Canon-anchored mode locks every sourced name, ID and inherited connection;
 * only unregistered TEST names may later be refreshed by the naming engine.
 * All entities have a stable ID, human name, physical geography, operational
 * capacity, reputation and applicable catalog attributes on demand.
 */
import {openingWorld1999 as canon} from './canon-mini.mjs';
import {createGeographicNameRoster,GEO_NAME_MODEL} from './geographic-names.mjs';
import {existingPrincipals1999} from './source-principals-1999.mjs';
import {trackProgram1999,trackMeetOpen1999,trackCardSurface1999} from '../../next/1999-track-program.mjs';
import {applyVerifiedStakeDay1999} from '../../next/1999-verified-stakes-dates.mjs';
import {createAgeAbility,inferProfessionalRole,project1999CareerEntity,validateCareerGameDate} from './age-ability.mjs';
import attributeCatalog from './attribute-catalog.mjs';
import {WTW_TEST_START_DATE} from '../test-clock.mjs';
export const FULL_WORLD_SCHEMA='WTW_1999_FULL_SCALE_TEST_V1';
export const HORSE_POPULATION=87500;
// All distinct living horses in the January 1999 playable North American world.
// The 87,500 original racehorse IDs remain unchanged for existing saves.
export const WORLD_HORSE_POPULATION=325000;
export const CANON_HORSES=267;
export const MODES=['CANON_ANCHORED_TEST','FULLY_FICTIONAL_TEST'];
// Independent, deterministic TEST foaling hubs. Never substitute a 1999 race barn or
// ownership base for a horse's birthplace, and never change source-locked foalings.
const TEST_FOALING_HUBS=[["Lexington","Kentucky","United States","US"],["Versailles","Kentucky","United States","US"],["Paris","Kentucky","United States","US"],["Georgetown","Kentucky","United States","US"],["Midway","Kentucky","United States","US"],["Frankfort","Kentucky","United States","US"],["Ocala","Florida","United States","US"],["Gainesville","Florida","United States","US"],["Williston","Florida","United States","US"],["Wellington","Florida","United States","US"],["Saratoga Springs","New York","United States","US"],["Millbrook","New York","United States","US"],["Old Westbury","New York","United States","US"],["Laurel","Maryland","United States","US"],["Chesapeake City","Maryland","United States","US"],["Unionville","Pennsylvania","United States","US"],["New Bolton","Pennsylvania","United States","US"],["Middleburg","Virginia","United States","US"],["Upperville","Virginia","United States","US"],["Santa Ynez","California","United States","US"],["Bonsall","California","United States","US"],["Temecula","California","United States","US"],["Arcadia","Louisiana","United States","US"],["Carencro","Louisiana","United States","US"],["Weatherford","Texas","United States","US"],["Guthrie","Oklahoma","United States","US"],["Georgetown","Ontario","Canada","CA"],["Milton","Ontario","Canada","CA"],["Caledon","Ontario","Canada","CA"],["Kildare","County Kildare","Ireland","IE"],["Newbridge","County Kildare","Ireland","IE"],["Cashel","County Tipperary","Ireland","IE"],["Newmarket","Suffolk","England","GB-ENG"],["Lambourn","Berkshire","England","GB-ENG"],["Chantilly","Oise","France","FR"],["Deauville","Calvados","France","FR"],["Scone","New South Wales","Australia","AU"],["Cambridge","Waikato","New Zealand","NZ"],["San Isidro","Buenos Aires","Argentina","AR"],["Shizunai","Hokkaido","Japan","JP"]];

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
const horseTraitDefinitions=new Map(hor.map(d=>[d.key,d]));
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
// North American locality helpers are retained for breeding geography only.
// Racecourse calendars span all canonical 1999 courses, including overseas tracks.
const DOMESTIC_REGIONS=new Set(('AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC AB BC MB NB NL NS NT NU ON PE QC SK YT').split(' '));
const domesticTrack=t=>{
 const country=String(t?.country||t?.countryCode||'').trim().toLowerCase().replace(/[^a-z]/g,'');
 if(country)return ['us','usa','unitedstates','unitedstatesofamerica','ca','can','canada'].includes(country);
 const region=String(t?.region||t?.state||'').trim().toUpperCase();
 return DOMESTIC_REGIONS.has(region)||/^(ALABAMA|ALASKA|ARIZONA|ARKANSAS|CALIFORNIA|COLORADO|CONNECTICUT|DELAWARE|FLORIDA|GEORGIA|HAWAII|IDAHO|ILLINOIS|INDIANA|IOWA|KANSAS|KENTUCKY|LOUISIANA|MAINE|MARYLAND|MASSACHUSETTS|MICHIGAN|MINNESOTA|MISSISSIPPI|MISSOURI|MONTANA|NEBRASKA|NEVADA|NEW HAMPSHIRE|NEW JERSEY|NEW MEXICO|NEW YORK|NORTH CAROLINA|NORTH DAKOTA|OHIO|OKLAHOMA|OREGON|PENNSYLVANIA|RHODE ISLAND|SOUTH CAROLINA|SOUTH DAKOTA|TENNESSEE|TEXAS|UTAH|VERMONT|VIRGINIA|WASHINGTON|WEST VIRGINIA|WISCONSIN|WYOMING|ONTARIO|QUEBEC|BRITISH COLUMBIA|ALBERTA|MANITOBA|SASKATCHEWAN|NOVA SCOTIA|NEW BRUNSWICK|PRINCE EDWARD ISLAND|NEWFOUNDLAND AND LABRADOR)$/i.test(region);
};
// Preserve the full historical archive, but only U.S., Canadian and Cuban tracks race in the playable 1999 world.
// Breeding geography and historical archives are separate from the active racing circuit.
const sourceTracks=canon.tracks.filter(t=>trackProgram1999(t.id)?.trackOperating==='OPEN_1999');
const NORTH_AMERICAN_FOALING_HUBS=TEST_FOALING_HUBS.filter(h=>h[2]==='United States'||h[2]==='Canada');
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
 const MAX_FULL_HORSE_CACHE=512;
 function cachedHorse(index){
  const row=horseCache.get(index);
  if(row){horseCache.delete(index);horseCache.set(index,row)}
  return row;
 }
 function retainHorse(index,row){
  horseCache.set(index,row);
  if(horseCache.size>MAX_FULL_HORSE_CACHE)horseCache.delete(horseCache.keys().next().value);
  return row;
 }
  const canonTrainers=sourcePeople.filter(x=>String(x.role||'').toLowerCase().includes('trainer'));
  const protectedPersonNames=new Set(sourcePeople.map(x=>String(x.name||'').toLowerCase()));
  const generatedPrincipalCount=ownersTotal-sourceOrgs.length;
  const roleForIndex=index=>{if(index>=ACTIVE_STAFF_COUNT)return 'owner';let j=index;for(const [role,count] of ROLES){if(j<count)return role;j-=count}return 'owner';};
  const namedPeople=createGeographicNameRoster(seed,ACTIVE_STAFF_COUNT+ownersTotal,roleForIndex,sourcePeople.map(x=>x.name));
 const trackCount=sourceTracks.length,canonicalNames=new Set(locked.map(x=>x.name.toLowerCase()));
 if(trackCount<20)throw Error('Insufficient U.S./Canadian racecourses for the playable 1999 calendar');
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
  const base=sourceTracks[i],generatedName=A[i%A.length]+' '+B[Math.floor(i/A.length)%B.length]+' Downs';
  const obj={id:anchored?base.id:'T-TEST-1999-'+pad(i+1,4),name:anchored?base.name:generatedName,
   location:fmtLoc(base),nameStatus:anchored?'CANON_LOCKED':'TEST_RENAME_ALLOWED',surface:trackCardSurface1999(base.id,1)||'HISTORICAL',surfaces:trackProgram1999(base.id)?.surfaces||'Not recorded',
   reputation:standing(seed,'track:'+i,.4+unit(seed,'track:quality:'+i)*.5),
   facility:{grandstandCapacity:money(3000+unit(seed,'stand:'+i)*40000),barnStalls:0,
    trainingTrack:true,medicalCenter:true,startingGates:2,groundsCondition:round(.55+unit(seed,'ground:'+i)*.4)},
   racing:{racesPerCard:8+Math.floor(unit(seed,'races:'+i)*3),firstPostHour:12+Math.floor(unit(seed,'post:'+i)*4),
    meetStatus:'SCHEDULE_DEPENDENT',annualPurseBudget:money(2000000+unit(seed,'purse:'+i)*24000000)},
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
    negotiation:{jockeyBudgetBand:tier==='major'?'ELITE':tier==='established'?'COMPETITIVE':tier==='regional'?'REGIONAL':'LOCAL',
     mountFeeTolerance:round(.8+unit(seed,id+':booking-budget')*1.7),
     commissionFlexibility:round(.04+.06*unit(seed,id+':commission-flex')),
     racePursePriority:round(.25+unit(seed,id+':purse-priority')*.75),
     authority:'SIMULATED_1999_OWNER_RACING_MARKET'},
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
   reputation:standing(seed,id,.25+unit(seed,id+'status')*.55),
   annualBaseSalary:0,
   authority:canonSource?'CANON_ID__TEST_ATTRIBUTES':'FULLY_TEST_GENERATED'};
  // Trainers earn day fees and a negotiated share of purse distributions.
  // Reputation and skill raise fees; barn size and negotiations introduce
  // non-linear market variation. These are 1999 GAME contracts, not facts.
  const quality=clamp((ageAbility.current*.55+obj.reputation.overall*.45)/100,0,1);
  const market=.88+unit(seed,id+':contract-negotiation')*.24;
  const dayRate=money((38+Math.pow(quality,2)*145+Math.sqrt(slots)*1.3)*market);
  // This is estimated annual professional fee income, not a guaranteed
  // employee salary or total barn revenue. Retainers depend on quality and
  // roster demand; day rates are charged to individual horses separately.
  const annualBaseSalary=money((32000+190000*Math.pow(quality,2.4)+
    3000*Math.sqrt(slots))*market);
  const winShareRate=round(.085+.025*quality+unit(seed,id+':purse-negotiation')*.01);
  obj.annualBaseSalary=annualBaseSalary;
  obj.compensation={role:'TRAINER',basis:'1999_TEST_NEGOTIATED_DAY_FEES_AND_PURSE',
   dayRate,estimatedAnnualFees:annualBaseSalary,winShareRate,
   secondShareRate:round(.035+.03*quality),thirdShareRate:round(.025+.02*quality),
   barnStaffShareRate:.02,currency:'USD',notGuaranteedSalary:true};
  trainerCache.set(i,obj);return obj;
 }
 const reserved=anchored?new Set(locked.map(x=>x.id)):new Set();
 const generatedId=i=>'H-TEST-1999-'+pad(i+1);
 const sireCount=1400,damCount=26000;
 // Maternal and paternal population is virtualized; every record is deterministic.
 // Existing H-TEST parent IDs remain stable; production projections are not
 // fictional certified pregnancies or historical foaling records.
 // A healthy expanded racing economy targets roughly 45k live foals a year.
 // This separate 1999 forecast does NOT insert newborns into the 87.5k opening
 // horse registry. Preserve sireCount/damCount so existing pedigrees never drift.
 const ANNUAL_FOAL_CROP_TARGET=45000,MARE_BREEDING_STOCK=60000,STALLION_BREEDING_STOCK=1400;
 const mare1999=(i)=>{
  const id='H-TEST-DAM-'+pad(i+1,6);
  const active=hash(seed,id+':1999-breeding-active')%100<90;
  const covered=active&&hash(seed,id+':1999-covered')%100<93;
  const projectedFoal=covered&&hash(seed,id+':1999-live-foal')%100<90;
  return {active,covered,projectedFoal};
 };
 const annualFoalingForecast=()=>{
  let active=0,covered=0,expected=0;
  for(let i=0;i<MARE_BREEDING_STOCK;i++){
   const v=mare1999(i);active+=Number(v.active);covered+=Number(v.covered);expected+=Number(v.projectedFoal);
  }
  return {season:1999,mares:MARE_BREEDING_STOCK,activeMares:active,projectedCoverings:covered,
   projectedLiveFoals:expected,annualFoalCropTarget:ANNUAL_FOAL_CROP_TARGET,
   healthyRange:{min:40000,max:50000},registeredRacehorsePopulation:HORSE_POPULATION,
   racehorsePopulationIsAnnualFoalCrop:false,
   basis:'SIMULATED_1999_EXPECTATION_NOT_LIVE_BIRTHS',
   farmCount:900,stallionPopulation:STALLION_BREEDING_STOCK};
 };
 function mareDirectoryAt(i){
  if(!Number.isInteger(i)||i<0||i>=MARE_BREEDING_STOCK)throw Error('Broodmare directory index');
  const id='H-TEST-DAM-'+pad(i+1,6),pro=mare1999(i);
  const status=!pro.active?'RESTING':pro.covered?'COVERED_1999_TEST':'AVAILABLE_FOR_COVER';
  const foalYear=i<damCount?1971+(i%13):1979+hash(seed,id+':foal-year')%16;
  return {index:i,id,name:mixName(seed+1,i+101500),age:1999-foalYear,sex:'MARE',
   farm:generatedOrganizationName(seed,i%900+8000,'farm'),
   farmId:'F-TEST-FARM-'+pad(i%900+1),status,
   bookings:pro.covered?1:0,foals:pro.projectedFoal?1:0};
 }
 function parentAt(i,sex){
  const isSire=sex==='SIRE',max=isSire?STALLION_BREEDING_STOCK:MARE_BREEDING_STOCK;
  if(!Number.isInteger(i)||i<0||i>=max)throw Error('Parent breeding stock index');
  const id='H-TEST-'+sex+'-'+pad(i+1,6),
   foalYear=isSire?1970+(i%12):i<damCount?1971+(i%13):1979+hash(seed,id+':foal-year')%16;
  const age=1999-foalYear, farm=facilityAt(trainersTotal+i%900);
  const projection=isSire?null:mare1999(i);
  const activeStud=isSire?hash(seed,id+':1999-active-stud')%100<80:false;
  const studFee=isSire?(activeStud?1500+100*hash(seed,id+':1999-stud-fee')%190:0):0;
  const bookSize=isSire&&activeStud?30+hash(seed,id+':1999-stud-book')%46:0;
  return {id,name:mixName(seed+1,isSire?i+100000:i+101500),sex:isSire?'STALLION':'MARE',
   foalYear,ageAtOpening:age,location:farm.location,farmId:farm.id,farmName:farm.name,
   reputation:standing(seed,id,.25+unit(seed,id+'rep')*.5),
   ability:createAgeAbility({seed,id,role:'horse',age}),
   attributes:traits(hor,seed,id,createAgeAbility({seed,id,role:'horse',age})),
   breedingStatus1999:isSire?(activeStud?'STANDING':'RETIRED_STUD'):
    !projection.active?'RESTING':projection.covered?'COVERED_1999_TEST':'AVAILABLE_FOR_COVER',
   projected1999Foal:isSire?null:projection.projectedFoal,
   projected1999Covering:isSire?null:projection.covered,
   projected1999BookSize:bookSize,studFee1999:studFee,
   breederStateBasis:'SIMULATED_1999_REPRODUCTION_FORECAST_NOT_SOURCE',
   nameStatus:'TEST_RENAME_ALLOWED',source:'GENERATED_ANCESTRAL_STOCK'};
 }

 function relationship(a,b,kind){
  const anchor=kind+':'+a+':'+b;
  return {kind,participants:[a,b],trust:35+hash(seed,anchor+':trust')%61,
   respect:30+hash(seed,anchor+':respect')%66,
   chemistry:25+hash(seed,anchor+':chemistry')%71,
   familiarity:1+hash(seed,anchor+':familiarity')%5,
   provenance:'SIMULATED_1999_TEST_RELATIONSHIP_NOT_SOURCE'};
 }
 function simulatedRaceHistory(id,age,sex,trainer,starts,wins,earnings,careerState){
  if(!starts)return [];
  const secondCount=Math.min(starts-wins,Math.floor(starts*(.12+unit(seed,id+':seconds')*.12)));
  const thirdCount=Math.min(starts-wins-secondCount,Math.floor(starts*(.10+unit(seed,id+':thirds')*.09)));
  const fourthCount=Math.min(starts-wins-secondCount-thirdCount,Math.floor(starts*.1));
  const ranked=Array.from({length:starts},(_,i)=>i).sort((a,b)=>
   hash(seed,id+':finish:'+a)-hash(seed,id+':finish:'+b)||a-b);
  const placements=new Array(starts).fill(0);
  ranked.slice(0,wins).forEach(i=>placements[i]=1);
  ranked.slice(wins,wins+secondCount).forEach(i=>placements[i]=2);
  ranked.slice(wins+secondCount,wins+secondCount+thirdCount).forEach(i=>placements[i]=3);
  ranked.slice(wins+secondCount+thirdCount,wins+secondCount+thirdCount+fourthCount).forEach(i=>placements[i]=4);
  const weights=placements.map((p,i)=>p===1?10:p===2?4:p===3?2:p===4?1:0);
  const weightTotal=weights.reduce((a,b)=>a+b,0);
  const last=new Date(Date.UTC(careerState==='RETIRED'||careerState==='AT_STUD'||careerState==='BROODMARE'?1997:1998,10,18));
  const history=[];let allocated=0;
  for(let i=0;i<starts;i++){
   const rest=24*i+hash(seed,id+':race-spacing:'+i)%5;
   const raceDate=new Date(last.getTime()-rest*86400000).toISOString().slice(0,10);
   const result=placements[i]||5+hash(seed,id+':other-place:'+i)%6;
   const prize=weightTotal?(i===starts-1?earnings-allocated:Math.round(earnings*weights[i]/weightTotal)):0;
   allocated+=prize;
   const priorWins=placements.slice(i+1).filter(x=>x===1).length;
   const group=priorWins===0?'Maiden Special Weight':
    priorWins>=3&&hash(seed,id+':race-level:'+i)%6===0?'Listed Stakes':
    hash(seed,id+':race-level:'+i)%3===0?'Claiming':'Allowance';
   const distanceFurlongs=5+hash(seed,id+':race-dist:'+i)%8;
   const jockeyIndex=hash(seed,trainer.id+':race-jockey:'+i)%1800;
   const trackName=anchored?sourceTracks.find(t=>t.id===trainer.homeTrackId)?.name:
    trackAt(Number(String(trainer.homeTrackId).slice(-4))-1).name;
   history.push({id:'RH-TEST-1999-'+id.slice(-6)+'-'+String(i+1).padStart(2,'0'),
    date:raceDate,trackId:trainer.homeTrackId,
    trackName:trackName||'Unknown test venue',
    raceClass:group,surface:distanceFurlongs>9?'TURF':'DIRT',
    distanceFurlongs,finishPosition:result,fieldSize:Math.max(8,result+hash(seed,id+':field:'+i)%5),
    earnings:prize,trainerId:trainer.id,jockeyId:'P-TEST-JOCKEY-'+pad(jockeyIndex+1),
    provenance:'GENERATED_PRE_1999_TEST_RACE_NOT_VERIFIED'});
  }
  return history;
 }
 function openingCondition(id,age,status){
  const fitness=45+hash(seed,id+':opening-fitness')%51;
  const fatigue=5+hash(seed,id+':opening-fatigue')%43;
  const risk=hash(seed,id+':opening-risk')%100;
  const health=risk>=92?'TEST_VET_WATCH':risk>=76?'TEST_MONITOR':'TEST_NO_ALERT';
  const nonrunner=['TOO_YOUNG','AT_STUD','BROODMARE','RETIRED'].includes(status);
  const readiness=nonrunner?0:Math.max(24,Math.min(98,Math.round(fitness*.78+(100-fatigue)*.22)));
  return {fitness,fatigue,health,readiness,status,
   confidence:35+hash(seed,id+':opening-confidence')%61,
   provenance:'SIMULATED_1999_START_STATE_NOT_OBSERVED_VET_FACT'};
 }
 // Lightweight directory projection: returns the EXACT seeded identity and
 // current status without allocating 53 attributes and entire prior race files.
 // This permits globally sorted/filtered 87,500-horse search in bounded memory.
 function horseDirectoryAt(index){
  if(!Number.isInteger(index)||index<0||index>=HORSE_POPULATION)throw Error('Horse directory index');
  if(anchored&&index<locked.length){
   const c=locked[index],known=Number.isInteger(Number(c.foalYear))&&Number(c.foalYear)>1850;
   const age=known?Math.max(0,1999-Number(c.foalYear)):3+hash(seed,c.id+':test:age')%5;
   const abi=createAgeAbility({seed,id:c.id,role:'horse',age,
    pedigree:{sireId:c.sireId||c.pedigree?.sireId||null,damId:c.damId||c.pedigree?.damId||null}});
   return {index,id:c.id,name:c.name,age,sex:c.sex||'',foalYear:c.foalYear||null,
    ownerId:c.ownerId,trainerId:c.trainerId,breederId:c.breederId||'',homebred:c.breederId===c.ownerId&&Boolean(c.breederId),
    sireId:c.sireId||'',damId:c.damId||'',
    sire:c.sire||c.sireId||'',dam:c.dam||c.damId||'',
    trackId:c.openingStable?.trackId||'',status:c.racingStatus||c.trainingStatus||'SOURCE_STATUS_NOT_VERIFIED',
    ca:abi.currentStars,pa:abi.potentialStars,canonical:true};
  }
  const i=anchored?index-locked.length:index;
  const oi=ownersSlots.at(perm(i,generatedCount,seed,65537));
  const ti=trainerSlots.at(perm(i,generatedCount,seed+32,8191));
  const id=generatedId(i),k=perm(i,generatedCount,seed,71083);
  const shortName=mixName(seed,k);
  const name=canonicalNames.has(shortName.toLowerCase())?shortName+' from '+FAMILY[i%FAMILY.length]:shortName;
  const foalYear=pick([1998,1997,1996,1995,1994,1993,1992,1991,1990,1989],seed,id+':age');
  const sex=foalYear<=1994?pick(['MARE','GELDING','STALLION','MARE','GELDING'],seed,id+':sex'):
   pick(['COLT','FILLY','COLT','FILLY','GELDING'],seed,id+':sex');
  const si=hash(seed,id+':sire')%sireCount,di=hash(seed,id+':dam')%damCount;
  const sireId='H-TEST-SIRE-'+pad(si+1,6),damId='H-TEST-DAM-'+pad(di+1,6);
  const age=1999-foalYear;
  const abi=createAgeAbility({seed,id,role:'horse',age,pedigree:{sireId,damId}});
  const raced=age>=3&&sex!=='STALLION';
  const starts=raced?Math.floor(unit(seed,id+'starts')*Math.max(2,(age-2)*6)):0;
  const status=age<2?'TOO_YOUNG':sex==='STALLION'&&age>=5?'AT_STUD':
   sex==='MARE'&&age>=8?'BROODMARE':starts===0?'UNRACED':
   age>=9&&hash(seed,id+':retired')%4===0?'RETIRED':
   hash(seed,id+':break')%8===0?'RESTING':'IN_TRAINING';
  const trainer=trainerAt(ti),owner=ownerAt(oi);
  const homebred=hash(seed,id+':owner-bred')%100<48;
  const breederIndex=homebred?oi:(oi+1+hash(seed,id+':external-breeder')%(ownersTotal-1))%ownersTotal;
  const breeder=homebred?owner:ownerAt(breederIndex);
  return {index,id,name,age,foalYear,sex,status,ownerId:owner.id,trainerId:trainer.id,
   breederId:breeder.id,homebred,
   sireId,damId,sire:mixName(seed+1,si+100000),dam:mixName(seed+1,di+101500),
   trackId:trainer.homeTrackId,ca:abi.currentStars,pa:abi.potentialStars,canonical:false};
 }
 // Read one exact, model-derived attribute without materializing the 53-value
 // profile or any racing history. Enables sorting all 87,500 World horses.
 function horseAttributeAt(index,key){
  const def=horseTraitDefinitions.get(String(key||''));
  if(!def)throw Error('Unknown horse trait: '+key);
  const meta=horseDirectoryAt(index);
  const ability=createAgeAbility({seed,id:meta.id,role:'horse',age:meta.age,
   pedigree:{sireId:meta.sireId||null,damId:meta.damId||null}});
  return traits([def],seed,meta.id,ability)[def.key];
 }
 function horseAt(index){
  if(!Number.isInteger(index)||index<0||index>=HORSE_POPULATION)throw Error('Horse index out of range');
  if(horseCache.has(index))return cachedHorse(index);
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
    career:c.sourceRecordedStakesSeasons,sourceRecordedStakesSeasons:c.sourceRecordedStakesSeasons,
    racingStatus1999:c.racingStatus||c.trainingStatus||'SOURCE_STATUS_NOT_VERIFIED',
    openingCondition:openingCondition(c.id,age,c.racingStatus||c.trainingStatus||'SOURCE_STATUS_NOT_VERIFIED'),
    ownerId:c.ownerId,trainerId:c.trainerId,stableTrackId:c.openingStable.trackId,authority:'LOCKED_NAME_ID_HISTORY_TEST_TRAITS'};
   return retainHorse(index,o);
  }
  const i=anchored?index-locked.length:index,oi=ownersSlots.at(perm(i,generatedCount,seed,65537)),
   ti=trainerSlots.at(perm(i,generatedCount,seed+32,8191)),owner=ownerAt(oi),trainer=trainerAt(ti);
  const id=generatedId(i),k=perm(i,generatedCount,seed,71083),n=(mixName(seed,k));
  const foalYear=pick([1998,1997,1996,1995,1994,1993,1992,1991,1990,1989],seed,id+':age');
  const sex=foalYear<=1994?pick(['MARE','GELDING','STALLION','MARE','GELDING'],seed,id+':sex'):pick(['COLT','FILLY','COLT','FILLY','GELDING'],seed,id+':sex');
  const si=hash(seed,id+':sire')%sireCount,di=hash(seed,id+':dam')%damCount;
  const sire=parentAt(si,'SIRE'),dam=parentAt(di,'DAM'),age=1999-foalYear;
  const ability=createAgeAbility({seed,id,role:'horse',age,pedigree:{sireId:sire.id,damId:dam.id}});
  // At the Jan 1, 1999 opening, a current 2YO was 1YO during 1998 and cannot
  // have a pre-1999 race start, irrespective of the horse's ability.
  const raced=age>=3&&sex!=='STALLION',starts=raced?Math.floor(unit(seed,id+'starts')*Math.max(2,(age-2)*6)):0;
  const wins=starts?Math.min(starts,Math.floor(starts*(.08+unit(seed,id+'win')*.27))):0;
  const tempName=canonicalNames.has(n.toLowerCase())?n+' from '+FAMILY[i%FAMILY.length]:n;
  // A breeder is an actual game organization, distinct from the horse's
  // current owner when purchased. Approximately 48% are owner-bred.
  const homebred=hash(seed,id+':owner-bred')%100<48;
  const breederIndex=homebred?oi:(oi+1+hash(seed,id+':external-breeder')%(ownersTotal-1))%ownersTotal;
  const breederOwner=homebred?owner:ownerAt(breederIndex);
  const foalingFarm=facilityAt(trainersTotal+hash(seed,breederOwner.id+':foaling-farm')%900);
  const foalingGeography={
   locality:foalingFarm.location.city,region:foalingFarm.location.state,
   country:foalingFarm.location.country,
   countryCode:foalingFarm.location.country==='Canada'?'CA':'US',
   authority:'SIMULATED_1999_TEST_BIRTHPLACE_AT_FOALING_FARM'
  };
  const foalMonth=1+hash(seed,id+':foaling-month')%6;
  const foalDay=1+hash(seed,id+':foaling-day')%28;
  const dateOfBirth=foalYear+'-'+pad(foalMonth,2)+'-'+pad(foalDay,2);
  const careerState=age<2?'TOO_YOUNG':sex==='STALLION'&&age>=5?'AT_STUD':
   sex==='MARE'&&age>=8?'BROODMARE':starts===0?'UNRACED':
   age>=9&&hash(seed,id+':retired')%4===0?'RETIRED':
   hash(seed,id+':break')%8===0?'RESTING':'IN_TRAINING';
  const purseEarnings=money(wins*8000+starts*1700*unit(seed,id+'prize'));
  const raceHistory=simulatedRaceHistory(id,age,sex,trainer,starts,wins,purseEarnings,careerState);
  const seconds=raceHistory.filter(r=>r.finishPosition===2).length;
  const thirds=raceHistory.filter(r=>r.finishPosition===3).length;
  const careerEarnings=raceHistory.reduce((total,r)=>total+r.earnings,0);
  const preferredJockeyId=raceHistory[0]?.jockeyId||'P-TEST-JOCKEY-'+pad(1+hash(seed,trainer.id+':preferred-jockey')%1800);
  const horse={id,name:tempName,nameStatus:'TEST_RENAME_ALLOWED',foalYear,ageAtOpening:age,sex,dateOfBirth,foalingGeography,
   breederId:breederOwner.id,breeder:breederOwner.name,
   breedingFarmId:foalingFarm.id,breedingFarm:foalingFarm.name,
   homebred,breederRelationship:homebred?'OWNER_BRED':'OTHER_BREEDER',
   breedingEvidence:'SIMULATED_1999_TEST_LINEAGE_NOT_HISTORICAL_FACT',
   sireId:sire.id,damId:dam.id,ownerId:owner.id,trainerId:trainer.id,stableTrackId:trainer.homeTrackId,
   location:trainer.location,stableId:trainer.barnId,source:'SIMULATED_HORSE_NOT_CANON',
   pedigree:{sireId:sire.id,damId:dam.id,parentBirthYears:[sire.foalYear,dam.foalYear]},
   ability,attributes:traits(hor,seed,id,ability),
   reputation:standing(seed,id,.15+unit(seed,id+'standing')*.65),
   racingStatus1999:careerState,
   openingCondition:openingCondition(id,age,careerState),preferredJockeyId,
   relationships:{ownerTrainer:relationship(owner.id,trainer.id,'OWNER_TRAINER'),
    trainerJockey:relationship(trainer.id,preferredJockeyId,'TRAINER_JOCKEY'),
    horseTrainer:relationship(id,trainer.id,'HORSE_TRAINER')},
   career:{starts,wins,seconds,thirds,places:seconds+thirds,earnings:careerEarnings,
    lastRaceDate:raceHistory[0]?.date||null,status:careerState,raceHistory,
    provenance:'GENERATED_1998_AND_PRIOR_NONCANON_TEST_RACES_ONLY'},
   finances:{estimatedValue:money(3000+Math.pow(unit(seed,id+'market'),3)*1200000),monthlyCareCost:money(1100+unit(seed,id+'care')*2200)},
   eligibility:{licensedAt1999Start:age>=2&&!['STALLION'].includes(sex)&&
    !['RETIRED','AT_STUD','BROODMARE'].includes(careerState),
    soundnessEvidence:'SIMULATED_TEST_STATE',futureRaceStarts:[]}};
  return retainHorse(index,horse);
 }
 let leadingOwnerPool=null;
 function leadingOwnerCandidates(){
  if(!leadingOwnerPool)leadingOwnerPool=ownersSlots.counts.map((size,i)=>({i,size}))
    .sort((a,b)=>b.size-a.size||a.i-b.i).slice(0,45).map(v=>v.i);
  return leadingOwnerPool;
 }
 function jockeyBookingMarket(jockey,ownerId='',racePurse=250000,raceId='1999-MAJOR-RACE'){
  if(!jockey||jockey.role!=='jockey')return null;
  const race=String(raceId||'1999-MAJOR-RACE');
  const fee=jockey.compensation?.mountFee||0;
  const quality=clamp((jockey.ability.current*.58+jockey.reputation.overall*.42)/100,0,1);
  const prestige=clamp(Math.log10(1+Math.max(0,Number(racePurse)||0)/15000)/1.7,0,1);
  const demand=clamp(.15+.55*quality+.2*prestige+.1*unit(seed,jockey.id+':market-demand'),0,1);
  const count=Math.max(0,Math.min(5,Math.floor(demand*6)-1));
  const pool=leadingOwnerCandidates();
  const competing=[];
  const used=new Set(ownerId?[ownerId]:[]);
  for(let k=0;k<count&&k<pool.length;k++){
   const i=pool[(hash(seed,jockey.id+':'+race+':rival:'+k)+k)%pool.length];
   const owner=ownerAt(i);
   if(used.has(owner.id))continue;used.add(owner.id);
   const premium=(.7+unit(seed,owner.id+jockey.id+':fee')*1.3)*demand;
   competing.push({ownerId:owner.id,ownerName:owner.name,teamTier:owner.portfolio.tier,
    projectedMountOffer:money(fee*(1+premium)*owner.negotiation.mountFeeTolerance),
    projectedWinCommission:round(clamp(jockey.compensation.winShareRate+
     .012*owner.negotiation.commissionFlexibility,0.08,0.125)),
    offerStatus:'SIMULATED_INTEREST_NOT_BOOKED'});
  }
  const sourceIndex=ownerId?sourceOrgs.findIndex(o=>o.id===ownerId):-1;
  const generatedMatch=/^O-TEST-1999-(\d+)$/.exec(String(ownerId||''));
  const ownerIndex=sourceIndex>=0?sourceIndex:generatedMatch?Number(generatedMatch[1])-1:-1;
  const requestedOwner=ownerIndex>=0&&ownerIndex<ownersTotal?ownerAt(ownerIndex):null;
  const playerTolerance=requestedOwner?.negotiation.mountFeeTolerance||1;
  return {raceId:race,assumedRacePurse:money(racePurse),
   demandTier:demand>=.77?'ELITE':demand>=.58?'HIGH':demand>=.4?'ACTIVE':'LOCAL',
   demandScore:Math.round(demand*100),competingBarns:competing,
   suggestedMountFee:money(fee*(1+.55*demand)*playerTolerance),
   suggestedWinCommission:round(clamp(jockey.compensation.winShareRate+.006*demand,0.085,.125)),
   relationshipPriority:round(quality*.6+jockey.compensation.winShareRate*.4),
   status:'MARKET_FORECAST_ONLY_NO_BOOKINGS',provenance:'1999_TEST_BOOKING_COMPETITION_NOT_REAL_OFFERS'};
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
  const repScore=standing(seed,id,.2+unit(seed,id+'standing')*.65);
  const quality=clamp((ageAbility.current*.58+repScore.overall*.42)/100,0,1);
  const feeFactor=.82+unit(seed,id+':contract-negotiation')*.36;
  const jockey=role==='jockey';
  const jockeyMountFee=money((32+46*Math.pow(quality,1.5))*feeFactor);
  const jockeyWinRate=round(.09+.02*quality);
  // Jockey compensation is not a guaranteed salary. Gross projection includes
  // the winning-place/show commission and mount fee opportunity assumptions.
  const jockeyGross=money((180+Math.round(780*quality))*
   (jockeyMountFee+75+1300*Math.pow(quality,3.5))*
    (.86+.28*unit(seed,id+':bookings')));
  const compensation=jockey?{role:'JOCKEY',basis:'1999_TEST_MOUNT_AND_PURSE_FEES',
   mountFee:jockeyMountFee,winShareRate:jockeyWinRate,secondShareRate:.05,thirdShareRate:.05,
   projectedAnnualGross:jockeyGross,currency:'USD',notGuaranteedSalary:true}:null;
  const person={id,name:namedPeople[index].name,birthCountry:namedPeople[index].birthCountry,
    nameOrigin:'GEO_ROLE_TEST_POPULATION',
   nameStatus:'TEST_RENAME_ALLOWED',role,location:track.location,baseTrackId:track.id,
   ability:ageAbility,attributes:traits([...common,...(roleDef[role]||[])],seed,id,ageAbility),
   reputation:repScore,payrollAnnual:jockey?0:money(18000+unit(seed,id+'pay')*90000),
   compensation,bookingDemand:jockey?{tier:quality>.83?'ELITE':quality>.65?'HIGH':quality>.4?'COMPETITIVE':'LOCAL',
    baselineDemand:Math.round((.15+.75*quality)*100),
    market:'MAJOR_RACE_INTEREST_SIMULATED_NOT_CONFIRMED'}:null,
   age:ageInfo.age,ageBasis:ageInfo.basis,morale:round(.3+unit(seed,id+':morale')*.68),workload:round(.2+unit(seed,id+':load')*.7),licenseStatus:'SIMULATED_TEST_ACTIVE',source:'SIMULATED_WORKFORCE'};
  if(jockey)person.bookingMarket=jockeyBookingMarket(person,'',250000,'MAJOR_RACE_MARKET');
  return person;
 }
 function meetOpen(track,date){
  return trackMeetOpen1999(track.sourceTrackId||track.id,date);
 }
 function conditionBook(date,trackIndex){
  if(typeof date!=='string'||!/^1999-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+'T12:00:00Z')))throw Error('1999 date required');
  const track=trackAt(trackIndex);if(!meetOpen(track,date))return [];
  const count=track.racing.racesPerCard,classes=['Maiden Special Weight','Maiden Claiming','Claiming','Allowance','Allowance Optional Claiming','Starter Allowance','Handicap','Open Allowance','Claiming','Maiden Special Weight'];
  const result=[];
  for(let n=1;n<=count;n++){
   const id='R-TEST-1999-'+date.replaceAll('-','')+'-'+pad(trackIndex+1,3)+'-'+pad(n,2),cl=classes[(n+trackIndex)%classes.length],
    minAge=2+hash(seed,id+':age')%3,sprint=unit(seed,id+':dist')<.52;
   const maidenOnly=cl.startsWith('Maiden'),claiming=cl.includes('Claiming');
   const claimingPrice=claiming?[10000,15000,20000,25000,35000,50000][hash(seed,id+':claim')%6]:null;
   const maxCareerWins=cl==='Allowance'?1:null;
   const winRestriction=maidenOnly?'Maidens (horses without a career win)':
    maxCareerWins!==null?'Non-winners of two lifetime races':
    cl==='Starter Allowance'?'Prior qualifying claiming start required — records not yet modeled':
    cl==='Allowance Optional Claiming'?'Allowance qualification or optional claiming entry — terms not yet modeled':
    cl==='Handicap'?'Handicap weights pending declaration':'Open to eligible starters';
   const females=hash(seed,id+'female')%7===0;
   const fullConditions=cl+'; '+minAge+' years old and upward; '+(females?'fillies and mares only':'open sexes')+
    '; '+winRestriction+(claimingPrice?' · modeled claiming price $'+claimingPrice.toLocaleString('en-US'):'')+
    '. Remaining official terms and nominations are not supplied in this TEST condition book.';
   result.push({id,date,trackId:track.id,trackName:track.name,number:n,conditions:cl,
    maidenOnly,maxCareerWins,claimingPrice,winRestriction,fullConditions,
    weightConditions:'Assigned weights and allowances pending; no official impost recorded',
    entryTerms:'No official entry deadline or nomination terms recorded',
    ageRequirement:minAge+'YO+',sexRestriction:females?'FILLIES_AND_MARES':'OPEN',
    surface:trackCardSurface1999(track.sourceTrackId||track.id,n)||'DIRT',distanceFurlongs:sprint?6+hash(seed,id+'sprint')%3:8+hash(seed,id+'route')%5,
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
  if(index<trainersTotal+900){const i=index-trainersTotal,id='F-TEST-FARM-'+pad(i+1);
   const hub=NORTH_AMERICAN_FOALING_HUBS[hash(seed,id+':breeding-hub')%NORTH_AMERICAN_FOALING_HUBS.length];
   const locality={city:hub[0],state:hub[1],country:hub[2]};
   const t=regionTrack(locality,id);
   return {id,name:generatedOrganizationName(seed,i+8000,'farm'),
   type:'BREEDING_FARM',location:locality,trackId:t.id,capacity:80+hash(seed,id+'cap')%350,occupied:0,
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
 for(const h of locked){const idx=trackIndexById.get(h.openingStable?.trackId);
  // Preserve the original overseas historic stable in canon, but never add an
  // overseas venue to the playable 1999 track economy.
  if(idx===undefined)continue;
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

 // Strictly disjoint world registry partitions. Original H-TEST-1999 names/IDs,
 // existing 60,000 broodmare IDs and 1,400 sire IDs never move.
 const WORLD_CORE_END=HORSE_POPULATION;
 const WORLD_MARE_END=WORLD_CORE_END+MARE_BREEDING_STOCK;
 const WORLD_SIRE_END=WORLD_MARE_END+STALLION_BREEDING_STOCK;
 const WORLD_EXTRA_COUNT=WORLD_HORSE_POPULATION-WORLD_SIRE_END;
 const WORLD_COHORTS=Object.freeze([
  {kind:'YEARLING',count:36250,foalYear:1998},
  {kind:'TWO_YEAR_OLD',count:36250,foalYear:1997},
  {kind:'RACING_AGE',count:70000},
  {kind:'RETIRED',count:WORLD_EXTRA_COUNT-142500}
 ]);
 if(WORLD_EXTRA_COUNT<142500||WORLD_COHORTS.some(c=>c.count<0)||
    WORLD_COHORTS.reduce((n,c)=>n+c.count,0)!==WORLD_EXTRA_COUNT)
  throw Error('Invalid 325k population partition');
 const WORLD_EXTRA_CACHE_LIMIT=256,extraHorseCache=new Map();
 function worldPartition(index){
  if(!Number.isInteger(index)||index<0||index>=WORLD_HORSE_POPULATION)
   throw Error('World horse index outside 1999 registry');
  if(index<WORLD_CORE_END)return {kind:'REGISTERED',offset:index};
  if(index<WORLD_MARE_END)return {kind:'BROODMARE',offset:index-WORLD_CORE_END};
  if(index<WORLD_SIRE_END)return {kind:'STALLION',offset:index-WORLD_MARE_END};
  let local=index-WORLD_SIRE_END;
  for(const cohort of WORLD_COHORTS){
   if(local<cohort.count)return {kind:cohort.kind,offset:index-WORLD_SIRE_END,cohortIndex:local};
   local-=cohort.count;
  }
  throw Error('World horse partition exhausted');
 }
 function breedingDirectoryAt(index,sex){
  const sire=sex==='SIRE',id='H-TEST-'+(sire?'SIRE':'DAM')+'-'+pad(index+1,6);
  const age=1999-(sire?1970+index%12:
    index<damCount?1971+index%13:1979+hash(seed,id+':foal-year')%16);
  const ability=createAgeAbility({seed,id,role:'horse',age});
  const farmIndex=index%900,owner=ownerAt(hash(seed,id+':owner')%ownersTotal);
  const mae=sire?null:mare1999(index),standing=sire?hash(seed,id+':1999-active-stud')%100<80:false;
  return {id,name:mixName(seed+1,sire?index+100000:index+101500),
   age,foalYear:1999-age,sex:sire?'STALLION':'MARE',ownerId:owner.id,trainerId:'',
   breederId:owner.id,homebred:true,sireId:'',damId:'',sire:'',dam:'',
   trackId:'',farmId:'F-TEST-FARM-'+pad(farmIndex+1),canonical:false,
   status:sire?(standing?'STANDING':'RETIRED_STUD'):
    !mae.active?'RESTING':mae.covered?'COVERED_1999_TEST':'AVAILABLE_FOR_COVER',
   ca:ability.currentStars,pa:ability.potentialStars,registryGroup:sire?'STALLION':'BROODMARE'};
 }
 function additionalWorldHorseAt(index){
  if(!Number.isInteger(index)||index<0||index>=WORLD_EXTRA_COUNT)
   throw Error('Additional world horse index');
  let local=index,cohort=null;
  for(const item of WORLD_COHORTS){if(local<item.count){cohort=item;break}local-=item.count}
  if(!cohort)throw Error('Additional world cohort missing');
  const id='H-TEST-WORLD-1999-'+pad(index+1,6);
  const foalYear=cohort.foalYear??(cohort.kind==='RACING_AGE'?
   1996-hash(seed,id+':cohort-age')%7:
   1977+hash(seed,id+':retirement-year')%17);
  const age=1999-foalYear;
  const sex=age<=2?pick(['COLT','FILLY'],seed,id+':sex'):
   pick(['GELDING','MARE','STALLION','GELDING','MARE'],seed,id+':sex');
  const owner=ownerAt(hash(seed,id+':owner')%ownersTotal);
  const trainer=cohort.kind==='RETIRED'||cohort.kind==='YEARLING'?null:
   trainerAt(hash(seed,id+':trainer')%trainersTotal);
  const homebred=hash(seed,id+':homebred')%100<48;
  const breeder=homebred?owner:ownerAt(hash(seed,id+':breeder')%ownersTotal);
  const sireIndex=hash(seed,id+':sire')%sireCount;
  const damIndex=hash(seed,id+':dam')%MARE_BREEDING_STOCK;
  const sireId='H-TEST-SIRE-'+pad(sireIndex+1,6);
  const damId='H-TEST-DAM-'+pad(damIndex+1,6);
  const abi=createAgeAbility({seed,id,role:'horse',age,pedigree:{sireId,damId}});
  const status=cohort.kind==='YEARLING'?'YEARLING':
   cohort.kind==='TWO_YEAR_OLD'?'PRE_RACE_DEVELOPMENT':
   cohort.kind==='RETIRED'?'RETIRED':
   hash(seed,id+':layoff')%9===0?'RESTING':'IN_TRAINING';
  return {id,name:mixName(seed+4,index+124000),age,foalYear,sex,
   status,ownerId:owner.id,trainerId:trainer?.id||'',breederId:breeder.id,
   sireId,damId,sire:mixName(seed+1,sireIndex+100000),
   dam:mixName(seed+1,damIndex+101500),homebred,
   trackId:trainer?.homeTrackId||'',canonical:false,
   ca:abi.currentStars,pa:abi.potentialStars,registryGroup:cohort.kind,
   farmId:'F-TEST-FARM-'+pad(1+hash(seed,breeder.id+':foaling-farm')%900)};
 }
 function worldHorseDirectoryAt(index){
  const where=worldPartition(index);
  let record;
  if(where.kind==='REGISTERED')record=horseDirectoryAt(where.offset);
  else if(where.kind==='BROODMARE')record=breedingDirectoryAt(where.offset,'DAM');
  else if(where.kind==='STALLION')record=breedingDirectoryAt(where.offset,'SIRE');
  else record=additionalWorldHorseAt(where.offset);
  return {...record,index,registryGroup:where.kind};
 }
 function worldHorseAttributeAt(index,key){
  const def=horseTraitDefinitions.get(String(key||''));
  if(!def)throw Error('Unknown world horse trait '+key);
  const where=worldPartition(index);
  if(where.kind==='REGISTERED')return horseAttributeAt(where.offset,key);
  const horse=worldHorseDirectoryAt(index),ability=createAgeAbility({
   seed,id:horse.id,role:'horse',age:horse.age,
   pedigree:where.kind==='BROODMARE'||where.kind==='STALLION'?undefined:
    {sireId:horse.sireId,damId:horse.damId}});
  return traits([def],seed,horse.id,ability)[def.key];
 }
 function worldHorseAt(index){
  const where=worldPartition(index);
  if(where.kind==='REGISTERED')return horseAt(where.offset);
  if(where.kind==='BROODMARE'||where.kind==='STALLION'){
   const record=parentAt(where.offset,where.kind==='STALLION'?'SIRE':'DAM');
   const profile=worldHorseDirectoryAt(index);
   return {...record,worldIndex:index,ownerId:profile.ownerId,
    breederId:profile.breederId,homebred:profile.homebred,
    racingStatus1999:profile.status,registryGroup:where.kind};
  }
  const key=where.offset;
  if(extraHorseCache.has(key)){
   const value=extraHorseCache.get(key);
   extraHorseCache.delete(key);extraHorseCache.set(key,value);return value;
  }
  const meta=additionalWorldHorseAt(key),age=meta.age;
  const ability=createAgeAbility({seed,id:meta.id,role:'horse',age,
   pedigree:{sireId:meta.sireId,damId:meta.damId}});
  const farm=facilityAt(trainersTotal+hash(seed,meta.breederId+':foaling-farm')%900);
  const record={...meta,worldIndex:index,ageAtOpening:age,ability,
   attributes:traits(hor,seed,meta.id,ability),
   foalingGeography:{locality:farm.location.city,region:farm.location.state,
    country:farm.location.country,
    countryCode:farm.location.country==='Canada'?'CA':'US',
    authority:'SIMULATED_1999_ADDITIONAL_POPULATION'},
   breedingFarmId:farm.id,breedingFarm:farm.name,
   racingStatus1999:meta.status,career:{starts:0,wins:0,seconds:0,thirds:0,
    earnings:0,raceHistory:[],
    provenance:'1999_ADDITIONAL_POPULATION_NO_VERIFIED_RACE_RESULTS'},
   authority:'TEST_ADDITIONAL_1999_POPULATION_NOT_HISTORICAL_FACT'};
  extraHorseCache.set(key,record);
  if(extraHorseCache.size>WORLD_EXTRA_CACHE_LIMIT)
   extraHorseCache.delete(extraHorseCache.keys().next().value);
  return record;
 }
 function worldIndexByHorseId(id){
  const value=String(id||'');
  const extra=/^H-TEST-WORLD-1999-(\d{6})$/.exec(value);
  if(extra){const index=Number(extra[1])-1;
   return index>=0&&index<WORLD_EXTRA_COUNT?WORLD_SIRE_END+index:-1;}
  const mare=/^H-TEST-DAM-(\d{6})$/.exec(value);
  if(mare){const index=Number(mare[1])-1;
   return index>=0&&index<MARE_BREEDING_STOCK?WORLD_CORE_END+index:-1;}
  const sire=/^H-TEST-SIRE-(\d{6})$/.exec(value);
  if(sire){const index=Number(sire[1])-1;
   return index>=0&&index<STALLION_BREEDING_STOCK?WORLD_MARE_END+index:-1;}
  const test=/^H-TEST-1999-(\d+)$/.exec(value);
  if(test){const index=Number(test[1])-1+(anchored?locked.length:0);
   return index>=0&&index<HORSE_POPULATION?index:-1;}
  return anchored?locked.findIndex(h=>h.id===value):-1;
 }

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
  counts:{horses:HORSE_POPULATION,worldHorses:WORLD_HORSE_POPULATION,
   populationAdditional:WORLD_EXTRA_COUNT,
   populationGroups:{registered:HORSE_POPULATION,broodmares:MARE_BREEDING_STOCK,
    stallions:STALLION_BREEDING_STOCK,additional:WORLD_EXTRA_COUNT},
   canonicalHorses:anchored?CANON_HORSES:0,generatedHorses:generatedCount,owners:ownersTotal,trainers:trainersTotal,
   people:peopleCount+(anchored?sourcePeople.length:0),tracks:trackCount,nonPlayableInternationalTracks:canon.tracks.length-trackCount,
   facilities:trainersTotal+900+trackCount,breedingFarms:900,
   breedingMares:MARE_BREEDING_STOCK,breedingStallions:STALLION_BREEDING_STOCK,auctions:36,
   sourceStallions:anchored?canon.activeStallions1999.length:0,sourceBroodmareLocations:anchored?canon.productionBroodmareBoarding1999.length:0},
  ownerAt,trainerAt,trackAt,horseAt,horseDirectoryAt,horseAttributeAt,worldHorseAt,worldHorseDirectoryAt,worldHorseAttributeAt,worldIndexByHorseId,worldPartition,personAt,jockeyBookingMarket,sourcePersonAt,projectAtDate,auctionAt,facilityAt,conditionBook,ownedHorseIndexes,horseNameStatus:'TEST_NAMES_MAY_BE_REPLACED_AFTER_NAMING_ENGINE_UPDATES',
  parentAt,mareDirectoryAt,annualFoalingForecast,attributeCatalog,sourceStakes:anchored?canon.stakes1999.filter(r=>sourceTracks.some(t=>t.id===r.trackId)).map(applyVerifiedStakeDay1999):[],
   sourceOrganizations:sourceOrgs,sourcePeople,excludedActiveStaffRoles:['groom','exercise_rider'],
  audit:{ownershipSlots:ownersSlots.counts.reduce((a,b)=>a+b,0),trainerSlots:trainerSlots.counts.reduce((a,b)=>a+b,0),
   maxOwnerHorses:Math.max(...ownersSlots.counts),minOwnerHorses:Math.min(...ownersSlots.counts),
   maxTrainerHorses:Math.max(...trainerSlots.counts),minTrainerHorses:Math.min(...trainerSlots.counts)}};
}
