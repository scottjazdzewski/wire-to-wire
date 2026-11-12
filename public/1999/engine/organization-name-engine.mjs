/*
 * WTW fictional 1999 organization naming ecology.
 * These names are GAME TEST identities, never replacements for historical canon.
 * One seeded registry protects names across owners, barns and farms.
 * Entity IDs, locations, ownership, and horse links are outside this module.
 */
export const ORGANIZATION_NAME_MODEL='WTW_1999_ORGANIZATION_NAMING_V1';

const SURNAMES='Abbott|Adler|Ainsworth|Aldridge|Allen|Alston|Anderson|Archer|Armstrong|Ashford|Atkins|Atwood|Baird|Baldwin|Banks|Barlow|Barnes|Barrett|Baxter|Beckett|Bellamy|Bennett|Benton|Berryman|Bishop|Blackwell|Blair|Bledsoe|Bolton|Boone|Bradford|Bradshaw|Brennan|Brooks|Browning|Buchanan|Burke|Burnett|Byrne|Caldwell|Callahan|Calvert|Campbell|Carleton|Carson|Carter|Chambers|Chandler|Chapman|Clark|Clayton|Clements|Clifton|Coleman|Collins|Connelly|Conrad|Cooper|Corbett|Crawford|Cullen|Dalton|Danvers|Davenport|Dawson|Delaney|Dixon|Donovan|Doyle|Draper|Dunbar|Duncan|Ellison|Emerson|Everett|Fairchild|Farrow|Ferguson|Fisher|Fitzgerald|Fleming|Fletcher|Forbes|Foster|Franklin|Frazier|Gaines|Gallagher|Garrison|Gentry|Gibson|Gilbert|Gillespie|Gordon|Graham|Granger|Grant|Graves|Griffin|Guthrie|Hale|Haley|Hamilton|Hancock|Hardin|Harper|Harrington|Harris|Hartley|Hawkins|Hayes|Henderson|Hensley|Hollis|Holmes|Holt|Horton|Howard|Hudson|Hughes|Hunt|Ingram|Irving|Jackson|Jarrett|Jennings|Keller|Kendall|Kennedy|Keene|Kerr|Kincaid|King|Kirkland|Lancaster|Langley|Lawrence|Lawson|Leighton|Lennox|Lloyd|Lowell|Maddox|Manning|Marshall|Mason|McAllister|McBride|McCarthy|McConnell|McDowell|McIntyre|McKay|Mercer|Merritt|Mitchell|Monroe|Montgomery|Morgan|Morrison|Murphy|Nelson|Newman|Nichols|Nolan|Norton|OBrien|OConnor|Odom|Osborne|Owens|Parker|Parrish|Patterson|Payne|Pearson|Pemberton|Perkins|Perry|Phillips|Pierce|Porter|Prescott|Price|Quinn|Ramsey|Randolph|Reed|Reynolds|Rhodes|Riley|Robbins|Roberts|Robertson|Rogers|Rowan|Russell|Rutledge|Sampson|Sawyer|Schneider|Scott|Shaw|Shepherd|Sherman|Simmons|Sinclair|Sloane|Spencer|Stafford|Stanford|Stanton|Stevens|Stewart|Stone|Stratton|Sullivan|Sutton|Talbot|Tanner|Taylor|Thatcher|Thomas|Thompson|Thornton|Turner|Vance|Vaughn|Walker|Wallace|Walsh|Warren|Watson|Weller|Wells|Weston|Whitaker|Whitcomb|White|Whittaker|Wilcox|Williams|Willis|Wilson|Winters|Woodard|Woodward|Wright|Yates|Young'.split('|');
const LAND='Ashbourne|Briarfield|Bridlewood|Brookhaven|Buckeye|Calder|Camden|Canebrake|Carriage Hill|Cedar Vale|Chapel Hill|Chesapeake|Chestnut Hollow|Claremont|Clear Fork|Clearwater|Cloverleaf|Coldstream|Copper Run|Cottonwood|Crescent Mile|Cypress Bend|Deerfield|Dry Creek|Eastfield|Elk River|Elmwood|Fairhaven|Fairview|Far Hills|Fern Hill|Fieldstone|Flat Rock|Foxcroft|Foxglove|Fox Hollow|Gallant Hill|Glenarden|Glenview|Goldcrest|Grand Oaks|Greenfield|Greenway|Hawthorne|Hazelbrook|Heather Glen|Highfield|Highland|Hillcroft|Hillview|Holly Springs|Horse Creek|Ironwood|Juniper|Kingsmere|Larkspur|Laurel Hill|Laurelwood|Limestone|Little Fork|Longbranch|Longford|Maple Grove|Mapleton|Marshfield|Meadowgate|Mill Creek|Millbrook|Millstone|Monarch Hill|Montclair|Morningside|Northfield|Oak Glen|Oak Hill|Oakleigh|Oakridge|Old Mill|Old Orchard|Oldfield|Overbrook|Overlook|Pinecroft|Pinegrove|Pine Hill|Pinehurst|Prairie Hill|Quail Run|Quarry Hill|Red Bank|Red Clay|Red Fox|Red Gate|Red Oak|Ridgecrest|Ridgefield|Riverbend|Rivergate|Riverton|Rockford|Rock Haven|Rock Ridge|Rosecroft|Rose Hill|Rosewood|Round Hill|Sagebrush|Sandstone|Seven Oaks|Shady Grove|Silverleaf|Southbank|Springbrook|Springfield|Springhill|Stillwater|Stonebrook|Stonefield|Stonegate|Stonehaven|Stoneleigh|Stonewall|Sugar Creek|Sunnyside|Sweetwater|Sycamore|Tall Oaks|Tanglewood|Thornfield|Three Chimneys|Three Oaks|Timbercrest|Timberlake|Timberline|Twin Rivers|Valley Forge|Valleyview|Walnut Grove|Westfield|Westhaven|Westover|White Fence|Whitehall|White Oak|Wildflower|Willowbend|Willowbrook|Willowfield|Windfield|Windham|Windward|Woodcrest|Woodfield|Woodhaven|Woodland|Woodside'.split('|');
const PLACES='Bluewater|Breakwater|Broadway|Canal Street|Capstone|Century|Charter|Commonwealth|Crossroads|Deepwater|Eastgate|Evergreen|Fairmont|First Post|Frontier|Gatehouse|Granite|Greenbrier|Hearthside|Heritage|Highpoint|Iron Gate|Landmark|Longview|Market Street|Meridian|Milepost|Northbound|Northstar|Old Dominion|Overland|Pacesetter|Parkland|Piedmont|Portside|Prospect|Railhead|Redline|Reservoir|River City|Saddleback|Seaboard|Second Street|Shoreline|Southgate|Summit|Tidewater|Trade Wind|Union Hill|Upland|Westbridge|Westline|Westport|Whitestone'.split('|');
const FARM_SUFFIX=['Farm','Farm','Farm','Farm','Farm','Farm','Stud','Stud','Stud','Thoroughbred Farm','Nursery','Bloodstock Farm'];
const OWNER_SUFFIX=['Racing','Racing','Racing','Thoroughbreds','Stable','Stables','Racing Partners','Racing Club','Bloodstock','Racing Partnership','Racing Group','Partnership'];
const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
function hash(seed,key){let h=(2166136261^(seed>>>0))>>>0;for(const c of String(key)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}h^=h>>>16;return h>>>0;}
const draw=(arr,seed,key)=>arr[hash(seed,key)%arr.length];
function surname(name){const cleaned=String(name||'').replace(/^(Dr|Mr|Mrs|Ms)\.\s*/i,'').replace(/\s+(Jr\.?|Sr\.?|II|III|IV)$/i,'');return cleaned.split(/\s+/).at(-1)||'Stable';}
const rootOf=name=>norm(String(name).replace(/\b(Thoroughbred Farm|Bloodstock Farm|Racing Partnership|Racing Partners|Racing Group|Racing Club|Thoroughbreds|Racing Stables|Racing Stable|Training Barn|Training Yard|Partnership|Partners|Syndicate|Stables|Stable|Bloodstock|Stud|Nursery|Farms|Farm|Racing|Barn)\b/gi,''));
/*
 * Instantiate once per world. The returned arrays are read only by index;
 * order of API queries must not affect the visible names.
 */
