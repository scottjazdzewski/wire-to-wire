/** Wire to Wire alternate-universe 1999 stakes program.
 * Noncanonical, ungraded race invitations for active tracks with no source 1999 stakes,
 * plus a second showcase for revived domestic historical racecourses.
 * The 93 original sourced stakes keep their immutable identities and dates.
 */
import {TRACK_PROGRAM_1999,trackCardSurface1999,trackMeetOpen1999} from './1999-track-program.mjs';
const featureNames={
 'T-0006':'Finger Lakes Spring Mile','T-0008':'Laurel Autumn Cup',
 'T-0011':'Garden State Classic','T-0012':'Charles Town Invitational',
 'T-0015':'Turfway Winter Classic','T-0016':'Ellis Park Summer Handicap',
 'T-0018':'Hialeah Spring Classic','T-0019':'Calder Championship Mile',
 'T-0024':'Delta Downs Cup','T-0025':'Lone Star Texas Mile',
 'T-0026':'Sam Houston Championship','T-0027':'Retama Park Invitational',
 'T-0031':'Golden Gate Bay Mile','T-0032':'Bay Meadows Classic',
 'T-0033':'Longacres Evergreen Handicap','T-0037':'Detroit Race Course Cup',
 'T-0042':'Atlantic City Turf Challenge','T-0044':'Colonial Virginia Cup',
 'T-0046':'Kentucky Downs Turf Cup','T-0052':'Canterbury Summer Classic',
 'T-0053':'Prairie Meadows Championship','T-0059':'Turf Paradise Desert Mile',
 'T-0060':'Yavapai Mile','T-0061':'Sunland Desert Classic',
 'T-0062':'Ruidoso Mountain Handicap','T-0063':'Albuquerque Fall Classic',
 'T-0064':'Arapahoe Park Mile','T-0065':'Emerald Downs Invitational',
 'T-0076':'Fort Erie Canadian Cup','T-0077':'Hastings Summer Classic',
 'T-0078':'Assiniboia Prairie Cup','T-0079':'Northlands Alberta Classic',
 'T-0094':'Sweetwater Georgia Cup','T-0095':'Cumberland Tennessee Classic',
 'T-0096':'Queen City Carolina Derby','T-0097':'Front Range Colorado Mile',
 'T-0098':'Silver State Nevada Cup','T-0099':'Wasatch Mountain Classic',
 'T-0100':'Heartland Missouri Derby','T-0101':'Cream City Wisconsin Mile',
};
const iso=(monthDay)=>'1999-'+monthDay;
const dayMS=86400000;
function pickFeatureDate(program,meet,ratio){
 const [a,b]=meet,start=Date.parse(iso(a)+'T12:00:00Z'),end=Date.parse(iso(b)+'T12:00:00Z');
 const target=start+Math.floor((end-start)*ratio/dayMS)*dayMS;
 for(let offset=0;offset<=50;offset++){
  for(const direction of [1,-1]){
   const t=target+offset*direction*dayMS;
   if(t<start||t>end)continue;
   const d=new Date(t).toISOString().slice(0,10);
   if(trackMeetOpen1999(program.id,d))return d;
  }
 }
 throw Error('No modeled racing date for '+program.id);
}
const out=[];
for(const p of Object.values(TRACK_PROGRAM_1999)){
 if(p.stakesIds.length||p.trackOperating!=='OPEN_1999')continue;
 const revived=p.basis==='WTW_ALTERNATE_HISTORY_CONTINUED_OPERATION';
 const count=revived?2:1;
 const base=p.name.replace(/\s+(?:Race Track|Race Course|Racecourse)$/i,'').trim();
 for(let i=0;i<count;i++){
  const meet=p.meets[i? p.meets.length-1:0];
  const localDate=pickFeatureDate(p,meet,i?.7:.58);
  const title=(revived?p.wtwFeatureNames?.[i]:null)||(i?base+' Autumn Cup':featureNames[p.id]||base+' Invitational');
  const turf=p.surfaces==='Turf'||p.surfaces.includes('Turf')&&i===1;
  const surface=trackCardSurface1999(p.id,turf?5:1);
  const fair=/FAIR|SHORT_MEET/.test(p.basis)||/fair|timonium|ferndale/i.test(p.name);
  const purse=revived?120000+i*35000:fair?60000:95000+(Number(p.id.slice(-2))%4)*25000;
  out.push(Object.freeze({
   id:'WTW-STK-1999-'+p.id+'-'+String(i+1).padStart(2,'0'),
   name:title,trackId:p.id,trackName:p.name,localDate,date:localDate,
   division:'WTW ALTERNATE-HISTORY FEATURE',status:'WTW FEATURE · GAME MODELED',
   grade:'WTW UNGRADED FEATURE',ageRequirement:'3YO+',sexRestriction:'OPEN',
   surface,distanceF:turf?8.5:8,distanceFurlongs:turf?8.5:8,purse1999:purse,
   canonical:false,calendarBasis:'WTW_ALTERNATE_HISTORY_GAME_MODELED',
   fullConditions:'WTW modeled feature race. Exact weights, nomination terms and eligibility conditions are not historically sourced; entries remain uncommitted.'
  }));
 }
}

