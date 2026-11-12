/**
 * WTW 1999 — shared, deterministic track-specific condition books.
 * The game models ordinary race cards within established meet windows.
 * Historical/WTW stakes are invitations, NOT entries, starts or results.
 * No horse, course, purse or source-stakes record is mutated.
 */
import {trackProgram1999,trackMeetOpen1999} from './1999-track-program.mjs';
import {applyVerifiedStakeDay1999} from './1999-verified-stakes-dates.mjs';
import {WTW_ALTERNATE_STAKES_1999} from './1999-alternate-stakes.mjs';
import {WTW_REGIONAL_STAKES_1999} from './1999-regional-stakes.mjs';

const PREMIER=new Set(['T-0002','T-0003','T-0013','T-0014','T-0017','T-0028','T-0029','T-0030']);
const MAJOR=new Set(['T-0001','T-0004','T-0007','T-0008','T-0009','T-0019','T-0021','T-0022','T-0023','T-0025','T-0034','T-0039']);
const REGIONAL=new Set(['T-0005','T-0010','T-0011','T-0015','T-0016','T-0018','T-0020','T-0026','T-0027','T-0031','T-0032','T-0035','T-0036','T-0040','T-0044','T-0047','T-0052','T-0053','T-0057','T-0059','T-0065','T-0076','T-0077']);
const FAIR=new Set(['T-0042','T-0045','T-0046','T-0058','T-0068','T-0069','T-0070','T-0071','T-0072','T-0073','T-0074','T-0075','T-0085','T-0091','T-0092','T-0093']);
const LEVELS=Object.freeze({
 PREMIER:{min:10,max:12,msw:41000,mdn:23000,claim:22000,allowance:47000,optional:48000,starter:32000,handicap:57000,turfEvery:3,claims:[16000,25000,35000,50000,65000]},
 MAJOR:{min:9,max:11,msw:34000,mdn:19000,claim:17000,allowance:38500,optional:41000,starter:26000,handicap:47000,turfEvery:4,claims:[12500,16000,20000,30000,40000]},
 REGIONAL:{min:8,max:10,msw:25000,mdn:13500,claim:11000,allowance:29000,optional:31000,starter:19500,handicap:35000,turfEvery:4,claims:[7500,10000,12500,16000,25000]},
 LOCAL:{min:7,max:9,msw:16000,mdn:9000,claim:7500,allowance:19000,optional:22000,starter:13000,handicap:24000,turfEvery:5,claims:[4000,5000,7500,10000,15000]},
 FAIR:{min:6,max:8,msw:10500,mdn:6000,claim:5100,allowance:12500,optional:14500,starter:8000,handicap:17000,turfEvery:5,claims:[2500,3500,5000,7500,10000]},
 GROWTH:{min:9,max:11,msw:27500,mdn:16000,claim:14000,allowance:31500,optional:34500,starter:22000,handicap:42000,turfEvery:4,claims:[10000,12500,16000,25000,35000]},
 REVIVAL:{min:8,max:10,msw:22500,mdn:12500,claim:10500,allowance:26000,optional:29500,starter:17500,handicap:33500,turfEvery:4,claims:[5000,7500,10000,16000,25000]}
});
const MIX=Object.freeze({
 PREMIER:['Maiden Special Weight','Allowance','Allowance Optional Claiming','Claiming','Maiden Special Weight','Allowance','Handicap','Claiming','Starter Allowance','Allowance','Maiden Claiming','Claiming'],
 MAJOR:['Maiden Special Weight','Claiming','Allowance','Allowance Optional Claiming','Claiming','Maiden Special Weight','Allowance','Handicap','Starter Allowance','Claiming','Maiden Claiming'],
 REGIONAL:['Claiming','Maiden Special Weight','Allowance','Claiming','Maiden Claiming','Allowance','Starter Allowance','Claiming','Allowance Optional Claiming','Claiming'],
 LOCAL:['Claiming','Maiden Claiming','Allowance','Claiming','Maiden Special Weight','Claiming','Starter Allowance','Allowance','Claiming','Maiden Claiming'],
 FAIR:['Claiming','Maiden Claiming','Claiming','Allowance','Claiming','Maiden Special Weight','Starter Allowance','Claiming'],
 GROWTH:['Allowance','Maiden Special Weight','Claiming','Allowance Optional Claiming','Maiden Claiming','Claiming','Allowance','Handicap','Starter Allowance'],
 REVIVAL:['Claiming','Allowance','Maiden Special Weight','Claiming','Maiden Claiming','Starter Allowance','Allowance','Claiming','Handicap']
});
const hash=(seed,value)=>{let h=(2166136261^(seed>>>0))>>>0;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}h^=h>>>16;h=Math.imul(h,2246822507);h^=h>>>13;return h>>>0;};
const ratio=(seed,key)=>hash(seed,key)/4294967296;
const round500=value=>Math.round(value/500)*500;
const pad=(v,width)=>String(v).padStart(width,'0');
function levelFor(id,program){
 if(program?.basis==='WTW_FICTIONAL_GAME_MODELED')return 'GROWTH';
 if(/WTW_ALTERNATE_HISTORY_CONTINUED_OPERATION|WTW_ALTERNATE_SURVIVAL_MODELED/.test(program?.basis||''))return 'REVIVAL';
 if(FAIR.has(id))return 'FAIR';
 if(PREMIER.has(id))return 'PREMIER';
 if(MAJOR.has(id))return 'MAJOR';
 if(REGIONAL.has(id))return 'REGIONAL';
 return 'LOCAL';
}
export function trackConditionProfile1999(id,seed=19990101){
 const p=trackProgram1999(id);
 if(!p||p.trackOperating!=='OPEN_1999')return null;
 const tier=levelFor(id,p),shape=LEVELS[tier];
 // Track-level variance is stable across the season, not an unrelated random purse each card.
 const moneyScale=.90+.20*ratio(seed,'wtw:1999:track:money:'+id);
 const purses=Object.fromEntries(['msw','mdn','claim','allowance','optional','starter','handicap']
  .map(k=>[k,round500(shape[k]*moneyScale)]));
 return {id,tier,source:'WTW_1999_MODELED_TRACK_PROGRAM',racesMin:shape.min,racesMax:shape.max,
  typicalRaces:Math.round((shape.min+shape.max)/2),purses,turfEvery:shape.turfEvery,
  claimingBands:shape.claims,approvedSurfaces:p.surfaces,calendarBasis:p.basis};
}
function plannedStakes(date,sourceTrackId,sourceStakes){
 const candidates=[
  ...sourceStakes.map(applyVerifiedStakeDay1999),
  ...WTW_ALTERNATE_STAKES_1999,
  ...WTW_REGIONAL_STAKES_1999
 ];
 const seen=new Set();
 return candidates.filter(s=>{
  if(s.trackId!==sourceTrackId||s.localDate!==date||seen.has(s.id))return false;
  seen.add(s.id);return true;
 }).sort((a,b)=>(Number(b.purse1999??b.purse)||0)-(Number(a.purse1999??a.purse)||0)||a.id.localeCompare(b.id));
}
const purseKey=cl=>cl==='Maiden Special Weight'?'msw':cl==='Maiden Claiming'?'mdn':
 cl==='Claiming'?'claim':cl==='Allowance'?'allowance':
 cl==='Allowance Optional Claiming'?'optional':cl==='Starter Allowance'?'starter':'handicap';
