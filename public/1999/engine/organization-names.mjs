/**
 * Wire to Wire fictional organization naming engine, initial 1999 implementation.
 * Synthetic names only: source-locked historical organizations retain their identities.
 * Deterministic and index-stable: an entity's name depends on its seed, category and index,
 * never on directory read order. The shared registry prevents cross-category duplicates.
 */
export const ORGANIZATION_NAME_MODEL = 'WTW_1999_DISTINCT_ORGANIZATION_ECOLOGY_V1';

const place = 'Alder|Amity|Ashland|Barrington|Beacon|Beechwood|Belmont|Benton|Blackford|Bluegrass|Bracken|Braddock|Brentwood|Briar|Bristol|Brookfield|Brookside|Buckhorn|Calder|Calumet|Camden|Canaan|Carriage|Cedar|Chapel|Charlton|Chestnut|Clearfield|Clifton|Clover|Colfax|Concord|Copper|Crescent|Crown|Dalton|Danbury|Deerfield|Dover|Drayton|Eastfield|Easton|Elmhurst|Essex|Fairhaven|Fairmont|Fairview|Fern|Fletcher|Foxfield|Galloway|Glenwood|Goldcrest|Granite|Greenbrier|Greystone|Hampton|Harrow|Hartford|Hawkins|Hawthorne|Hazel|Heritage|Hickory|Highfield|Highland|Hillside|Hollis|Holloway|Ironwood|Kendall|Kentfield|Kingsford|Kingsley|Lakeland|Larchmont|Laurel|Lexford|Linden|Longford|Magnolia|Marlborough|Marston|Meadow|Meridian|Merritt|Middleton|Millbrook|Millfield|Montclair|Montrose|Morrow|Newbury|Northfield|Oakfield|Oakham|Oakmont|Oldfield|Orchard|Overbrook|Palisade|Parkfield|Pemberton|Pinehurst|Pinewood|Pleasant|Quail|Redfield|Redmond|Ridgecrest|Riverton|Rockford|Rosemont|Rowan|Saddle|Sage|Seabrook|Shadwell|Sherwood|Silverton|Southfield|Springfield|Springhill|Stonebrook|Stonefield|Stonewall|Stratford|Sutton|Tamarack|Thornfield|Timber|Trinity|Valley|Waverly|Westfield|Westhaven|Whitfield|Whitmore|Wildwood|Willow|Windfield|Windsor|Wintergreen|Woodbridge|Woodland|Woodmont|Wyndham'.split('|');
const geography = 'Bluff|Branch|Bridge|Brook|Chase|Creek|Crossing|Dale|Downs|Falls|Field|Ford|Glen|Grove|Hall|Haven|Hill|Hollow|Knoll|Lake|Landing|Ledge|Meadow|Mill|Oaks|Park|Pasture|Point|Ridge|River|Run|Spring|Station|Vale|Valley|View|Walk|Wood'.split('|');
const surname = 'Abbott|Ainsworth|Alden|Alford|Archer|Ashby|Baird|Baker|Bancroft|Barlow|Beck|Bellamy|Bennett|Bishop|Blair|Bowen|Boyd|Bradford|Brantley|Brennan|Burke|Callahan|Carson|Carter|Chambers|Chandler|Clarke|Collins|Connelly|Conway|Crawford|Daley|Dawson|Decker|Delaney|Denton|Donovan|Drake|Dunbar|Ellis|Emerson|Farrow|Faulkner|Fleming|Foley|Foster|Gaines|Gallagher|Gentry|Gibson|Gordon|Grady|Graham|Grant|Graves|Greer|Hadley|Hale|Hamilton|Harlan|Harris|Henderson|Hollander|Hughes|Jameson|Keller|Kendrick|Keating|Kerr|Kincaid|Lambert|Langley|Lawson|Leary|Lennox|Lester|Livingston|Lowell|Maddox|Manning|Marsh|Mercer|Merrill|Mitchell|Monroe|Montgomery|Morrow|Nolan|Oakes|OBrien|OConnell|Palmer|Parker|Parrish|Patterson|Pearce|Phelps|Pritchard|Quinn|Ramsey|Reddick|Reeves|Reynolds|Riley|Roark|Rowe|Rutledge|Sawyer|Sexton|Shaw|Sheffield|Sheridan|Sinclair|Sloan|Spencer|Stafford|Stanton|Sullivan|Talbot|Tanner|Thayer|Thornton|Tucker|Vaughn|Walker|Wallace|Walsh|Warren|Watkins|Webster|Weston|Whitaker|Wilcox|Wilder|Winters|Woodward|York'.split('|');
const regional = 'Allegheny|Arkansas|Blue Ridge|Bourbon|Carolina|Chesapeake|Cumberland|Delaware|Finger Lakes|Gulf Coast|Hudson|Keeneland|Lakeshore|Midland|Mohawk|Ohio Valley|Ozark|Piedmont|Prairie|Red River|Shenandoah|Sonoran|Tidewater|Twin Cities|Upper Valley|Western Kentucky'.split('|');
const specialties = 'Colt|Filly|Yearling|Two-Year-Old|Young Horse|Equine|Thoroughbred|Foundation|Performance|Racing Prospect'.split('|');
function hash(seed,key){
 let h=(2166136261^(seed>>>0))>>>0;
 for(const c of String(key)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
 h^=h>>>16;h=Math.imul(h,2246822507);h^=h>>>13;
 return h>>>0;
}
const pick=(arr,seed,key)=>arr[hash(seed,key)%arr.length];
const normalize=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,'and').replace(/[^a-zA-Z0-9]+/g,'').toLowerCase();
const scrub=s=>String(s).replace(/\s+/g,' ').trim();
const deduped=a=>[...new Set(a)];
const roots=deduped([...place,...regional]);
function root(seed,key,attempt){
 const a=pick(roots,seed,key+':root:'+attempt),b=pick(geography,seed,key+':geog:'+attempt);
 return hash(seed,key+':root-style:'+attempt)%5===0?a+' '+b:a+b;
}
function categoryName(seed,kind,index,attempt){
 const key=kind+':'+index+':'+attempt;
 const r=root(seed,key,attempt),s=pick(surname,seed,key+':surname');
 const second=pick(surname,seed,key+':surname2');
 const placeName=pick(regional,seed,key+':region');
 const spec=pick(specialties,seed,key+':specialty');
 const option=hash(seed,key+':style')%14;
 if(kind==='farm'){
  const styles=[r+' Farm',r+' Acres',r+' Farmstead',s+' Farm',r+' Thoroughbred Farm',s+' Family Farm',r+' Stock Farm',
   r+' Nursery',s+' & Sons Farm',s+' Equine Farm',r+' Estate',r+' Farm & Nursery',
   s+' at '+r+' Farm',r+' Thoroughbreds'];
  return styles[option];
 }
 if(kind==='stud'){
  const styles=[r+' Stud',r+' Stallion Station',s+' Stud',r+' Bloodstock',s+' Breeding Farm',r+' Stud Farm',r+' Stallions',
   s+' Bloodstock',r+' Thoroughbred Stud',s+' & '+second+' Stud',r+' Breeding',r+' Bloodstock Farm',
   s+' Stallion Farm',r+' Equine Breeding'];
  return styles[option];
 }
 if(kind==='barn'){
  const styles=[s+' Racing Stable',s+' Racing',s+' Stables',r+' Racing',s+' Racing Team',
   s+' Stable',r+' Race Stable',s+' Race Barn',s+' Racing Operation',s+' Performance Stable',
   s+' & '+second+' Racing',s+' Racing Yard',r+' Stable',s+' Thoroughbred Racing'];
  return styles[option];
 }
 if(kind==='breaking'){
  const styles=[r+' Training Center',s+' Colt Development',r+' Breaking & Training',s+' Equine Development',
   r+' Training Grounds',s+' Young Horse Center',r+' Starting Yard',r+' Training Farm',
   s+' Performance Training',r+' '+spec+' Training',s+' Pre-Training',r+' Equine Center',
   s+' Breaking Yard',placeName+' Young Horse Development'];
  return styles[option];
 }
 // Owners are separate legal/business entities, not interchangeable farm names.
 const styles=[s+' Racing',s+' Thoroughbreds',s+' Family Racing',s+' Racing Partners',s+' Racing Syndicate',
  s+' & '+second+' Racing',r+' Racing Club',s+' Racing Partnership',s+' & Co. Racing',
  r+' Racing',placeName+' Thoroughbred Partnership',s+' Racing Group',
  s+' Bloodstock Holdings',r+' Thoroughbreds'];
 return styles[option];
}
/**
 * Reserve protected names before generating any fictional names. Returned registry
 * creates all names at once, so lookup order cannot change identity or uniqueness.
 */
