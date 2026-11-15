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
export const LOCAL_HORSE_NAMING_ALGORITHM_REVISION='WTW_LOCAL_NAMING_RULES_V486';
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
 {id:'blackout',cue:/\b(power outage|power went out|electricity|blackout|lights? (?:went out|failed|cut out|flickered)|darkened)\b/i,why:'the loss of light described in the source account',names:['Blackout','The Last Light','Dark Horse Hour','Lights Out','After the Lights','By Candlelight','Night Watchman','Candlewick']},
 {id:'breathing',cue:/\b(breath(?:e|ing|ed)?|heartbeat|pulse|exhale|heartbeat)\b/i,why:'the remembered rhythm and breathing of the horse',names:['Cadence','Still Breathing','The Sound of Life','Hold Fast','Inhale','The Pulse','Softly Spoken','Steady As She Goes']},
 {id:'calm',cue:/\b(calm|quiet|patient|unbothered|unafraid|gentle|still|serene|peaceful)\b/i,why:'the horse’s unusual composure in the story',names:['Unflappable','Even Keel','Cool Customer','Nothing Stirring','As You Were','Easy Does It','Take It Easy','Quietly So']},
 {id:'bell',cue:/\b(bell|toll|chime|ringing|belfry|carillon)\b/i,why:'the remembered bell or resonant sound',names:['Tocsin','The Last Toll','Bellwether','A Clear Note','Bronze Echo','The Ringing','Second Bell','Bellmaker']},
 {id:'rain',cue:/\b(rain|drizzle|downpour|shower|flood|monsoon|wet)\b/i,why:'the rain or water that marked the event',names:['Raincheck','The Deluge','Downriver','After Rain','Wet Footprints','Dry by Morning','Cloudburst','In the Weather']},
 {id:'sun',cue:/\b(sun|sunshine|sunrise|dawn|morning|daybreak|first light)\b/i,why:'the remembered light or beginning of the day',names:['Daybreak','Before Breakfast','Morning Call','The Early Bird','A New Day','At First Light','Sunward','The Wakeup']},
 {id:'night',cue:/\b(night|dark|darkness|dusk|midnight|moon|twilight|evening)\b/i,why:'the darkness or nighttime setting',names:['Nightjar','Nocturne','After Hours','Night Clerk','On the Late Shift','The Night Shift','After Dark','The Lookout']},
 {id:'gate',cue:/\b(gate|fence|pasture|paddock|field|enclosure|crossing)\b/i,why:'the distinctive place around the horse’s arrival',names:['The Gatekeeper','Over the Fence','Open Gate','Far Corner','Fencepost','The Other Side','Past the Gate','West Pasture']},
 {id:'train',cue:/\b(train|rail|locomotive|station|whistle|freight|railway|railroad)\b/i,why:'the train or rail setting named in the account',names:['Switchman','Whistle Stop','The Last Car','The Limited','Iron Mile','Railbird','First Platform','Trackside']},
 {id:'music',cue:/\b(music|song|melody|violin|piano|guitar|singer|dance|tune|harmony|concert)\b/i,why:'the music remembered in this horse’s story',names:['Encore','Counterpoint','Lullaby','Interlude','The Last Dance','Overture','The Chorus','Blue Note']},
 {id:'books',cue:/\b(book|letter|novel|story|poem|read|library|page|novelist|writer)\b/i,why:'the written work or spoken story described in the source',names:['Inkling','Postscript','Out of Print','Second Draft','The Margins','Marginalia','Footnote','Fair Copy']},
 {id:'road',cue:/\b(road|highway|drive|journey|mile|route|trip|travel|trail|path)\b/i,why:'the journey or location that shaped the memory',names:['Last Exit','The Long Way','Wayfarer','Milemarker','Off Route','The Detour','Roadside','Good Directions']},
 {id:'family',cue:/\b(mother|father|grandmother|grandfather|family|uncle|aunt|brother|sister|son|daughter|grandad|mama)\b/i,why:'a specific family connection identified in the record',names:['Namesake','By Tradition','Family Affair','Someone Like You','Kinsman','Old Saying','Remember Me','Family Matter']},
 {id:'fire',cue:/\b(fire|flame|ember|smoke|burn|cinder|bonfire|hearth)\b/i,why:'the fire or smoke recorded in the story',names:['Firebreak','Cinder','Rekindle','Old Flame','Ashfall','The Spark','Long Burning','Ember']},
 {id:'river',cue:/\b(river|creek|stream|water|lake|ferry|brook|pond|harbor)\b/i,why:'the specific waterway or water setting',names:['Ferryboat','River Pilot','High Water','Low Tide','Downstream','The Crossing','Headwaters','Far Shore']},
 {id:'orchard',cue:/\b(orchard|apple|pear|peach|garden|flower|rose|tree|seed|blossom)\b/i,why:'the orchard, garden or growing place in the account',names:['Applecart','First Bloom','The Gardener','Rootstock','Full Blossom','Last Orchard','Pippin','Seedling']},
 {id:'foal',cue:/\b(foal|filly|colt|mare|stallion|barn|stable|birthing|born|birth)\b/i,why:'the foaling or stable scene actually documented',names:['The Newcomer','One of a Kind','First Footstep','Early Visitor','Well Arrived','There She Is','First Impression','Homecoming']},
 {id:'wildlife',cue:/\b(fox|bird|owl|deer|rabbit|dog|hound|cat|crow|hawk|eagle)\b/i,why:'the animal encountered in the source account',names:['Reynard','Night Visitor','The Naturalist','Redwing','A Close Shave','Wild Company','Field Notes','The Watcher']},
 {id:'winter',cue:/\b(winter|snow|ice|frost|blizzard|cold|freezing|sleet)\b/i,why:'the winter weather or cold setting in the account',names:['Hard Frost','The Thaw','Cold Comfort','Whiteout','Cold Snap','Snowbound','After the Freeze','By December']},
 {id:'summer',cue:/\b(summer|heat|hot|august|july|june|warm|humid)\b/i,why:'the summer heat or season named in the account',names:['High Summer','Dog Days','The Solstice','Hot Weather','Summerlong','Long Day','Late Summer','Heatwave']},
 {id:'market',cue:/\b(market|fair|festival|parade|town|village|county|square|street)\b/i,why:'the public gathering or hometown setting',names:['At the Fair','Town Crier','Side Street','Market Day','Home County','Main Street','The Parade','The Outsider']},
 {id:'craft',cue:/\b(iron|blacksmith|wood|carpenter|saw|hammer|forge|craft|workshop|metal)\b/i,why:'the specific craft or tool that matters to the account',names:['Forged Ahead','Handmade','True Temper','The Carpenter','Sawtooth','Journeyman','Ironclad','Anvil']},
 {id:'seaside',cue:/\b(sea|ocean|beach|coast|shore|sail|boat|island|tide)\b/i,why:'the coastal place or vessel named in the account',names:['Mariner','Beachcomber','The Lookout','Seaward','Portside','Full Sail','Tidewater','Sea Change']},
 {id:'luck',cue:/\b(luck|lucky|chance|accident|unexpected|surprise|miracle|mistake)\b/i,why:'the improbable turn described in the record',names:['Mulligan','Against the Odds','That Figures','Not by Chance','Unexpectedly','As It Happens','Beginners Luck','One More Try']},
 {id:'personality',cue:/\b(stubborn|contrary|independent|defiant|curious|playful|bold|mischievous|tricky|clever|nosey|nosy|determined)\b/i,why:'the unusual personality trait the caretaker observed',names:['Maverick','No Apologies','The Instigator','Mind of My Own','A Bit Contrary','Uninvited','Not Listening','Contrarian']},
 {id:'door',cue:/\b(door|window|latch|hinge|knock|knocking|porch|steps|threshold)\b/i,why:'the familiar sound or doorway in the account',names:['At the Door','The Threshold','The Last Knock','Threshold','Not Home','Second Knock','The Doorman','Hinge']},
 {id:'movement',cue:/\b(jump|leap|bolt|run|running|race|gallop|stride|kick|buck|step|walk|dance)\b/i,why:'the animal’s distinct movement in the source story',names:['Quickstep','Sidewinder','Off Balance','In Motion','Astride','High Stepper','The Spring','On His Toes']},
 {id:'markings',cue:/\b(star|stripe|white blaze|marking|spot|freckle|coat|black mane|chestnut|roan|gray|grey)\b/i,why:'the foal’s explicitly recorded appearance',names:['White Blaze','The Mark','Speckled','Freckle','Bright Mark','Starboard','One Spot','Signature']},
 {id:'whimsy',cue:/\b(laugh|laughter|smile|funny|joke|giggle|humor|humour|silly|grin)\b/i,why:'a genuine humorous or affectionate detail in the account',names:['Inside Joke','Who Knew','A Good Laugh','Laughing Matter','There You Go','Not Funny','The Punchline','The Grin']}
]);

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
export function createLocalStoryIdeas(brief,{count=8,attempt=0}={}){
 if(brief?.status!=='READY_FOR_ORIGINAL_NAME_WRITING'||
  !Number.isInteger(count)||count<1||count>8||
  !Number.isInteger(attempt)||attempt<0||attempt>1000000)
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
 // Randomized across *motifs* but no word-grid joins. Each name is a fully
 // written candidate. Cap one proposal per motif on a first pass to fight fatigue.
 hits=hits.map(x=>({...x,sort:random()})).sort((a,b)=>a.sort-b.sort);
 const suggestions=[],seen=new Set(),maxAttempts=hits.length*12;
 let trials=0,pass=0;
 while(suggestions.length<count*3&&trials++<maxAttempts){
  const hit=hits[(trials-1)%hits.length];
  const offset=(Math.floor(random()*hit.voice.names.length)+(pass*3))%hit.voice.names.length;
  const name=hit.voice.names[offset];
  if(name.length>18||seen.has(norm(name))||!norm(name)){
   if(trials%hits.length===0)pass++;continue;
  }
  seen.add(norm(name));
  const e=hit.narrative;
  const quote=quoteNear(e,hit.voice.cue);
  suggestions.push({name,evidenceId:hit.evidenceId,evidenceQuote:quote,
   explanation:`The source recalls “${quote}.” “${name}” refers to ${hit.voice.why}, which makes the association specific to this foal.`,
   motifId:hit.voice.id});
  if(trials%hits.length===0)pass++;
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
  !Array.isArray(existingNames))throw Error('Invalid local population naming batch');
 const results=[],briefs=[],known=[...existingNames,...(batch.recentNames||[])];
 const newCandidateKeys=new Set(),seenHorses=new Set();
 let exhaustedFoals=0;
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
  const {suggestions}=createLocalStoryIdeas(trusted,{count:8,attempt});
  const seen=new Set(known.map(norm)),candidates=[];
  for(const item of suggestions){
   if(seen.has(norm(item.name)))continue;
   candidates.push({...item,origin:'ON_DEVICE_FOALING_EVENT',status:'NEEDS_INDEPENDENT_EDITOR'});
   seen.add(norm(item.name));
   newCandidateKeys.add(norm(item.name));
   if(candidates.length>=2)break;
  }
  known.push(...candidates.map(x=>x.name));
  if(candidates.length===0)exhaustedFoals++;
  briefs.push(trusted);results.push({horseId:trusted.horseId,candidates,
   namingStatus:candidates.length?'REQUIRES_EDITOR':'HOLD_NO_UNIQUE_LOCAL_CANDIDATE',
   approvedForRegistration:false,gameWrites:0});
 }
 const audit=auditPopulationNamingResults({results,briefs,existingNames:[...existingNames,...(batch.recentNames||[])]});
 return {schema:LOCAL_HORSE_NAMING_SCHEMA,jobId:batch.jobId,year:batch.year,
  requested:batch.items.length,screened:audit.screened,
  readyForIndependentEditor:audit.readyForIndependentEditor,
  held:audit.held,status:'LOCAL_BATCH_COMPLETE_NEEDS_EDITOR',
  nextRecentNames:known.slice(-60),remoteRequests:0,creditsUsed:0,
  algorithmRevision:LOCAL_HORSE_NAMING_ALGORITHM_REVISION,
  exhaustedFoals,newCandidateNameKeys:[...newCandidateKeys].sort(),
  // Never treat recent-name fatigue (last 60) as a complete uniqueness ledger.
  // The caller must union newCandidateNameKeys into the locally saved global
  // issued/reserved-name registry before planning another cohort.
  requiresFullLocalNameRegistry:true,
  writesToGame:false,approvedForRegistration:false};
}