function raceSurface(program,profile,number,trackIndex){
 if(program.surfaces==='Turf')return 'TURF';
 if(!program.surfaces.includes('Turf'))return 'DIRT';
 return (number+trackIndex)%profile.turfEvery===0?'TURF':'DIRT';
}
function raceDistance(seed,id,surface,level){
 const turf=surface==='TURF',sprint=ratio(seed,id+':distance')<(turf?.24:.51);
 const distances=turf?(sprint?[5.5,6,6.5]:[8,8.5,9,10,11,12]):
  sprint?[5.5,6,6.5,7]:level==='FAIR'?[8,8.5,9]:[8,8.5,9,9.5,10];
 return distances[hash(seed,id+':furlongs')%distances.length];
}
function ageForStakes(stake){
 const a=String(stake.ageRequirement||stake.ageSex||'').toUpperCase();
 if(/2\s*YO|TWO.YEAR.OLD/.test(a))return '2YO';
 if(/3\s*YO|THREE.YEAR.OLD/.test(a))return /3\s*YO\+|AND UP|UPWARD/.test(a)?'3YO+':'3YO';
 if(/4\s*YO/.test(a))return '4YO+';
 return '3YO+';
}
function sexesForStakes(stake){
 const s=String(stake.sexRestriction||stake.ageSex||'').toUpperCase();
 return /FILL|MARE|F&M/.test(s)?'FILLIES_AND_MARES':'OPEN';
}
/**
 * Complete ordered daily condition book. A stakes race occupies one race number;
 * it never appears as an extra entry beyond the card's declared race count.
 */