/* Eight expressly fictional WTW 1999 racecourses have full supporting stakes
 * programs, not only their pre-existing -01 showcase. Every extra feature
 * is GAME MODELED: it never claims a 1999 historical result or official grade. */
const fictionalStakes={
 'T-0094':['Georgia Derby','Peach State Oaks','Piedmont Mile','Southern Sprint','Sweetwater Juvenile','Chattahoochee Turf Cup','Georgia Distaff','Sweetwater Classic','Southern Turf Mile','Georgia Summer Cup','Sweetwater Marathon'],
 'T-0095':['Cumberland Derby','Volunteer Oaks','Tennessee Mile','Music City Sprint','Cumberland Juvenile','Appalachian Turf Cup','Volunteer Distaff','Cumberland Classic','Nashville Turf Mile','Cumberland Summer Cup','Tennessee Marathon'],
 'T-0096':['Carolina Derby','Queen City Oaks','Tar Heel Mile','Piedmont Sprint','Charlotte Juvenile','Carolina Turf Cup','Queen City Distaff','Carolina Classic','Charlotte Turf Mile','Blue Ridge Cup','Carolina Marathon'],
 'T-0097':['Colorado Derby','Rocky Mountain Oaks','Continental Divide Mile','High Plains Sprint','Front Range Juvenile','Colorado Summer Cup','Aspen Distaff','Front Range Classic','Centennial Dirt Mile','Colorado Championship','Rocky Mountain Marathon'],
 'T-0098':['Nevada Derby','Silver State Oaks','Desert Mile','Reno Sprint','Silver State Juvenile','High Desert Cup','Sierra Distaff','Nevada Classic','Silver State Dirt Mile','Nevada Championship','Desert Marathon'],
 'T-0099':['Wasatch Derby','Great Salt Lake Oaks','Deseret Mile','Wasatch Sprint','Utah Juvenile','Alpine Cup','Mountain Distaff','Salt Lake Classic','Utah Dirt Mile','Wasatch Championship','Mountain Marathon'],
 'T-0100':['Missouri Derby','Heartland Oaks','Show-Me Mile','Missouri River Sprint','Heartland Juvenile','Gateway Turf Cup','Ozark Distaff','Heartland Classic','Missouri Turf Mile','Missouri Summer Cup','Heartland Marathon'],
 'T-0101':['Wisconsin Derby','Cream City Oaks','Great Lakes Mile','Brew City Sprint','Cream City Juvenile','Lakefront Cup','Badger State Distaff','Cream City Classic','Wisconsin Dirt Mile','Cream City Championship','Dairyland Marathon']
};
const grades=['WTW G1','WTW G2','WTW G3','WTW G3','WTW G3','WTW G2','WTW G3','WTW G1','WTW G3','WTW G2','REGIONAL STAKES'];
const purses=[600000,400000,300000,250000,200000,300000,225000,650000,220000,325000,175000];
for(const [id,names] of Object.entries(fictionalStakes)){
 const p=TRACK_PROGRAM_1999[id];
 if(!p||p.basis!=='WTW_FICTIONAL_GAME_MODELED'||names.length!==11)
  throw Error('Incorrect WTW fictional track program: '+id);
 const saturdays=[];
 for(let t=Date.parse('1999-01-01T12:00:00Z');t<=Date.parse('1999-12-31T12:00:00Z');t+=86400000){
  const d=new Date(t).toISOString().slice(0,10);
  if(new Date(t).getUTCDay()===6&&trackMeetOpen1999(id,d))saturdays.push(d);
 }
 if(saturdays.length<11)throw Error('Too few race dates for '+id);
 for(let i=0;i<names.length;i++){
  const name=names[i],date=saturdays[Math.floor((i+.5)*saturdays.length/names.length)];
  const turf=/Turf/i.test(name)||p.surfaces.includes('Turf')&&i===7;
  if(turf&&!p.surfaces.includes('Turf'))throw Error('Turf race on dirt course '+id);
  const surface=turf?'TURF':'DIRT',distance=/Sprint/.test(name)?6:/Marathon/.test(name)?12:/Derby|Classic/.test(name)?10:8.5;
  out.push(Object.freeze({
   id:'WTW-STK-1999-'+id+'-'+String(i+2).padStart(2,'0'),
   name,trackId:id,trackName:p.name,localDate:date,date,
   division:grades[i],grade:grades[i],status:'WTW PLANNED STAKES · NOT RUN',
   ageRequirement:[0,1,4].includes(i)?'3YO':'3YO+',sexRestriction:[1,6].includes(i)?'FILLIES_AND_MARES':'OPEN',
   surface,distanceF:distance,distanceFurlongs:distance,purse1999:purses[i],
   canonical:false,calendarBasis:'WTW_FICTIONAL_GAME_MODELED',
   fullConditions:'WTW fictional stakes; final imposts, nominations and entry terms are not yet issued. No result or entry has occurred.'
  }));
 }
}

export const WTW_ALTERNATE_STAKES_1999=Object.freeze(out);
export const alternateStakesForTrack1999=(name)=>WTW_ALTERNATE_STAKES_1999.filter(r=>r.trackName===name);
