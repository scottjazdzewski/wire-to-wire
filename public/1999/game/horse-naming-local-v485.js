/**
 * WIRE TO WIRE — ON-DEVICE horse naming writer, V485.
 * Deterministic, story-grounded and offline; no model/HTTP/Worker/API/AI credits.
 * Curated WHOLE names, never Cartesian adjective + noun combinations.
 * Does not write game state, grant approval, or assert real-world name clearance.
 * A source-less foal receives a hold, not a fabricated name.
 */
import {verifyNamingBriefAgainstGame,screenStoryFirstIdeas} from './horse-naming-model-creator.js';
import {foalingEventNamingBrief,auditPopulationNamingResults,POPULATION_NAMING_SCHEMA,POPULATION_NAMING_BATCH_SIZE} from './horse-naming-population-planner.js';

export const LOCAL_HORSE_NAMING_SCHEMA='WTW_LOCAL_HORSE_NAMING_V485';
// Freeze behavioral revision per named cohort when game foaling becomes save-backed.
// This V486 marker changes selection and fail-closed audit, not the V485 wire schema.
export const LOCAL_HORSE_NAMING_ALGORITHM_REVISION='WTW_LOCAL_NAMING_RULES_V488';
const norm=x=>String(x||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('en-US').replace(/[^a-z0-9]/g,'');
const clean=x=>String(x||'').trim();
const fnv=s=>{let h=2166136261;for(const x of String(s)){h^=x.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
function rng(seed){let s=seed>>>0;return ()=>{s+=0x6D2B79F5;let x=s;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296}}
const pick=(xs,random)=>xs[Math.floor(random()*xs.length)];

// Curated WHOLE-NAME voices. All names are author-written, tied to narrative
// cues, and individually screened against the game and the 520 owner ratings.
// A cue provides an origin, NOT proof that the name is especially good.
const VOICES=Object.freeze([
 {id:'storm',cue:/\b(thunder|storm|lightning|tempest|thunderstorm)\w*\b/i,why:'the storm that frames this horse’s recorded story',names:['Tempest','After the Thunder','Stormglass','Eye of the Storm','High Voltage','A Sudden Quiet','Stormbound','The Warning','Weatherbound']},
 {id:'blackout',cue:/\b(power outage|power went out|electricity|blackout|lights? (?:went out|failed|cut out|flickered)|darkened)\b/i,why:'the loss of light described in the source account',names:['Blackout','The Last Light','Dark Horse Hour','Lights Out','After the Lights','By Candlelight','Night Porter','Candlewick']},
 {id:'breathing',cue:/\b(breath(?:e|ing|ed)?|heartbeat|pulse|exhale|heartbeat)\b/i,why:'the remembered rhythm and breathing of the horse',names:['Cadence','Still Breathing','The Sound of Life','Hold Fast','Inhale','The Pulse','Softly Spoken','Steady As She Goes']},
 {id:'calm',cue:/\b(calm|quiet|patient|unbothered|unafraid|gentle|still|serene|peaceful)\b/i,why:'the horse’s unusual composure in the story',names:['Unflappable','Even Keel','Cool Customer','Nothing Stirring','As You Were','Easy Does It','Take It Easy','Quietly So']},
 {id:'bell',cue:/\b(bell|toll|chime|ringing|belfry|carillon)\b/i,why:'the remembered bell or resonant sound',names:['Tocsin','The Last Toll','Bellwether','A Clear Note','Bronze Echo','The Ringing','Second Bell','Bellmaker']},
 {id:'rain',cue:/\b(rain|drizzle|downpour|shower|flood|monsoon|wet)\b/i,why:'the rain or water that marked the event',names:['Raincheck','The Deluge','Downriver','After Rain','Wet Footprints','Dry by Morning','A Rain Will Come','In the Weather']},
 {id:'sun',cue:/\b(sun|sunshine|sunrise|dawn|morning|daybreak|first light)\b/i,why:'the remembered light or beginning of the day',names:['Daybreak','Before Breakfast','Morning Call','The Early Bird','A New Day','At First Light','Sunward','The Wakeup']},
 {id:'night',cue:/\b(night|dark|darkness|dusk|midnight|moon|twilight|evening)\b/i,why:'the darkness or nighttime setting',names:['Nightjar','Nocturne','After Hours','Night Clerk','On the Late Shift','The Night Shift','After Dark','The Lookout']},
 {id:'gate',cue:/\b(gate|fence|pasture|paddock|field|enclosure|crossing)\b/i,why:'the distinctive place around the horse’s arrival',names:['The Gatekeeper','Over the Fence','Open Gate','Far Corner','Fencepost','Farther Along','Past the Gate','West Pasture']},
 {id:'train',cue:/\b(train|rail|locomotive|station|whistle|freight|railway|railroad)\b/i,why:'the train or rail setting named in the account',names:['Switchman','Whistle Stop','The Last Car','The Limited','Iron Mile','Railbird','First Platform','Trackside']},
 {id:'music',cue:/\b(music|song|melody|violin|piano|guitar|singer|dance|tune|harmony|concert)\b/i,why:'the music remembered in this horse’s story',names:['One More Verse','Counterpoint','Lullaby','Interlude','The Last Dance','First Movement','The Chorus','Blue Note']},
 {id:'books',cue:/\b(book|letter|novel|story|poem|read|library|page|novelist|writer)\b/i,why:'the written work or spoken story described in the source',names:['Inkling','Postscript','Out of Print','Second Draft','The Margins','Marginalia','Footnote','Fair Copy']},
 {id:'road',cue:/\b(road|highway|drive|journey|mile|route|trip|travel|trail|path)\b/i,why:'the journey or location that shaped the memory',names:['Last Exit','The Long Way','Wayfarer','Milemarker','Off Route','The Detour','Roadside','Good Directions']},
 {id:'family',cue:/\b(mother|father|grandmother|grandfather|family|uncle|aunt|brother|sister|son|daughter|grandad|mama)\b/i,why:'a specific family connection identified in the record',names:['Namesake','By Tradition','Family Affair','Someone Like You','Kinsman','Old Saying','Remember Me','Family Matter']},
 {id:'fire',cue:/\b(fire|flame|ember|smoke|burn|cinder|bonfire|hearth)\b/i,why:'the fire or smoke recorded in the story',names:['Firebreak','Cinder','Rekindle','Old Flame','Ashfall','The Spark','Long Burning','Ember']},
 {id:'river',cue:/\b(river|creek|stream|water|lake|ferry|brook|pond|harbor)\b/i,why:'the specific waterway or water setting',names:['Ferryboat','River Pilot','High Water','Low Tide','Downstream','The Crossing','Headwaters','Far Shore']},
 {id:'orchard',cue:/\b(orchard|apple|pear|peach|garden|flower|rose|tree|seed|blossom)\b/i,why:'the orchard, garden or growing place in the account',names:['Applecart','First Bloom','The Gardener','Rootstock','Full Blossom','Last Orchard','Pippin','Seedling']},
 {id:'foal',cue:/\b(foal|filly|colt|mare|stallion|barn|stable|birthing|born|birth)\b/i,why:'the foaling or stable scene actually documented',names:['The Newcomer','All at Once','First Footstep','Early Visitor','Well Arrived','There She Is','First Impression','Homecoming']},
 {id:'wildlife',cue:/\b(fox|bird|owl|deer|rabbit|dog|hound|cat|crow|hawk|eagle)\b/i,why:'the animal encountered in the source account',names:['Reynard','Night Visitor','The Naturalist','Redwing','A Close Shave','Wild Company','Field Notes','The Watcher']},
 {id:'winter',cue:/\b(winter|snow|ice|frost|blizzard|cold|freezing|sleet)\b/i,why:'the winter weather or cold setting in the account',names:['Hard Frost','The Thaw','Cold Comfort','Whiteout','Cold Snap','Snowbound','After the Freeze','By December']},
 {id:'summer',cue:/\b(summer|heat|hot|august|july|june|warm|humid)\b/i,why:'the summer heat or season named in the account',names:['High Summer','Dog Days','The Solstice','Hot Weather','Summerlong','Long Day','Late Summer','Heatwave']},
 {id:'market',cue:/\b(market|fair|festival|parade|town|village|county|square|street)\b/i,why:'the public gathering or hometown setting',names:['At the Fair','Town Crier','Side Street','Market Day','Home County','Main Street','The Parade','The Outsider']},
 {id:'craft',cue:/\b(iron|blacksmith|wood|carpenter|saw|hammer|forge|craft|workshop|metal)\b/i,why:'the specific craft or tool that matters to the account',names:['Forged Ahead','Handmade','True Temper','Woodworker','Sawtooth','Journeyman','Ironclad','Anvil']},
 {id:'seaside',cue:/\b(sea|ocean|beach|coast|shore|sail|boat|island|tide)\b/i,why:'the coastal place or vessel named in the account',names:['Mariner','Beachcomber','Watch the Horizon','Seaward','Portside','Full Sail','Tidewater','Sea Change']},
 {id:'luck',cue:/\b(luck|lucky|chance|accident|unexpected|surprise|miracle|mistake)\b/i,why:'the improbable turn described in the record',names:['Better This Time','Against the Odds','That Figures','Not by Chance','Unexpectedly','As It Happens','Beginners Luck','One More Try']},
 {id:'personality',cue:/\b(stubborn|contrary|independent|defiant|curious|playful|bold|mischievous|tricky|clever|nosey|nosy|determined)\b/i,why:'the unusual personality trait the caretaker observed',names:['Maverick','No Apologies','The Instigator','Mind of My Own','A Bit Contrary','Uninvited','Not Listening','Contrarian']},
 {id:'door',cue:/\b(door|window|latch|hinge|knock|knocking|porch|steps|threshold)\b/i,why:'the familiar sound or doorway in the account',names:['At the Door','The Threshold','The Last Knock','Threshold','Not Home','Second Knock','The Doorman','Hinge']},
 {id:'movement',cue:/\b(jump|leap|bolt|run|running|race|gallop|stride|kick|buck|step|walk|dance)\b/i,why:'the animal’s distinct movement in the source story',names:['Quickstep','Sidewinder','Off Balance','In Motion','Astride','High Stepper','The Spring','On His Toes']},
 {id:'markings',cue:/\b(star|stripe|white blaze|marking|spot|freckle|coat|black mane|chestnut|roan|gray|grey)\b/i,why:'the foal’s explicitly recorded appearance',names:['White Blaze','The Mark','Speckled','Freckle','Bright Mark','Starboard','One Spot','Signature']},
 {id:'whimsy',cue:/\b(laugh|laughter|smile|funny|joke|giggle|humor|humour|silly|grin)\b/i,why:'a genuine humorous or affectionate detail in the account',names:['Inside Joke','Now You Know','A Good Laugh','Laughing Matter','There You Go','Not Funny','The Punchline','The Grin']}
]);
// V488: individually authored whole names, never word-grid permutations.
// All remain provisional until the existing source/history/editor gates pass.
const V488_WHOLE_NAMES=Object.freeze({
 "storm": ["Rumble Seat","Storm Signal","One More Flash","Upwind","Out of the Blue","In the Eye","Before It Breaks","Rolling Weather","The Long Roll","Static Charge","Under the Eaves","Clear Between"],
 "blackout": ["The Last Match","No Light Left","Lights Please","The Fuse","Without Warning","Pitch Black","A Candle Left","Switch It Off","When It Came Back","Power Play","The Dark Hour","Flicker Once"],
 "breathing": ["Second Wind","Soft Exhale","One More Breath","Easy Rhythm","The Long Sigh","Just Breathe","Steady Heart","Off the Beat","Hear Me Now","Between Beats","A Deep Breath","Still Here"],
 "calm": ["Never in Doubt","It Can Wait","All Is Well","Take Five","Steady On","Without a Fuss","Unshaken","Hush Now","Easy Going","No Hurry","At Ease","Quiet Company"],
 "bell": ["The Third Toll","Clear as a Bell","Last Chime","Ringing True","Bronzework","At the Sound","One More Chime","The Bell Rope","Sound Check","In the Belfry","Call to Order","The Echo"],
 "rain": ["Last Raindrop","The Rain Delay","Between Showers","Under the Awning","When It Clears","Rain or Shine","The Washout","After the Flood","Puddle Jumper","Storm Drain","Wet Through","A Drop More"],
 "sun": ["Up With the Sun","Early Light","Sun Came Up","Before Noon","Daylight Again","First to Rise","New Horizon","East Window","Morning Person","The First Hour","Into Daylight","Wide Awake"],
 "night": ["Late Edition","Moon After Moon","Once at Midnight","The Quiet Hours","Midnight Caller","Out Past Ten","After the Moon","Night Traveller","Just After Dark","Sleepless","The Night Watch","Before the Dawn"],
 "gate": ["Just Past the Gate","The Far Paddock","The Open Latch","Over the Back","At the Fence","Last Fencepost","Between Fields","Back Pasture","No Turning Back","The Side Entrance","Through the Gap","Beyond the Fence"],
 "train": ["The Night Express","Last Whistle","Down the Line","Freight House","Track Change","Next Stop","The Station Clock","On the Platform","The Switchyard","One Way Ticket","Right of Way","Final Departure"],
 "music": ["Second Movement","In the Refrain","Perfect Pitch","The High Note","Half a Measure","On Repeat","Last Encore","Blue Melody","A Minor Key","In Good Measure","Call and Response","Fine Tuning"],
 "books": ["In the Footnotes","Last Page","The Unwritten","Open Book","Loose Leaf","By the Letter","Between the Lines","The Last Chapter","Underlined","An Old Edition","The First Draft","A Page Ahead"],
 "road": ["Wrong Turn","Halfway There","The Back Road","Long Way Home","The Shortcut","No Road Signs","Mile by Mile","Off the Map","Still Going","The Next Mile","Return Ticket","The Last Bend"],
 "family": ["Family Memory","Family Saying","Oldest Trick","A Good Inheritance","From Our People","True to the Name","Old Tradition","A Family Secret","The Family Name","Home Relations","Family Resemblance","Long Remembered"],
 "fire": ["First Spark","Fireside","The Last Ember","Burning Bright","Smoke Signal","In the Ashes","Kindling","Keep the Fire","Fire in the Grate","After the Smoke","Emberglow","The Fire Line"],
 "river": ["Under the Bridge","Across the Water","Riverbend","Boatman's Call","Just Downstream","At the Landing","Creekside","The Boathouse","Waters Meet","Back to Shore","The River Road","At Low Water"],
 "orchard": ["Last Apple","Branch by Branch","Garden Party","The Old Orchard","Under the Pears","First Harvest","Bloom Again","Pears for Tea","The Greenhouse","A Garden Gate","Early Blossom","The Apple Shed"],
 "foal": ["First on the Scene","Right on Time","The Little One","Just Arrived","Off They Go","The New Arrival","By Morning","A Fine Beginning","First One Up","Welcome Home","Born Ready","Still Growing"],
 "wildlife": ["A Wild Visitor","What Was That","Field Company","A Short Glimpse","From the Wild","Passing Through","Another Creature","A Brief Encounter","On the Wing","Wild Neighbors","Out of Sight","A Quiet Presence"],
 "winter": ["After the Snow","By the Fireside","A White Morning","The First Flake","Frost Line","Thawing Out","Ice on the Pond","Cold Morning","January Light","The Last Sleet","Under the Snow","Winter Window"],
 "summer": ["One Warm Evening","One Hot Day","The Summer House","Summer Light","In the Shade","Summer Visitor","At High Noon","Heat of the Day","At the Last Light","Long Bright Day","Sunburnt","A Summer Memory"],
 "market": ["On Market Street","A County Affair","The Fairground","Town Hall","At the Parade","Sunday Market","Homegrown","The Village Green","Little Street","The Grandstand","Familiar Faces","End of the Fair"],
 "craft": ["An Honest Trade","Hand to Hand","The Old Workbench","Fine Grain","Copper Nail","Black Iron","Work in Progress","Cut to Measure","Well Made","The Ironworks","Shaped by Hand","The Final Cut"],
 "seaside": ["Beyond the Pier","The Harbour Wall","An Island Away","On the Dunes","Harbor Lights","Sea Glass","Homeward Bound","A Fair Wind","Last to Sail","Into the Tide","The Salt Air","Dockside"],
 "luck": ["One Good Turn","Pure Chance","As Luck Has It","Against All Odds","The Long Shot","Fortune Found","Take Another","On a Hunch","Lucky Again","No Accident","My Good Fortune","Try Once More"],
 "personality": ["The Last Word","Trouble Already","Make Me","Why Not Me","Don't Tell Me","A Mind to Win","Won't Budge","Watch This","The Usual Suspect","Get My Way","Not for Sale","No Small Thing"],
 "door": ["The Back Door","On the Step","Someone Knocking","The Side Window","Open the Door","Halfway In","Under the Porch","The Front Step","Welcome Mat","The Brass Knob","Through the Window","Door to Door"],
 "movement": ["Quick on the Turn","One Long Stride","Off We Go","The Next Step","A Little Hop","On the Move","The Side Step","Full of Running","Keep Moving","A Step Beyond","In Full Flight","First to Move"],
 "markings": ["Signature Mark","A Certain Look","Look Again","The Small Detail","Hard to Miss","Distinctive","Marked for Life","At First Glance","Unmistakable","Just So","You Can Tell","Marked Out"],
 "whimsy": ["No Laughing Matter","The Funny Side","Oh Really","That Was Funny","You Must Be Joking","Who Said So","Hear Me Out","Not a Chance","You Heard Me","Just Kidding","Good One","Here We Go"],
});

function getEvidence(brief){
 const arr=(brief?.evidence||[]).map(e=>({
  evidenceId:e.id,narrative:e.kind==='OWNER_ATTESTED'?clean(e.detail):clean(e.sourceDetails?.naming_narrative)
 })).filter(e=>e.narrative.length>=35);
 return arr;
}
function quoteNear(narrative,regex){
 const m=regex.exec(narrative),point=m?.index||0;
 const left=Math.max(0,point-30),right=Math.min(narrative.length,point+75);
 let txt=narrative.slice(left,right).trim();
 if(txt.length<12)txt=narrative.slice(0,Math.min(narrative.length,80));
 return txt;
}
function shapes(name){const n=name.trim().split(/\s+/).length;return n===1?'single':n===2?'two':'phrase'}

/** Reusable pure creative proposals for a TRUSTED game brief. Does not approve. */
export function createLocalStoryIdeas(brief,{count=8,attempt=0,scanAll=false}={}){
 if(brief?.status!=='READY_FOR_ORIGINAL_NAME_WRITING'||
  !Number.isInteger(count)||count<1||count>8||
  !Number.isInteger(attempt)||attempt<0||attempt>1000000||
  typeof scanAll!=='boolean')
  throw Error('Invalid trusted local foal naming brief');
 const source=getEvidence(brief);
 if(!source.length)return {suggestions:[],hits:[]};
 const seed=fnv(brief.horseId+'|'+brief.owner?.id+'|'+source.map(x=>x.narrative).join('|')+'|'+attempt);
 const random=rng(seed);
 let hits=[];
 for(const e of source)for(const voice of VOICES){
  if(!voice.cue.test(e.narrative))continue;
  hits.push({voice,evidenceId:e.evidenceId,narrative:e.narrative});
 }
 if(!hits.length)return {suggestions:[],hits:[]};
 hits=hits.map(x=>({...x,sort:random()})).sort((a,b)=>a.sort-b.sort);
 // The Naming Desk gets up to 24 varied initial ideas; it still shows at
 // most eight suggestions through the established shared editor gate.
 // Actual foaling cohorts scan the complete eligible author-written pool.
 const limit=scanAll?Infinity:count*3;
 const pools=new Map(VOICES.map(v=>[v.id,[...v.names,...(V488_WHOLE_NAMES[v.id]||[])]]));
 const passes=Math.max(...hits.map(h=>pools.get(h.voice.id).length));
 const suggestions=[],seen=new Set();
 const gcd=(a,b)=>{while(b){const t=b;b=a%b;a=t}return a};
 const selectors=new Map(hits.map(h=>{
  const names=pools.get(h.voice.id),length=names.length;
  const offset=fnv(seed+'|'+h.voice.id+'|start')%length;
  let step=1+(fnv(seed+'|'+h.voice.id+'|step')%Math.max(1,length-1));
  while(gcd(step,length)!==1)step=step%length+1;
  return [h.voice.id,{offset,step}];
 }));
 for(let pass=0;pass<passes&&suggestions.length<limit;pass++){
  for(const hit of hits){
   const names=pools.get(hit.voice.id),selector=selectors.get(hit.voice.id);
   if(pass>=names.length)continue;
   const name=names[(selector.offset+pass*selector.step)%names.length];
   const nameKey=norm(name);
   if(name.length>18||!nameKey||seen.has(nameKey))continue;
   seen.add(nameKey);
   const quote=quoteNear(hit.narrative,hit.voice.cue);
   suggestions.push({name,evidenceId:hit.evidenceId,evidenceQuote:quote,
    explanation:'The source recalls “'+quote+'.” “'+name+'” refers to '+
     hit.voice.why+', which makes the association specific to this foal.',
    motifId:hit.voice.id});
   if(suggestions.length>=limit)break;
  }
 }
 return {suggestions,hits};
}

/** Entirely local generation. Repeated calls with same horse/seed are identical. */
export function generateLocalStoryFirstHorseNames({world,state,horse,brief,count=8,attempt=0,recentNames=[],reservedNames=[],issuedNames=[],additionalReviewedNames=[]}={}){
 if(!Number.isInteger(count)||count<1||count>8||!Number.isInteger(attempt)||attempt<0||attempt>1_000_000)
  throw Error('Invalid local naming generation controls');
 const verified=verifyNamingBriefAgainstGame({world,state,horse,brief});
 const source=getEvidence(verified);
 if(source.length===0)return {schema:LOCAL_HORSE_NAMING_SCHEMA,horseId:brief.horseId,
  status:'HOLD_NEEDS_HORSE_CONTEXT',screened:[],readyForIndependentEditor:0,held:0,
  algorithmRevision:LOCAL_HORSE_NAMING_ALGORITHM_REVISION,
  requestCount:0,creditsUsed:0,gameWrites:0,registrationStatus:'NOT_RELEASED'};
 const {suggestions,hits}=createLocalStoryIdeas(verified,{count,attempt});
 if(!hits.length)return {schema:LOCAL_HORSE_NAMING_SCHEMA,horseId:verified.horseId,
  status:'HOLD_NO_VERIFIED_NAMING_MOTIF',screened:[],readyForIndependentEditor:0,held:0,
  algorithmRevision:LOCAL_HORSE_NAMING_ALGORITHM_REVISION,
  requestCount:0,creditsUsed:0,gameWrites:0,registrationStatus:'NOT_RELEASED'};
 const reviewed=new Set([...recentNames,...reservedNames,...issuedNames,...additionalReviewedNames].map(norm));
 // The shared quality gate correctly screens at most eight proposals per call.
 // V485 discarded all later authored alternatives whenever early ideas collided
 // with a prior name. Review bounded pages of eight, never bypass the gate.
 const screened=[],previouslyProposed=[],pageSize=8;
 let held=0;
 for(let index=0;index<suggestions.length;index+=pageSize){
  const page=screenStoryFirstIdeas({world,state,brief:verified,
   rawIdeas:suggestions.slice(index,index+pageSize),
   recentNames:[...recentNames,...previouslyProposed].slice(-60),
   reservedNames,issuedNames,additionalReviewedNames});
  held+=page.held;
  screened.push(...page.screened);
  previouslyProposed.push(...page.screened.map(row=>row.name));
 }
 const rows=screened.filter(x=>!reviewed.has(norm(x.name)));
 const selected=[],usedShapes={single:0,two:0,phrase:0},usedMotifs=new Set();
 for(const r of rows){
  if(r.status!=='AWAITING_INDEPENDENT_EDITOR')continue;
  const original=suggestions.find(x=>x.name===r.name);
  const motif=original?.motifId||'other';
  if(usedMotifs.has(motif)&&usedMotifs.size<Math.min(3,hits.length))continue;
  const shape=shapes(r.name);
  if(shape==='two'&&usedShapes.two>=Math.max(1,Math.ceil(count/3)))continue;
  usedShapes[shape]++;usedMotifs.add(motif);
  selected.push({...r,originMotif:motif,origin:'ON_DEVICE_HORSE_STORY',
   requestCount:0,creditsUsed:0});
  if(selected.length===count)break;
 }
 return {schema:LOCAL_HORSE_NAMING_SCHEMA,horseId:verified.horseId,
  status:selected.length?'LOCAL_IDEAS_READY_FOR_EDITOR':'HOLD_NO_CLEAR_CANDIDATES',
  screened:selected,readyForIndependentEditor:selected.length,
  held,sourceMotifs:[...new Set(hits.map(h=>h.voice.id))],
  algorithmRevision:LOCAL_HORSE_NAMING_ALGORITHM_REVISION,
  candidatesExamined:screened.length,authoredCandidates:suggestions.length,
  requestCount:0,creditsUsed:0,gameWrites:0,registrationStatus:'NOT_RELEASED',
  caveat:'Context-based whole names, not independently proven creative quality. Name availability is not certified.'};
}

/**
 * Future foals: process a planned (<=16) naming cohort entirely on-device.
 * Source must be an exact signed-in-world FOALING_EVENT brief made by the game
 * planner. This NEVER adds horses or names and uses no Worker/D1/API requests.
 */
export function generateLocalPopulationNamingBatch({batch,existingNames=[],attempt=0}={}){
 if(batch?.schema!==POPULATION_NAMING_SCHEMA||!Array.isArray(batch.items)||
  !batch.items.length||batch.items.length>POPULATION_NAMING_BATCH_SIZE||
  !Array.isArray(existingNames)||!Array.isArray(batch.recentNames||[]))
  throw Error('Invalid local population naming batch');
 // The full registry is an input from the single game-save authority. Recent
 // fatigue context is additional, never a substitute for all-time uniqueness.
 const priorNames=[...existingNames,...(batch.recentNames||[])];
 const known=[...priorNames],knownKeys=new Set(known.map(norm));
 const results=[],briefs=[],seenHorses=new Set();
 for(const item of batch.items){
  const brief=item?.brief;
  if(typeof brief?.horseId!=='string'||seenHorses.has(brief.horseId))
   throw Error('Each offline foaling batch requires a unique game horse ID');
  seenHorses.add(brief.horseId);
  const ev=brief?.evidence?.[0];
  if(ev?.kind!=='GAME_EVENT'||typeof ev.sourceRef!=='string'||
   !ev.sourceRef.startsWith('foaling_event:'))throw Error('Missing game foaling event source');
  const sourceId=ev.sourceRef.slice('foaling_event:'.length);
  const event={kind:'FOALING_EVENT',eventId:sourceId,horseId:brief.horseId,
   naming_narrative:ev.sourceDetails?.naming_narrative,
   foalingLocationId:brief.foalingLocationId};
  const trusted=foalingEventNamingBrief({horseId:brief.horseId,foalingYear:brief.foalingYear,
   owner:brief.owner,breeder:brief.breeder,event});
  if(JSON.stringify(trusted)!==JSON.stringify(brief)||brief.foalingYear!==batch.year)
   throw Error('Foal naming record did not match actual game-event brief');

  // V486 took the first two names before the independent screen. A previously
  // reviewed or malformed suggestion could consume a registry key and strand
  // a foal despite valid, later authored alternatives. Screen the whole local
  // story-backed pool first, then reserve ONLY up to two editorial-ready names.
  // Exclude globally reserved keys with a Set before screening to avoid
  // rebuilding a large all-time name registry for every individual proposal.
  const {suggestions}=createLocalStoryIdeas(trusted,{count:8,attempt,scanAll:true});
  const viable=suggestions.filter(s=>!knownKeys.has(norm(s.name)));
  const preview=auditPopulationNamingResults({
   results:[{horseId:trusted.horseId,candidates:viable}],
   briefs:[trusted],existingNames:[]
  });
  const candidates=[];
  for(let i=0;i<viable.length&&candidates.length<2;i++){
   if(preview.screened[0].proposals[i].status!=='READY_FOR_INDEPENDENT_EDITOR')continue;
   const proposal=viable[i],key=norm(proposal.name);
   if(!key||knownKeys.has(key))continue;
   candidates.push({...proposal,origin:'ON_DEVICE_FOALING_EVENT',
    status:'NEEDS_INDEPENDENT_EDITOR'});
   knownKeys.add(key);
   known.push(proposal.name);
  }
  briefs.push(trusted);
  results.push({horseId:trusted.horseId,candidates,
   namingStatus:candidates.length?'REQUIRES_EDITOR':'HOLD_NO_UNIQUE_LOCAL_CANDIDATE',
   approvedForRegistration:false,gameWrites:0});
 }
 // Independent final batch audit is authoritative. A held candidate is NEVER
 // included in the returned cumulative reservation delta.
 const audit=auditPopulationNamingResults({results,briefs,existingNames:priorNames});
 const newCandidateNameKeys=[...new Set(audit.screened.flatMap(row=>row.proposals)
  .filter(p=>p.status==='READY_FOR_INDEPENDENT_EDITOR').map(p=>norm(p.name)))].sort();
 const exhaustedFoals=audit.screened.filter(row=>
  !row.proposals.some(p=>p.status==='READY_FOR_INDEPENDENT_EDITOR')).length;
 return {schema:LOCAL_HORSE_NAMING_SCHEMA,jobId:batch.jobId,year:batch.year,
  requested:batch.items.length,screened:audit.screened,
  readyForIndependentEditor:audit.readyForIndependentEditor,
  held:audit.held,status:'LOCAL_BATCH_COMPLETE_NEEDS_EDITOR',
  nextRecentNames:known.slice(-60),remoteRequests:0,creditsUsed:0,
  algorithmRevision:LOCAL_HORSE_NAMING_ALGORITHM_REVISION,
  exhaustedFoals,newCandidateNameKeys,
  // The local save authority must atomically union these keys into its
  // complete issued/reserved name registry before scheduling later cohorts.
  requiresFullLocalNameRegistry:true,
  writesToGame:false,approvedForRegistration:false};
}