export function buildConditionBook1999({date,track,trackIndex,seed=19990101,sourceStakes=[],includeKnownStakes=true}){
 if(!/^1999-\d{2}-\d{2}$/.test(String(date||''))||
    Number.isNaN(Date.parse(date+'T12:00:00Z'))||
    new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw Error('1999 date required');
 const id=track.sourceTrackId||track.id,program=trackProgram1999(id),profile=trackConditionProfile1999(id,seed);
 if(!program||!profile||!trackMeetOpen1999(id,date))return [];
 const stakes=includeKnownStakes?plannedStakes(date,id,sourceStakes):[];
 const weekday=new Date(date+'T12:00:00Z').getUTCDay();
 const weekend=weekday===0||weekday===6;
 let count=profile.racesMin+hash(seed,'1999:'+id+':races:'+date)%(profile.racesMax-profile.racesMin+1);
 if(weekend&&count<profile.racesMax)count++;
 count=Math.max(count,stakes.length+2);
 count=Math.min(16,count);
 if(stakes.length>count)throw Error('WTW stakes overflow: '+id+' '+date);
 // Principal feature in the penultimate position; supporting stakes precede it.
 const positions=new Map(stakes.map((s,i)=>[count-1-i,s]));
 const result=[];
 for(let number=1;number<=count;number++){
  const raceId='R-TEST-1999-'+date.replaceAll('-','')+'-'+pad(trackIndex+1,3)+'-'+pad(number,2);
  const stake=positions.get(number)||null;
  let cl,claimingPrice=null,maxCareerWins=null,winRestriction,fullConditions,ageRequirement,sexRestriction;
  let surface,distanceFurlongs,purse;
  if(stake){
   cl=String(stake.grade||stake.status||'STAKES');
   ageRequirement=ageForStakes(stake);
   sexRestriction=sexesForStakes(stake);
   winRestriction='Stakes nomination, qualification and declared weights to be determined';
   fullConditions=String(stake.fullConditions||stake.name+'; '+ageRequirement+'; '+(sexRestriction==='FILLIES_AND_MARES'?'fillies and mares':'open sexes')+
    '. Stakes nominations and eligibility are not yet published in this WTW game condition book.');
   surface=String(stake.surface||'DIRT').toUpperCase();
   if(!program.surfaces.includes(surface==='TURF'?'Turf':'Dirt'))
    throw Error('Stakes surface not supported: '+stake.id+' at '+id);
   distanceFurlongs=Number(stake.distanceFurlongs??stake.distanceF)||8;
   purse=Number(stake.purse1999??stake.purse)||round500(profile.purses.handicap*3);
  }else{
   const pool=MIX[profile.tier];
   cl=pool[hash(seed,raceId+':class')%pool.length];
   const ageUnit=ratio(seed,raceId+':age'),twoEligible=date.slice(5)>='04-01';
   ageRequirement=twoEligible&&ageUnit<.09?'2YO':ageUnit<.34?'3YO':'3YO+';
   const females=hash(seed,raceId+':female')%6===0;
   sexRestriction=females?'FILLIES_AND_MARES':'OPEN';
   const maidenOnly=cl.startsWith('Maiden');
   const claiming=cl==='Claiming'||cl==='Maiden Claiming'||cl==='Allowance Optional Claiming';
   if(claiming){
    const bands=profile.claimingBands;
    claimingPrice=bands[hash(seed,raceId+':claim')%bands.length];
   }
   maxCareerWins=cl==='Allowance'?1:null;
   winRestriction=maidenOnly?'Maidens (no career wins)':maxCareerWins===1?'Non-winners of two lifetime':
    cl==='Starter Allowance'?'A qualifying prior claiming start is required':
    cl==='Allowance Optional Claiming'?'Allowance eligibility or modeled optional claiming terms':
    cl==='Handicap'?'Handicap weights pending declaration':'Open to eligible starters';
   fullConditions=cl+'; '+ageRequirement+'; '+(females?'fillies and mares only':'open sexes')+
    '; '+winRestriction+(claimingPrice?' · modeled claiming price $'+claimingPrice.toLocaleString('en-US'):'')+
    '. This is a modeled 1999 condition, not an official published race.';
   surface=raceSurface(program,profile,number,trackIndex);
   distanceFurlongs=raceDistance(seed,raceId,surface,profile.tier);
   const key=purseKey(cl);
   purse=round500(profile.purses[key]*(0.89+0.22*ratio(seed,raceId+':purse')));
  }
  const record={id:raceId,date,trackId:track.id,sourceTrackId:id,trackName:track.name,number,
   name:stake?.name||'Race '+number,conditions:stake?'Stakes — '+cl:cl,
   maidenOnly:!stake&&cl.startsWith('Maiden'),maxCareerWins,claimingPrice,winRestriction,fullConditions,
   weightConditions:'Weights and allowances pending declaration; no official impost recorded',
   entryTerms:'No official entry deadline or nomination terms recorded',
   ageRequirement,sexRestriction,surface,distanceFurlongs,purse,
   fieldCapacity:8+hash(seed,raceId+':field')%7,currentEntries:[],results:[],
   status:'CONDITION_BOOK_PROPOSAL_NOT_RUN',canonical:false,programTier:profile.tier,
   conditionBookBasis:'WTW_1999_TRACK_SPECIFIC_MODELED',
   ...(stake?{stakeId:stake.id,stakeName:stake.name,stakesGrade:cl,
    stakeSourceStatus:stake.canonStatus||stake.calendarBasis||stake.source||'WTW_PLANNED_STAKES',
    stakesPurse1999:purse}: {})
  };
  result.push(record);
 }
 return result;
}