export function createOrganizationNameRoster({
 seed,ownerCount,barnCount,farmCount,protectedNames=[],
 principalNames=[],trainerNames=[],sourceOwnerNames=[]
}){
 if(!Number.isSafeInteger(seed)||seed<1)throw Error('Invalid naming seed');
 for(const n of [ownerCount,barnCount,farmCount])if(!Number.isInteger(n)||n<0)throw Error('Invalid naming count');
 const used=new Set(protectedNames.map(norm).filter(Boolean));
 const roots=new Set(protectedNames.map(rootOf).filter(Boolean));
 const reserve=(candidate,{distinctRoot=false}={})=>{
  const key=norm(candidate),root=rootOf(candidate);
  if(!key||used.has(key)||(distinctRoot&&roots.has(root)))return false;
  used.add(key);if(distinctRoot)roots.add(root);return true;
 };
 const claim=(make,{distinctRoot=false}={})=>{
  for(let attempt=0;attempt<300;attempt++){
   const candidate=make(attempt);
   if(reserve(candidate,{distinctRoot}))return candidate;
  }
  throw Error('Organization name pool exhausted; extend lexicon instead of assigning numbers');
 };
 const owners=new Array(ownerCount);
 for(let i=0;i<ownerCount;i++){
  if(sourceOwnerNames[i]){owners[i]=sourceOwnerNames[i];continue;}
  const principal=principalNames[i]||'';
  // Sole owners use their individual identities intentionally; never
  // generate a second corporation with their personal name.
  if(i%11===0 && principal){owners[i]=principal;used.add(norm(principal));continue;}
  owners[i]=claim(attempt=>{
   const k='owner:'+i+':'+attempt,style=hash(seed,k+':style')%100;
   const family=draw(SURNAMES,seed,k+':family'),family2=draw(SURNAMES,seed,k+':family2');
   const place=draw(PLACES,seed,k+':place'),land=draw(LAND,seed,k+':land');
   const suffix=draw(OWNER_SUFFIX,seed,k+':suffix');
   if(style<22)return family+' '+suffix;
   if(style<34)return family+' & '+family2+' '+draw(['Racing','Partners','Bloodstock'],seed,k+':duo');
   if(style<47)return land+' '+suffix;
   if(style<59)return place+' '+suffix;
   if(style<70)return family+' Family '+draw(['Racing','Stable','Partnership'],seed,k+':family-name');
   if(style<79)return 'The '+draw(['First Turn','Furlong','Rail','Winning Post','Home Stretch','Clubhouse'],seed,k+':club')+' '+draw(['Partnership','Racing Club','Syndicate'],seed,k+':club-suffix');
   if(style<90)return place+' '+family+' '+draw(['Racing','Thoroughbreds','Bloodstock'],seed,k+':corporate');
   return principal+' '+draw(['Racing','Thoroughbreds','Stable'],seed,k+':principal');
  },{distinctRoot:true});
 }
 const farms=new Array(farmCount);
 const farmKinds=new Array(farmCount);
 for(let i=0;i<farmCount;i++){
  const k='farm:'+i,kind=hash(seed,k+':purpose')%100;
  farmKinds[i]=kind<27?'STUD_FARM':kind<83?'FARM':kind<94?'THOROUGHBRED_NURSERY':'BLOODSTOCK_FARM';
  farms[i]=claim(attempt=>{
   const key=k+':'+attempt,style=hash(seed,key+':style')%100;
   const land=draw(LAND,seed,key+':land'),place=draw(PLACES,seed,key+':place');
   const family=draw(SURNAMES,seed,key+':family');
   const stem=style<48?land:style<74?family+' '+draw(['Hill','Creek','Fields','Grove','Place','Run','Ridge','Vale'],seed,key+':topo'):place+' '+draw(['Valley','Meadows','Hollow','Hill','Point'],seed,key+':geo');
   let suffix=farmKinds[i]==='STUD_FARM'?'Stud':farmKinds[i]==='THOROUGHBRED_NURSERY'?'Nursery':farmKinds[i]==='BLOODSTOCK_FARM'?'Bloodstock Farm':draw(['Farm','Farm','Farm','Thoroughbred Farm'],seed,key+':suffix');
   // Do not yield a duplicate suffix such as "... Farm Farm".
   if(/\bFarm$/i.test(stem)&&/Farm/i.test(suffix))suffix='';
   return (stem+' '+suffix).trim();
  },{distinctRoot:true});
 }
 const barns=new Array(barnCount);
 for(let i=0;i<barnCount;i++){
  const trainer=String(trainerNames[i]||'').trim(),family=surname(trainer);
  barns[i]=claim(attempt=>{
   const style=hash(seed,'barn:'+i+':'+attempt)%100;
   const first=trainer.split(/\s+/)[0]||'Racing',full=trainer||draw(SURNAMES,seed,'barn-fallback:'+i);
   if(attempt>=12)return full+' '+draw(['Training Barn','Racing Stable','Stables','Racing'],seed,'barn:'+i+':'+attempt);
   if(style<24)return family+' Racing Stables';
   if(style<40)return family+' Stable';
   if(style<56)return full+' Racing';
   if(style<68)return family+' Racing';
   if(style<78)return full+' Stables';
   if(style<88)return family+' Training Barn';
   return first+' '+family+' Racing Stable';
  });
 }
 return {
  model:ORGANIZATION_NAME_MODEL,
  owners:Object.freeze(owners),barns:Object.freeze(barns),
  farms:Object.freeze(farms),farmKinds:Object.freeze(farmKinds),
  summary:Object.freeze({owners:ownerCount,barns:barnCount,farms:farmCount}),
 };
}
/* Independent future breaking/training facilities; existing racetrack-owned
 * training-center identities should remain tied to their source tracks. */
export function createBreakingTrainingNames(seed,count,protectedNames=[]){
 const used=new Set(protectedNames.map(norm));
 const out=[];
 for(let i=0;i<count;i++){
  let name='';
  for(let a=0;a<200;a++){
   const k='breaking:'+i+':'+a,root=draw([...LAND,...PLACES],seed,k+':root');
   const suffix=draw(['Training Center','Training Grounds','Breaking & Training','Equine Training','Horse Center','Training Farm'],seed,k+':type');
   name=root+' '+suffix;
   if(!used.has(norm(name))){used.add(norm(name));break;}
   name='';
  }
  if(!name)throw Error('Breaking/training name pool exhausted');
  out.push(name);
 }
 return out;
}