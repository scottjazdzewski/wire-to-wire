/** WIRE TO WIRE — supplemental 1999 racing-world stakes, not historical results.
 * The 93 immutable 1999 source stakes and 96 fictional-track flagship stakes remain
 * authoritative. This file provides optional regional stakes for other courses
 * in the larger-than-history 87,500-horse WTW alternate racing universe.
 */
import {TRACK_PROGRAM_1999,trackMeetOpen1999} from './1999-track-program.mjs';
const monthDay=(mmdd)=>'1999-'+mmdd;
function datesFor(p){
 const result=[];
 for(const [a,b] of p.meets||[]){
  const end=new Date(monthDay(b)+'T12:00:00Z').getTime();
  for(let ms=new Date(monthDay(a)+'T12:00:00Z').getTime();ms<=end;ms+=86400000){
   const d=new Date(ms).toISOString().slice(0,10);
   if(trackMeetOpen1999(p.id,d))result.push(d);
  }
 }
 return [...new Set(result)].sort();
}
function amount(p){
 const type=p.basis||'';
 return /FICTIONAL_GAME_MODELED/.test(type)?0:
 (p.stakesIds||[]).length>=9?0:
 (p.stakesIds||[]).length>=3?2:
 (p.stakesIds||[]).length>=1?3:
 /^IT-/.test(p.id)?4:
 /FAIR|COUNTY|FESTIVAL/.test(p.preferredDays||'')?2:
 /HISTORICAL|ALTERNATE/.test(type)?4:5;
}
const endings=['Championship Stakes','Autumn Classic','Spring Derby Trial','Juvenile Stakes','Distaff Cup','Sprint Handicap','Turf Invitational','Breeders Handicap','Summer Mile','Founders Cup'];
const stakes=[];
for(const p of Object.values(TRACK_PROGRAM_1999)){
 const n=amount(p),days=datesFor(p);
 if(!n||!days.length||p.trackOperating!=='OPEN_1999')continue;
 const base=p.name.replace(' Racecourse','').replace(' Race Course','').replace(' Race Track','').trim();
 for(let i=0;i<n;i++){
  const date=days[Math.min(days.length-1,Math.floor((i+1)*days.length/(n+1)))];
  const name=base+' '+endings[(i+p.id.charCodeAt(p.id.length-1))%endings.length];
  const surface=p.surfaces==='Turf'?'TURF':p.surfaces.includes('Turf')&&i%3===0?'TURF':'DIRT';
  const tier=(p.stakesIds||[]).length>=3?2:/VERIFIED|APPROVED_WTW|PUBLISHED/.test(p.basis)?2:1;
  const purse1999=(tier===2?165000:90000)+(i%3)*30000;
  stakes.push(Object.freeze({id:'STK-WTW-REG-'+p.id.replace(/[^A-Z0-9]/g,'')+'-'+String(i+1).padStart(2,'0'),
   name,trackId:p.id,trackName:p.name,localDate:date,date,grade:'WTW REGIONAL',class:'WTW STAKES',
   division:'WTW SUPPLEMENTAL STAKES',status:'PLANNED_WTW_NOT_RUN',canonical:false,source:'WTW_1999_ALTERNATE_RACING_WORLD',
   purse:purse1999,purse1999,surface,distanceFurlongs:[6,8,9,7,8,6,8,9,10,8][i%10],
   ageRequirement:i%5===2?'3YO':'3YO+',sexRestriction:i%5===4?'FILLIES_AND_MARES':'OPEN',
   results:[],entries:[]}));
 }
}
export const WTW_REGIONAL_STAKES_1999=Object.freeze(stakes);
