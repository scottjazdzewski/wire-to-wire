/*
 * WTW fictional 1999 organization naming ecology.
 * These names are GAME TEST identities, never replacements for historical canon.
 * One seeded registry protects names across owners, barns and farms.
 * Entity IDs, locations, ownership, and horse links are outside this module.
 */
import {
 ORGANIZATION_STYLE_MODEL,organizationNamingRegion,organizationNamingEra,
 contextualFarmCandidate,contextualOwnerCandidate,contextualStableCandidate,
 contextualBreakingCandidate,REGIONAL_NAMING_ANCHORS
} from './organization-naming-styles.mjs';
export const ORGANIZATION_NAME_MODEL='WTW_1999_ORGANIZATION_NAMING_V4';

const SURNAMES='Abbott|Adler|Ainsworth|Aldridge|Allen|Alston|Anderson|Archer|Armstrong|Ashford|Atkins|Atwood|Baird|Baldwin|Banks|Barlow|Barnes|Barrett|Baxter|Beckett|Bellamy|Bennett|Benton|Berryman|Bishop|Blackwell|Blair|Bledsoe|Bolton|Boone|Bradford|Bradshaw|Brennan|Brooks|Browning|Buchanan|Burke|Burnett|Byrne|Caldwell|Callahan|Calvert|Campbell|Carleton|Carson|Carter|Chambers|Chandler|Chapman|Clark|Clayton|Clements|Clifton|Coleman|Collins|Connelly|Conrad|Cooper|Corbett|Crawford|Cullen|Dalton|Danvers|Davenport|Dawson|Delaney|Dixon|Donovan|Doyle|Draper|Dunbar|Duncan|Ellison|Emerson|Everett|Fairchild|Farrow|Ferguson|Fisher|Fitzgerald|Fleming|Fletcher|Forbes|Foster|Franklin|Frazier|Gaines|Gallagher|Garrison|Gentry|Gibson|Gilbert|Gillespie|Gordon|Graham|Granger|Grant|Graves|Griffin|Guthrie|Hale|Haley|Hamilton|Hancock|Hardin|Harper|Harrington|Harris|Hartley|Hawkins|Hayes|Henderson|Hensley|Hollis|Holmes|Holt|Horton|Howard|Hudson|Hughes|Hunt|Ingram|Irving|Jackson|Jarrett|Jennings|Keller|Kendall|Kennedy|Keene|Kerr|Kincaid|King|Kirkland|Lancaster|Langley|Lawrence|Lawson|Leighton|Lennox|Lloyd|Lowell|Maddox|Manning|Marshall|Mason|McAllister|McBride|McCarthy|McConnell|McDowell|McIntyre|McKay|Mercer|Merritt|Mitchell|Monroe|Montgomery|Morgan|Morrison|Murphy|Nelson|Newman|Nichols|Nolan|Norton|OBrien|OConnor|Odom|Osborne|Owens|Parker|Parrish|Patterson|Payne|Pearson|Pemberton|Perkins|Perry|Phillips|Pierce|Porter|Prescott|Price|Quinn|Ramsey|Randolph|Reed|Reynolds|Rhodes|Riley|Robbins|Roberts|Robertson|Rogers|Rowan|Russell|Rutledge|Sampson|Sawyer|Schneider|Scott|Shaw|Shepherd|Sherman|Simmons|Sinclair|Sloane|Spencer|Stafford|Stanford|Stanton|Stevens|Stewart|Stone|Stratton|Sullivan|Sutton|Talbot|Tanner|Taylor|Thatcher|Thomas|Thompson|Thornton|Turner|Vance|Vaughn|Walker|Wallace|Walsh|Warren|Watson|Weller|Wells|Weston|Whitaker|Whitcomb|White|Whittaker|Wilcox|Williams|Willis|Wilson|Winters|Woodard|Woodward|Wright|Yates|Young'.split('|');
const LAND='Ashbourne|Briarfield|Bridlewood|Brookhaven|Buckeye|Calder|Camden|Canebrake|Carriage Hill|Cedar Vale|Chapel Hill|Chesapeake|Chestnut Hollow|Claremont|Clear Fork|Clearwater|Cloverleaf|Coldstream|Copper Run|Cottonwood|Crescent Mile|Cypress Bend|Deerfield|Dry Creek|Eastfield|Elk River|Elmwood|Fairhaven|Fairview|Far Hills|Fern Hill|Fieldstone|Flat Rock|Foxcroft|Foxglove|Fox Hollow|Gallant Hill|Glenarden|Glenview|Goldcrest|Grand Oaks|Greenfield|Greenway|Hawthorne|Hazelbrook|Heather Glen|Highfield|Highland|Hillcroft|Hillview|Holly Springs|Horse Creek|Ironwood|Juniper|Kingsmere|Larkspur|Laurel Hill|Laurelwood|Limestone|Little Fork|Longbranch|Longford|Maple Grove|Mapleton|Marshfield|Meadowgate|Mill Creek|Millbrook|Millstone|Monarch Hill|Montclair|Morningside|Northfield|Oak Glen|Oak Hill|Oakleigh|Oakridge|Old Mill|Old Orchard|Oldfield|Overbrook|Overlook|Pinecroft|Pinegrove|Pine Hill|Pinehurst|Prairie Hill|Quail Run|Quarry Hill|Red Bank|Red Clay|Red Fox|Red Gate|Red Oak|Ridgecrest|Ridgefield|Riverbend|Rivergate|Riverton|Rockford|Rock Haven|Rock Ridge|Rosecroft|Rose Hill|Rosewood|Round Hill|Sagebrush|Sandstone|Seven Oaks|Shady Grove|Silverleaf|Southbank|Springbrook|Springfield|Springhill|Stillwater|Stonebrook|Stonefield|Stonegate|Stonehaven|Stoneleigh|Stonewall|Sugar Creek|Sunnyside|Sweetwater|Sycamore|Tall Oaks|Tanglewood|Thornfield|Three Oaks|Timbercrest|Timberlake|Timberline|Twin Rivers|Valley Forge|Valleyview|Walnut Grove|Westfield|Westhaven|Westover|White Fence|Whitehall|White Oak|Wildflower|Willowbend|Willowbrook|Willowfield|Windfield|Windham|Windward|Woodcrest|Woodfield|Woodhaven|Woodland|Woodside'.split('|');
const PLACES='Bluewater|Breakwater|Broadway|Canal Street|Capstone|Century|Charter|Commonwealth|Crossroads|Deepwater|Eastgate|Evergreen|Fairmont|First Post|Frontier|Gatehouse|Granite|Greenbrier|Hearthside|Heritage|Highpoint|Iron Gate|Landmark|Longview|Market Street|Meridian|Milepost|Northbound|Northstar|Old Dominion|Overland|Pacesetter|Parkland|Piedmont|Portside|Prospect|Railhead|Redline|Reservoir|River City|Saddleback|Seaboard|Second Street|Shoreline|Southgate|Summit|Tidewater|Trade Wind|Union Hill|Upland|Westbridge|Westline|Westport|Whitestone'.split('|');

