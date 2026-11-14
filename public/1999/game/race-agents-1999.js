/**
 * Daily trainer/jockey/race-secretary agents. Game program is sourced from
 * approved 1999 modeled meet/calendar; no ghost results or artificial jockeys.
 */
import {gameRaceProgram,raceEligibility,racingAction,jockeyBookingDecision} from './racing-1999.js';
const diff=(a,b)=>(Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000;
const plus=(date,n)=>new Date(Date.parse(date+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
const horses=state=>Object.values(state.runtime.registered_horses?.by_id||{}).
 filter(h=>Boolean(h.starting_attributes)&&h.host_track_id).
 sort((a,b)=>a.horse_id.localeCompare(b.horse_id));
const stable=(state,trackId)=>horses(state).filter(h=>h.host_track_id===trackId);
const money=(state,owner)=>state.runtime.finances.operation_balances_minor[owner]??0;
const ridden=(state,jockeyId,race)=>Object.values(state.runtime.entries||{}).
 some(e=>e.jockey_id===jockeyId&&e.status!=='SCRATCHED'&&
  state.runtime.races[e.race_id]?.date===race.date&&
  (e.race_id===race.id||state.runtime.races[e.race_id].track_id!==race.track_id));
export function run1999RacingAgents({state,world,emit}){
 const rt=state.runtime.racing;
 if(!rt||Object.keys(rt.jockeys).length<2)return;
 const day=state.clock.date;
 // Secretary and trainers plan a week's targets on the opening/weekly review,
 // without silently entering player-controlled runners.
 if(state.clock.days_elapsed%7===1&&rt.last_selection_date!==day){
  const tracks=[...new Set(horses(state).map(h=>h.host_track_id))].sort();
  for(const trackId of tracks){
   if(Object.values(state.runtime.races).some(r=>r.track_id===trackId&&
    r.status==='ENTRIES_OPEN'&&r.date>=day))continue;
   const local=stable(state,trackId).filter(h=>h.owner_organization_id!==state.player.operation_id);
   if(local.length<2)continue;
   const plans=[];
   for(let offset=5;offset<=12;offset++){
    const raceDay=plus(day,offset);
    for(const race of gameRaceProgram(state,world,trackId,raceDay)){
     // Reserve stakes for real qualification/nomination work; source-driven
     // modeled maiden/class races have testable entry conditions today.
     if(race.stakeId||race.conditions!=='Maiden Special Weight'||
      race.sexRestriction!=='OPEN'||race.ageRequirement!=='3YO+')continue;
     const record={id:race.id,track_id:race.trackId,date:race.date,age:race.ageRequirement,
      sex:race.sexRestriction,conditions:race.conditions,maiden:race.maidenOnly,max_wins:race.maxCareerWins,
      surface:race.surface,field_capacity:race.fieldCapacity};
     const eligible=local.filter(h=>raceEligibility(state,h,record).eligible);
     if(eligible.length<2)continue;
     const compatible=eligible.filter(h=>h.starting_attributes.preferred_surface===
      race.surface||h.starting_attributes.preferred_surface==='DUAL').length;
     const score=eligible.length*100+compatible*4+(race.maidenOnly?25:0)-
      offset*2-Math.abs(race.distanceFurlongs-8)*3;
     plans.push({race,eligible,score});
    }
   }
   plans.sort((a,b)=>b.score-a.score||a.race.id.localeCompare(b.race.id));
   const chosen=plans[0];if(!chosen)continue;
   const r=chosen.race;
   racingAction({state,world,command:{actor:'system',type:'OPEN_1999_RACE',
    payload:{track_id:trackId,date:r.date,race_id:r.id}},emit});
   const confirmed=state.runtime.races[r.id];
   let accepted=0;
   for(const h of chosen.eligible.slice(0,confirmed.field_capacity)){
    if(h.owner_organization_id===state.player.operation_id)continue;
    const jockeys=Object.values(rt.jockeys).filter(j=>!ridden(state,j.id,confirmed)&&
     (j.home_track_id===trackId||diff(day,r.date)>=4)&&
     money(state,h.owner_organization_id)>=(j.home_track_id===trackId?6000:24000)&&
     jockeyBookingDecision(state,world,confirmed,h,j).accept).
     sort((a,b)=>(a.home_track_id===trackId?-1:1)-(b.home_track_id===trackId?-1:1)||
      b.skills.horse_handling+b.skills.judgment-a.skills.horse_handling-a.skills.judgment||
      a.id.localeCompare(b.id));
    if(!jockeys.length)continue;
    racingAction({state,world,command:{actor:'system',type:'ENTER_1999_RACE',
     payload:{race_id:r.id,horse_id:h.horse_id}},emit});
    racingAction({state,world,command:{actor:'system',type:'BOOK_1999_JOCKEY',
     payload:{race_id:r.id,horse_id:h.horse_id,jockey_id:jockeys[0].id}},emit});
    accepted++;
   }
   rt.selection_count++;
   emit('RACE_SECRETARY_AND_TRAINER_PLAN',{track_id:trackId,race_id:r.id,
    date:r.date,eligible_horses:chosen.eligible.length,accepted_starters:accepted,
    jockey_bookings:accepted,reason:'CONDITION_FIT_AND_JOCKEY_AVAILABILITY',
    player_horses_entered_automatically:false});
  }
  rt.last_selection_date=day;
 }
 // Today's race is not automatically a real result unless at least two
 // medically cleared runners and confirmed jockeys are in the valid field.
 for(const race of Object.values(state.runtime.races||{}).
  filter(r=>r.source==='WTW_1999_TRACK_SPECIFIC_MEET_PROGRESSION'&&
   r.date===day&&r.status==='ENTRIES_OPEN').sort((a,b)=>a.id.localeCompare(b.id))){
  for(const id of [...race.field]){
   const e=state.runtime.entries[id],h=state.runtime.registered_horses.by_id[e.horse_id],
    care=state.runtime.horse[h.horse_id];
   if(e.status!=='BOOKED'||!care||care.training.sorenessDays>0||
    care.training.currentRisk>=.78||care.training.readiness<.38||
    care.history.at(-1)?.unfunded===true){
    e.status='SCRATCHED';e.scratch_reason='RACE_DAY_WELFARE_OR_BOOKING';
    race.field=race.field.filter(x=>x!==id);
    emit('RACE_DAY_SCRATCH',{race_id:race.id,horse_id:e.horse_id,
     reason:e.scratch_reason,health_risk:care?.training.currentRisk??null});
   }
  }
  if(race.field.length>=2){
   racingAction({state,world,command:{actor:'system',type:'SETTLE_1999_RACE',
    payload:{race_id:race.id}},emit});
  }else{
   race.status='CANCELLED_INSUFFICIENT_FIELD';
   emit('RACE_CANCELLED',{race_id:race.id,track_id:race.track_id,
    reasons:['INSUFFICIENT_CLEARED_AND_BOOKED_STARTERS'],starters:race.field.length});
  }
 }
 rt.last_settlement_date=day;
}
