/**
 * Wire to Wire fictional 1999 racing organization name styles.
 *
 * Editorial naming vocabulary, not an official business registry. Region
 * describes the operation's ACTUAL market; "heritage" and "contemporary"
 * are naming styles, not claims about a business's founding date.
 *
 * Owner and trainer family names are passed in, NEVER invented as proof of
 * family links. This module draws candidates only and never writes game data.
 */
export const ORGANIZATION_STYLE_MODEL='WTW_FICTIONAL_RACING_ORGANIZATIONS_REGIONAL_V1';
const words=s=>Object.freeze(s.split('|').map(v=>v.trim()).filter(Boolean));
export const ORGANIZATION_NAMING_REGIONS=Object.freeze([
 'KENTUCKY','FLORIDA','CALIFORNIA','NEW_YORK','MID_ATLANTIC',
 'ONTARIO','LOUISIANA','BRITAIN_IRELAND','GENERAL_NORTH_AMERICA'
]);
const ROOTS=Object.freeze({
 KENTUCKY:words('Elkhorn Bend|Cane Ridge|White Limestone|Blue Ash|Dry Run|Sinking Spring|Clover Trace|Fox Creek|Ash Grove|Bourbon Trace|Ridgewood|Cedar Trace|Old Turnpike|Flat Lick|Hardin Creek|Springhouse|Limestone Hollow|Walnut Trace|Barrel Oak|North Elkhorn|Tates Creek|Hickory Run|Clover Bend|Copper Lick|Oak Meadow|Honeysuckle Ridge|Greenbriar'),
 FLORIDA:words('Orange Hammock|Silver Cypress|Palmetto Bend|Pine Hammock|Live Oak Trace|Spanish Moss|Blue Sink|Mossy Pine|Spring Glade|Citrus Lane|Sawgrass Run|Sabalo Oaks|Sandhill|Royal Palm|Ocala Trace|Pine Island|Longleaf Trace|Sabal Ridge|Fox Squirrel|River Hammock|Cypress Grove|Silver Springs|Orange Lake|Mossbank|Little Prairie|Hammock Ridge'),
 CALIFORNIA:words('Oak Canyon|Sierra Mesa|Coast Oak|Sun Mesa|Adobe Ridge|Santa Rosa Gate|Arroyo Blanca|Copper Canyon|Valley Oak|Coastal Ridge|Rancho Verde|Quail Mesa|Rincon Oaks|La Cumbre|Sage Canyon|Sycamore Arroyo|Rancho Piedra|Chaparral|Coyote Creek|Willow Canyon|Mission Oaks|Alta Mesa|Adobe Valley|Canyon Gate|Ranch House'),
 NEW_YORK:words('Hudson Knoll|Mohawk Bend|Catskill Hollow|Apple Ridge|Briar Orchard|North Meadow|Saratoga Valley|Iron Orchard|Maple Hill|Millbrook Hollow|Hollow Brook|Brookfield Trace|Stone Orchard|North Creek|High Pasture|Meadow Run|Willow Orchard|Orchard Gate|Hudson Trace|Pine River|Ridge Hollow|Red Orchard'),
 MID_ATLANTIC:words('Piedmont Hollow|Blue Bell|Catoctin Valley|Monocacy|Chester Vale|Susquehanna Bend|Chesapeake Meadow|Fox Chase|Wye Valley|Choptank Ridge|River Manor|Stone Crossing|Oakford|Red Gate|Laurel Crossing|Chestnut Ridge|Hill Manor|Briar Manor|Blue Rock|Mason Creek|Hunting Ridge|Apple Vale|Old Quarry'),
 ONTARIO:words('Laurentian|Grey Willow|Grand River|Caledon Hill|Maple Gate|Coldwater|Humber Valley|Thornbury|Silver Maple|Cedar Marsh|Pine River|Oak Plains|Black River|Northern Birch|Maple Ridge|Willow Vale|Cedar Vale|Highland Birch|Oak Glen|Maple Downs|Beaver Creek|River Landing'),
 LOUISIANA:words('Bayou Cypress|Magnolia Trace|Cypress Parish|Bayou Oaks|Red Cane|Live Oak Landing|River Parish|Bayou Bend|Moss Point|Tangle Cypress|Cajun Oak|Southern Parish|Bayou Willow|Pecan Trace|Old Levee|Blackwater Bayou|Atchafalaya Bend|Magnolia Bend|South Cane|River Cypress'),
 BRITAIN_IRELAND:words('Ballyford|Rathmore|Alder Park|Kilbracken|West Wicklow|Stonebridge|Lough Meadow|Highfield House|Ash Lodge|Oak Manor|Cedar Court|Old Abbey|Briar Hall|Holloway Park|White Lodge|Cloverdale|Foxmead|Bramble Hall|Hill House|Glenwood|West Meadow'),
 GENERAL_NORTH_AMERICA:words('Briar Ridge|River Plain|Old Mill|Chestnut Gate|Hayfield|White Post|Cedar Hollow|Hickory Bend|Dry Creek|North Pasture|Meadow Haven|Copper Brook|North Crossing|Three Pines|Long Meadows|Round Barn|Timber Trace|Old Wagon|Silver Oak|Ridge Spring|Green Pasture|Eastbrook|Westvale|Hawthorn Gate|Twin Meadows')
});
// Prefix guards in the shared organization registry include the new
// regional vocabulary, preventing cloned roots with swapped suffixes.
export const REGIONAL_NAMING_ANCHORS=Object.freeze(
 [...new Set(Object.values(ROOTS).flat())]
);
const SUFFIXES=Object.freeze({
 FARM:words('Farm|Farms|Thoroughbred Farm|Farmstead|Acres|Thoroughbreds'),
 STUD_FARM:words('Stud|Stud Farm|Stallion Station|Stallion Farm|Thoroughbred Stud'),
 THOROUGHBRED_NURSERY:words('Nursery|Thoroughbred Nursery|Foaling Nursery|Nursery Farm'),
 BLOODSTOCK_FARM:words('Bloodstock|Bloodstock Farm|Bloodstock & Breeding|Thoroughbreds'),
 BREAKING_AND_TRAINING:words('Training Center|Breaking & Training|Pre-Training|Horse Development|Young Horse Training')
});
const HERITAGE=words('Estate|Fields|Park|Grove|Manor|Hill|Place|Gate|Vale|Farm');
const FINANCE=words('Bloodstock|Thoroughbreds|Racing|Racing Partners|Racing Group|Racing Holdings|Racing Ventures');
const MEMBERS=words('Partnership|Racing Syndicate|Racing Club|Racing Partners|Racing Group');
const COMMERCIAL=words('Racing|Bloodstock|Thoroughbreds|Racing Stable|Racing Associates');
const COOWN=words('Partners|Racing|Thoroughbreds|Bloodstock');
function hash(seed,key){
 let h=(2166136261^(seed>>>0))>>>0;
 for(const char of String(key)){h^=char.charCodeAt(0);h=Math.imul(h,16777619)}
 h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;
 h=Math.imul(h,0x846ca68b);h^=h>>>16;return h>>>0;
}
const draw=(items,seed,key)=>items[hash(seed,key)%items.length];
export function organizationNamingRegion(location){
 if(!location)return 'GENERAL_NORTH_AMERICA';
 const region=String(location.region||location.state||'').toLowerCase();
 const code=String(location.code||location.countryCode||'').toUpperCase();
 if(['kentucky','ky'].includes(region))return 'KENTUCKY';
 if(['florida','fl'].includes(region))return 'FLORIDA';
 if(['california','ca'].includes(region)&&code!=='CA')return 'CALIFORNIA';
 if(['new york','ny'].includes(region))return 'NEW_YORK';
 if(['maryland','virginia','pennsylvania','new jersey','delaware','west virginia','md','va','pa','nj','de','wv'].includes(region))return 'MID_ATLANTIC';
 if(['ontario','on'].includes(region))return 'ONTARIO';
 if(['louisiana','la'].includes(region))return 'LOUISIANA';
 if(code==='GB'||code==='IE')return 'BRITAIN_IRELAND';
 return 'GENERAL_NORTH_AMERICA';
}
export function organizationNamingEra(seed,index,category,establishedYear=null){
 if(establishedYear!==null&&establishedYear!==undefined){
  if(!Number.isInteger(establishedYear)||establishedYear<1800||establishedYear>1999)
   throw Error('Invalid fictional organization established year');
  return establishedYear<1950?'HERITAGE':establishedYear<1981?'ESTABLISHED':'CONTEMPORARY';
 }
 // Default EDITORIAL STYLE allocation — NOT an assertion of founding year.
 const pct=hash(seed,'org-v7-era:'+category+':'+index)%100;
 return pct<25?'HERITAGE':pct<62?'ESTABLISHED':'CONTEMPORARY';
}
function regionRoot(seed,key,region,attempt=0){
 const pool=ROOTS[ORGANIZATION_NAMING_REGIONS.includes(region)?region:'GENERAL_NORTH_AMERICA'];
 return draw(pool,seed,key+':'+attempt+':regional');
}
export function contextualFarmCandidate(seed,index,attempt,kind,context={}){
 if(!SUFFIXES[kind])throw Error('Unsupported facility purpose '+kind);
 const region=context.region||'GENERAL_NORTH_AMERICA';
 const era=context.era||organizationNamingEra(seed,index,'farm',context.establishedYear);
 const key='v7-farm:'+kind+':'+index+':'+attempt;
 const root=regionRoot(seed,key,region,attempt);
 const surname=String(context.familyName||'').trim();
 const suffix=draw(SUFFIXES[kind],seed,key+':suffix');
 const roll=hash(seed,key+':pattern')%100;
 let stem=root;
 // A directory of real horse farms usually favors a short landholding or
 // family identity over manufactured three-adjective combinations.
 // A farm's namesake surname is only a proposed business root; it does NOT
 // assign that farm to an existing person.
 if(era==='HERITAGE'){
  if(surname&&roll<20)stem=surname;
  else if(surname&&roll<44)stem=root+' '+surname;
  else if(roll<92)stem=root;
  else if(!root.startsWith('Old '))stem='Old '+root;
 }else if(era==='CONTEMPORARY'){
  if(surname&&roll<13)stem=surname;
  else if(surname&&roll<47)stem=root+' '+surname;
  else stem=root;
 }else{
  if(surname&&roll<18)stem=surname;
  else if(surname&&roll<45)stem=root+' '+surname;
  else stem=root;
 }
 return (stem+' '+suffix).replace(/\b(Farm)\s+Farm\b/g,'$1');
}
export function contextualOwnerCandidate(seed,index,attempt,principal,primarySurname,context={}){
 const key='v7-owner:'+index+':'+attempt;
 const region=context.region||'GENERAL_NORTH_AMERICA';
 const era=context.era||organizationNamingEra(seed,index,'owner');
 const family=String(primarySurname||'').trim();
 const full=String(principal||'').replace(/^(?:Dr|Mr|Mrs|Ms)\.\s*/i,'').trim();
 const root=regionRoot(seed,key,region,attempt);
 const roll=hash(seed,key+':style')%100;
 const initials=full&&family?full[0].toUpperCase()+'. '+family[0].toUpperCase()+'.':'';
 // These styles reflect how racing directories are written: people,
 // family stables, private racing businesses, a limited number of
 // organized partnerships, and the occasional initials-based company.
 // Never invent another human co-owner to make a group sound larger.
 if(family&&roll<24)return family+' '+draw(['Racing','Thoroughbreds','Stables','Racing Stable'],seed,key+':private');
 if(full&&roll<39)return full+' '+draw(['Racing','Thoroughbreds','Stable'],seed,key+':proprietor');
 if(roll<52)return root+' '+draw(['Racing','Stables','Thoroughbreds','Bloodstock'],seed,key+':trade');
 if(family&&roll<65)return family+' '+draw(
  ['Family Racing','Family Stables','Family Thoroughbreds','Family Stable'],
  seed,key+':family');
 if(family&&roll<76)return family+' '+draw(
  era==='HERITAGE'?['Estate Racing','Thoroughbreds','Racing Stable']:
   ['Racing Holdings','Thoroughbreds','Racing Associates','Equine'],
  seed,key+':company');
 if(roll<87)return root+' '+draw(
  ['Racing Partners','Racing Partnership','Racing Syndicate','Racing Club','Racing Group'],
  seed,key+':partnership');
 if(initials&&roll<95)return initials+' '+draw(['Stable','Racing','Thoroughbreds'],seed,key+':initials');
 if(roll<98)return root+' '+draw(['Equine','Stable','Racing'],seed,key+':brand');
 return family?family+' '+draw(['Racing','Stable','Thoroughbreds'],seed,key+':fallback'):
  root+' Racing';
}
export function contextualStableCandidate(seed,index,attempt,trainer,primarySurname,context={}){
 const key='v7-stable:'+index+':'+attempt;
 const region=context.region||'GENERAL_NORTH_AMERICA';
 const full=String(trainer||'').replace(/^Dr\.\s+/,'').trim();
 const family=String(primarySurname||'').trim();
 const root=regionRoot(seed,key,region,attempt);
 const roll=hash(seed,key+':style')%100;
 if(!family&&!full)return root+' Racing Stable';
 if(roll<19)return family+' Racing';
 if(roll<34)return family+' Stables';
 if(roll<47)return full+' Racing';
 if(roll<57)return family+' Training';
 if(roll<67)return full+' Race Barn';
 if(roll<79)return root+' '+family+' Racing';
 if(roll<89)return family+' Racing Team';
 if(roll<95)return root+' '+family+' Training Barn';
 return full+' Racing Stable';
}
export function contextualBreakingCandidate(seed,index,attempt,context={}){
 const key='v7-breaking:'+index+':'+attempt;
 const root=regionRoot(seed,key,context.region||'GENERAL_NORTH_AMERICA',attempt);
 return root+' '+draw(SUFFIXES.BREAKING_AND_TRAINING,seed,key+':suffix');
}