const OWNER_SUFFIX=['Racing','Thoroughbreds','Stable','Stables','Racing Partners','Racing Club','Bloodstock','Racing Partnership','Racing Group','Racing Syndicate'];
const FARM_END=['Farm','Farm','Farms','Thoroughbred Farm','Farmstead'];
const STUD_END=['Stud','Stud','Stud Farm','Stallion Station','Stallion Farm','Thoroughbred Stud'];
const NURSERY_END=['Nursery','Thoroughbred Nursery','Farm & Nursery'];
const BLOODSTOCK_END=['Bloodstock Farm','Bloodstock','Bloodstock Operation','Thoroughbreds'];
const TRAINING_END=['Training Center','Breaking & Training','Pre-Training','Young Horse Development','Starting & Training','Equine Training Center','Training Farm','Training Grounds','Colt Starting','Equine Development'];
const CLUB_ROOTS='First Turn|Backstretch|Two Furlongs|Finish Line|Clubhouse|Homestretch|Starting Gate|Quarter Pole|Final Furlong|Grandstand|Paddock|First Call|Second Call|Last Turn|Morning Works|Railbird|Silks|Photo Finish|Jockey Club|Saddle Room|Turf Club|Race Day|Morning Line|North Rail|South Rail|Backstretch Gate|Home Turn|Post Parade'.split('|');
const FAMILY_SUFFIX='Family Racing|Family Stables|Family Thoroughbreds|Family Partnership'.split('|');
const LANDMARK='Autumn Grove|Black Walnut|Blue Heron|Cedar Bluff|Cedar Lane|Clover Hill|Dry Stone|Elm Ridge|Fair Oaks|Fox Den|Golden Valley|High Meadow|Iron Gate|Little River|Long Pasture|Old Bridge|Old Gate|Old School|Red Barn|Red Rock|River Stone|Round Oak|Silver Creek|Stone Fence|Stone House|Sycamore Lane|Three Maples|White Birch|White Post|Willow Lane|Winter Hill|Winding Creek'.split('|');
const TOPO='Bluff|Branch|Brook|Chase|Crossing|Downs|Fields|Ford|Glen|Grove|Hollow|Knoll|Landing|Meadow|Mill|Oaks|Pasture|Place|Ridge|Run|Spring|Vale|Valley|Wood'.split('|');
const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'');
const trailing=/(?:\s+(?:Bloodstock\s+Holdings|Bloodstock\s+Partners|Racing\s+Holdings|Thoroughbred\s+Ventures|Racing\s+Ventures|Racing\s+Associates|Thoroughbred\s+Stud|Pre-Training\s+Center|Horse\s+Development|Equine\s+Starting|Thoroughbred\s+Nursery|Thoroughbred\s+Farm|Bloodstock\s+Stud|Bloodstock\s+Farm|Bloodstock\s+Operation|Stallion\s+Station|Stallion\s+Farm|Stud\s+Farm|Farm\s+&\s+Nursery|Foaling\s+Farm|Nursery\s+Farm|Bloodstock\s+&\s+Breeding|Racing\s+&\s+Breeding|Young\s+Horse\s+Development|Equine\s+Training\s+Center|Equine\s+Development|Racing\s+Partnership|Racing\s+Partners|Racing\s+Syndicate|Racing\s+Group|Racing\s+Club|Racing\s+Stables|Racing\s+Stable|Racing\s+Team|Racing\s+Operation|Training\s+Center|Training\s+Grounds|Training\s+Farm|Training\s+Barn|Training\s+Yard|Race\s+Barn|Race\s+Stable|Breaking\s+&\s+Training|Starting\s+&\s+Training|Pre-Training|Colt\s+Starting|Racehorse\s+Partnership|Family\s+Partnership|Family\s+Thoroughbreds|Family\s+Racing|Family\s+Stables|Thoroughbreds|Partnership|Syndicate|Partners|Stables|Stable|Bloodstock|Nursery|Farmstead|Farms|Farm|Acres|Stud|Training|Racing))$/i;
const rootOf=name=>String(name).replace(trailing,'').replace(/^the\s+/i,'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
function hash(seed,key){
 let h=(2166136261^(seed>>>0))>>>0;
 for(const c of String(key)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
 h^=h>>>16;h=Math.imul(h,2246822507);h^=h>>>13;
 return h>>>0;
}
const draw=(arr,seed,key)=>arr[hash(seed,key)%arr.length];
const style=(seed,kind,i,attempt)=>hash(seed,kind+':'+i+':'+attempt+':style')%100;
const surname=name=>{
 const cleaned=String(name||'').replace(/^(Dr|Mr|Mrs|Ms)\.\s*/i,'')
  .replace(/\s+(Jr\.?|Sr\.?|II|III|IV)$/i,'');
 return cleaned.split(/\s+/).at(-1)||'Stable';
};
const rareFamily=(s,frequency)=>frequency.get(norm(s))<=1;
const stemKey=candidate=>{
 let s=String(candidate).replace(/^the\s+/i,'').trim().replace(trailing,'');
 const words=s.split(/\s+/);
 return norm(words.length>1?words.slice(0,2).join(' '):s);
};
const isMeaningfullySimilar=(candidate,usedRoots)=>{
 // Catch suffix-swaps, accents/punctuation differences and rooted clones.
 const root=rootOf(candidate);
 if(usedRoots.has(root))return true;
 return false;
};
// Identity-level exact collisions are insufficient for a management game's
// business directory: "Union Hill Racing", "Union Hill Farm" and
// "Union Hill Bloodstock" must not appear twenty times in one world.
// Prefixes are taken from the actual place/land/racing-language lexicons;
// longer phrases win over single words ("Old Dominion" before "Old").
const MAX_DISTINCTIVE_ROOT_USES=6;
const LANDMARK_ANCHORS=[...new Set([...LAND,...PLACES,...LANDMARK,...CLUB_ROOTS,...REGIONAL_NAMING_ANCHORS].map(rootOf))]
 .sort((a,b)=>b.length-a.length);
const distinctiveRoot=name=>{
 const root=rootOf(name);
 return LANDMARK_ANCHORS.find(a=>root===a||root.startsWith(a+' '))||null;
};
function classifyFarm(seed,i){
 const k=hash(seed,'farm:'+i+':purpose')%100;
 return k<26?'STUD_FARM':k<81?'FARM':k<93?'THOROUGHBRED_NURSERY':'BLOODSTOCK_FARM';
}
function farmName(seed,i,attempt,kind){
 const k='farm:'+i+':'+attempt;
 const land=draw(LAND,seed,k+':land');
 const place=draw(PLACES,seed,k+':place');
 const family=draw(SURNAMES,seed,k+':family');
 const geo=draw(TOPO,seed,k+':geo');
 const landmark=draw(LANDMARK,seed,k+':landmark');
 const suffix=draw(kind==='STUD_FARM'?STUD_END:kind==='THOROUGHBRED_NURSERY'?NURSERY_END:kind==='BLOODSTOCK_FARM'?BLOODSTOCK_END:FARM_END,seed,k+':suffix');
 const roll=style(seed,'farm',i,attempt);
 let stem;
 if(roll<28)stem=land;
 else if(roll<44)stem=family;
 else if(roll<55)stem=land+' '+geo;
 else if(roll<67)stem=family+' '+geo;
 else if(roll<77)stem=landmark;
 else if(roll<84)stem=place;
 else if(roll<90)stem=place+' '+geo;
 else if(roll<96)stem=family+' '+draw(['House','Place','Estate','Fields'],seed,k+':family-place');
 else stem=draw(['Old','New','Lower','Upper','West','East'],seed,k+':direction')+' '+draw(LANDMARK,seed,k+':landmark2');
 return stem+' '+suffix;
}
function ownerName(seed,i,attempt,principal,alignPrincipalSurname=false,preferredFamily=''){
 const k='owner:'+i+':'+attempt;
 // In new fictional worlds, a surname-bearing owner business belongs to its
 // declared principal's family, not to an unrelated randomly sampled family.
 const family=alignPrincipalSurname&&principal?(preferredFamily||surname(principal)):draw(SURNAMES,seed,k+':family');
 const second=draw(SURNAMES,seed,k+':family2');
 const land=draw(LAND,seed,k+':land');
 const place=draw(PLACES,seed,k+':place');
 const club=draw(CLUB_ROOTS,seed,k+':club');
 const suffix=draw(OWNER_SUFFIX,seed,k+':suffix');
 const roll=style(seed,'owner',i,attempt);
 if(roll<15)return family+' '+suffix;
 if(roll<26)return family+' & '+second+' '+draw(['Racing','Partners','Bloodstock'],seed,k+':duo');
 if(roll<37)return land+' '+suffix;
 if(roll<48)return place+' '+suffix;
 if(roll<59)return family+' '+draw(FAMILY_SUFFIX,seed,k+':family');
 if(roll<68)return 'The '+club+' '+draw(['Partnership','Racing Club','Syndicate','Racing Partners'],seed,k+':club-end');
 if(roll<79)return place+' '+family+' '+draw(['Racing','Thoroughbreds','Bloodstock'],seed,k+':combined');
 if(roll<89)return family+' '+draw(['Bloodstock Holdings','Racing Ventures','& Company Racing','Racing Associates'],seed,k+':company');
 if(roll<95&&principal)return principal+' '+draw(['Racing','Thoroughbreds','Stable'],seed,k+':principal');
 return land+' '+family+' '+draw(['Racing','Partners','Bloodstock'],seed,k+':tail');
}
function barnName(seed,i,attempt,trainer,familyIsRare,preferredFamily=''){
 const k='barn:'+i+':'+attempt;
 const full=String(trainer||'').trim()||draw(SURNAMES,seed,k+':fallback');
 const family=preferredFamily||surname(full);
 const roll=style(seed,'barn',i,attempt);
 // Sometimes the same full personal name is already an anchored owner or a
 // different named operation. Vary the business root, not just its suffix.
 // Preserve a traceable trainer surname while preventing business clones.
 if(attempt>=18){
  const landmark=draw([...LAND,...LANDMARK,...PLACES],seed,k+':reserve-landmark');
  return landmark+' '+family+' '+draw(['Racing Stable','Racing Stables','Training Barn','Racing'],seed,k+':reserve-style');
 }
 // Common family names require a full personal identity; do not generate dozens
 // of indistinguishable Smith Stables, Garcia Stables and Brown Racing entries.
 if(!familyIsRare){
  if(roll<34)return full+' Racing';
  if(roll<55)return full+' Stables';
  if(roll<70)return full+' Racing Stable';
  if(roll<84)return full+' Training Barn';
  if(roll<94)return full+' Race Barn';
  return full+' Racing Team';
 }
 if(roll<18)return family+' Racing';
 if(roll<32)return family+' Racing Stables';
 if(roll<44)return family+' Stable';
 if(roll<55)return family+' Training Barn';
 if(roll<67)return full+' Racing';
 if(roll<77)return full+' Stables';
 if(roll<87)return full+' Racing Stable';
 if(roll<94)return family+' Race Barn';
 return full+' Racing Team';
}
function breakingName(seed,i,attempt){
 const k='breaking:'+i+':'+attempt,roll=style(seed,'breaking',i,attempt);
 const land=draw(LAND,seed,k+':land'),place=draw(PLACES,seed,k+':place');
 const family=draw(SURNAMES,seed,k+':family');
 const landmark=draw(LANDMARK,seed,k+':landmark');
 const suffix=draw(TRAINING_END,seed,k+':suffix');
 // A small geographic vocabulary may be saturated by existing farms and
 // owners. Prefer an owner's family name plus locality instead of reusing
 // the same location root with yet another business suffix.
 if(attempt>=28)return family+' '+land+' '+suffix;
 if(roll<33)return land+' '+suffix;
 if(roll<55)return family+' '+suffix;
 if(roll<68)return landmark+' '+suffix;
 if(roll<81)return place+' '+suffix;
 if(roll<91)return family+' '+draw(['Horse Development','Equine Starting','Pre-Training Center'],seed,k+':profession');
 return land+' '+draw(TOPO,seed,k+':topo')+' '+suffix;
}
/**
 * Reserve all names before building the world so requests never affect names.
 * Authorized canon names are passed through unchanged and are never minted
 * by the synthetic generator. All four generated categories share a registry.
 */
export function createOrganizationNameRoster({
 seed,ownerCount,barnCount,farmCount,breakingCount=0,
 protectedNames=[],principalNames=[],trainerNames=[],sourceOwnerNames=[],farmKindPlan=null,
 alignPrincipalSurnames=false,principalPrimarySurnames=[],trainerPrimarySurnames=[],
 ownerContexts=[],farmContexts=[],trainerContexts=[],breakingContexts=[]
}){
 if(!Number.isSafeInteger(seed)||seed<1)throw Error('Invalid naming seed');
 for(const [items,count,label] of [[ownerContexts,ownerCount,'owner'],[farmContexts,farmCount,'farm'],
  [trainerContexts,barnCount,'trainer'],[breakingContexts,breakingCount,'breaking']]){
  if(!Array.isArray(items)||(items.length&&items.length!==count))
   throw Error('Invalid '+label+' naming contexts');
  if(items.some(x=>!x||typeof x!=='object'||!['HERITAGE','ESTABLISHED','CONTEMPORARY',undefined].includes(x.era)||
   x.region!==undefined&&!['KENTUCKY','FLORIDA','CALIFORNIA','NEW_YORK',
    'MID_ATLANTIC','ONTARIO','LOUISIANA','BRITAIN_IRELAND','GENERAL_NORTH_AMERICA'].includes(x.region)))
   throw Error('Unsupported '+label+' naming context');
 }
 for(const n of [ownerCount,barnCount,farmCount,breakingCount])
  if(!Number.isInteger(n)||n<0)throw Error('Invalid naming count');
 const used=new Set(protectedNames.map(norm).filter(Boolean));
 const roots=new Set(protectedNames.filter(s=>trailing.test(String(s))).map(rootOf).filter(Boolean));
 const protectedRoots=[...roots].filter(s=>s.length>=6);
 const stems=new Map(),distinctiveRootCounts=new Map();
 const perCategory={owner:0,barn:0,farm:0,breaking:0};
 let retries=0;
 const reserve=(candidate,kind)=>{
  const key=norm(candidate),root=rootOf(candidate),stem=stemKey(candidate);
  if(!key||key.length<5||used.has(key)||!root||isMeaningfullySimilar(candidate,roots))return false;
  // Protect distinctive prefixes of existing historic racing organizations;
  // do not mint e.g. "Kingsmere Valley Farm" beside "Kingsmere Farm".
  if(protectedRoots.some(old=>(root.startsWith(old)||old.startsWith(root))&&Math.min(root.length,old.length)>=7))return false;
  const landmarkRoot=distinctiveRoot(candidate);
  if(landmarkRoot&&(distinctiveRootCounts.get(landmarkRoot)||0)>=MAX_DISTINCTIVE_ROOT_USES)return false;
  // Repeating the same first two content words with a different third word
  // still produces an obviously templated directory; catch that as well.
  const limit=kind==='farm'?3:kind==='breaking'?4:kind==='owner'?4:10;
  if((stems.get(kind+':'+stem)||0)>=limit)return false;
  used.add(key);roots.add(root);stems.set(kind+':'+stem,(stems.get(kind+':'+stem)||0)+1);
  if(landmarkRoot)distinctiveRootCounts.set(landmarkRoot,(distinctiveRootCounts.get(landmarkRoot)||0)+1);
  perCategory[kind]++;return true;
 };
 const claim=(make,kind)=>{
  for(let attempt=0;attempt<512;attempt++){
   const candidate=make(attempt).replace(/\s+/g,' ').trim();
   if(reserve(candidate,kind)){retries+=attempt;return candidate}
  }
  throw Error('Organization name pool exhausted for '+kind+'; expand the name lexicon');
 };
 const owners=Array.from({length:ownerCount},(_,i)=>{
  if(sourceOwnerNames[i])return sourceOwnerNames[i];
  const principal=String(principalNames[i]||'').trim();
  // The legal name of a sole-owner operation intentionally equals its
  // principal's identity, not an independently generated business duplicate.
  if(i%11===0&&principal){used.add(norm(principal));return principal;}
  const preferred=principalPrimarySurnames[i]||surname(principal);
  const context=ownerContexts[i]||{};
  return claim(attempt=>attempt<48?
   contextualOwnerCandidate(seed,i,attempt,principal,alignPrincipalSurnames?preferred:'',context):
   ownerName(seed,i,attempt,principal,alignPrincipalSurnames,preferred),'owner');
 });
 const kindsAllowed=new Set(['FARM','STUD_FARM','THOROUGHBRED_NURSERY','BLOODSTOCK_FARM']);
 if(farmKindPlan!==null&&(!Array.isArray(farmKindPlan)||farmKindPlan.length!==farmCount||
  farmKindPlan.some(k=>!kindsAllowed.has(k))))throw Error('Invalid explicit farm-purpose plan');
 const farmKinds=farmKindPlan===null?Array.from({length:farmCount},(_,i)=>classifyFarm(seed,i)):[...farmKindPlan];
 const farms=Array.from({length:farmCount},(_,i)=>claim(a=>a<48?
  contextualFarmCandidate(seed,i,a,farmKinds[i],farmContexts[i]||{}):
  farmName(seed,i,a,farmKinds[i]),'farm'));
 const familyFrequency=new Map();
 for(let i=0;i<trainerNames.length;i++){
  const key=norm(trainerPrimarySurnames[i]||surname(trainerNames[i]));
  familyFrequency.set(key,(familyFrequency.get(key)||0)+1);
 }
 const barns=Array.from({length:barnCount},(_,i)=>{
  const family=trainerPrimarySurnames[i]||surname(trainerNames[i]);
  return claim(a=>a<48?
   contextualStableCandidate(seed,i,a,trainerNames[i],family,trainerContexts[i]||{}):
   barnName(seed,i,a,trainerNames[i],rareFamily(family,familyFrequency),family),'barn');
 });
 const breakingCenters=Array.from({length:breakingCount},(_,i)=>claim(a=>a<48?
  contextualBreakingCandidate(seed,i,a,breakingContexts[i]||{}):
  breakingName(seed,i,a),'breaking'));
 return {
  model:ORGANIZATION_NAME_MODEL,styleModel:ORGANIZATION_STYLE_MODEL,
  owners:Object.freeze(owners),barns:Object.freeze(barns),
  farms:Object.freeze(farms),farmKinds:Object.freeze(farmKinds),
  breakingCenters:Object.freeze(breakingCenters),
  summary:Object.freeze({owners:ownerCount,barns:barnCount,farms:farmCount,
   breakingTrainingFacilities:breakingCount,generatedNames:{...perCategory},retries,
   maxDistinctiveRootUses:MAX_DISTINCTIVE_ROOT_USES,
   highestDistinctiveRootUse:Math.max(0,...distinctiveRootCounts.values())})
 };
}
export function createBreakingTrainingNames(seed,count,protectedNames=[]){
 return createOrganizationNameRoster({
  seed,ownerCount:0,barnCount:0,farmCount:0,breakingCount:count,protectedNames
 }).breakingCenters;
}