export function createOrganizationNameRegistry(seed,{protectedNames=[],owners=3308,barns=4200,farms=900,breaking=0}={}){
 const used=new Set(protectedNames.map(normalize));
 const saved=new Map(), stats={generated:0,retried:0,protectedNames:protectedNames.length};
 for(const [kind,count] of [['owner',owners],['farm',farms],['barn',barns],['breaking',breaking]]){
  for(let i=0;i<count;i++){
   let accepted=null;
   for(let attempt=0;attempt<512;attempt++){
    const candidate=scrub(categoryName(seed,kind,i,attempt));
    const n=normalize(candidate);
    if(n.length<7||used.has(n))continue;
    used.add(n);accepted=candidate;stats.retried+=attempt;break;
   }
   if(!accepted)throw Error('Organization name capacity exhausted for '+kind+':'+i);
   saved.set(kind+':'+i,accepted);stats.generated++;
  }
 }
 return Object.freeze({
  model:ORGANIZATION_NAME_MODEL,stats:Object.freeze(stats),
  at(kind,index){
   if(!Number.isInteger(index)||index<0)throw Error('Invalid organization index');
   const name=saved.get(kind+':'+index);
   if(!name)throw Error('Unallocated organization '+kind+':'+index);
   return name;
  }
 });
}
