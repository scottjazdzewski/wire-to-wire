/** Wire to Wire alternate-universe 1999 stakes program.
 * Noncanonical, ungraded race invitations for active tracks with no source 1999 stakes,
 * plus a second showcase for the 16 revived historical tracks.
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
 'IT-0001':'Curragh International Mile','IT-0002':'Newmarket International Cup',
 'IT-0003':'Ascot Summer Invitational','IT-0004':'Longchamp Autumn Challenge',
 'IT-0005':'Deauville Summer Invitational','IT-0006':'Iffezheim International Mile',
 'IT-0007':'San Isidro International Cup','IT-0008':'Palermo Autumn Classic',
 'IT-0009':'Tokyo International Invitational','IT-0010':'Kyoto International Cup',
 'IT-0011':'Flemington Spring Invitational','IT-0012':'Randwick Championship Mile',
 'IT-0013':'Kenilworth Summer Classic','IT-0014':'Turffontein Highveld Cup',
 'IT-0015':'Cidade Jardim International Mile','IT-0016':'Santiago International Cup'
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
  const international=p.id.startsWith('IT-');
  const fair=/FAIR|SHORT_MEET/.test(p.basis)||/fair|timonium|ferndale/i.test(p.name);
  const purse=international?175000:revived?120000+i*35000:fair?60000:95000+(Number(p.id.slice(-2))%4)*25000;
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
export const WTW_ALTERNATE_STAKES_1999=Object.freeze(out);
export const alternateStakesForTrack1999=(name)=>WTW_ALTERNATE_STAKES_1999.filter(r=>r.trackName===name);
