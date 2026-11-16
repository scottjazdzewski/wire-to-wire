/**
 * Race-by-race jockey relationships in the actual saved game.
 * Reconstruct from signed, paid mounts and official results. No synthetic
 * contracts, hidden historical results, new rider IDs, or duplicate save state.
 */
export const JOCKEY_PARTNERSHIP_MODEL='WTW_1999_JOCKEY_PARTNERSHIPS_V1';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const isMount=e=>e?.jockey_id&&['BOOKED','RESULTED'].includes(e.status);
const horseFor=(state,e)=>state.runtime?.registered_horses?.by_id?.[e.horse_id];
const entryTrainer=(state,e)=>e.trainer_id||horseFor(state,e)?.trainer_id;
const entryOwner=(state,e)=>e.owner_id||horseFor(state,e)?.owner_organization_id;
/**
 * Trainer-jockey and owner-jockey relationships are genuine past work:
 * mounts already paid for, results, and repeat engagements. A successful
 * partner can win a desirable booking without inventing a lifelong pact.
 * Current offer's unbooked entry is never counted.
 */
export function get1999JockeyPartnership(state,{trainerId,ownerId,jockeyId}={}){
 if(!trainerId||!ownerId||!jockeyId)
  throw Error('Trainer, owner and jockey permanent IDs required');
 let trainerMounts=0,trainerWins=0,trainerPlaces=0,
  ownerMounts=0,ownerWins=0,trainerPursesMinor=0,
  mostRecentTrainerDate=null;
 for(const e of Object.values(state.runtime?.entries||{})){
  if(!isMount(e)||e.jockey_id!==jockeyId)continue;
  const race=state.runtime?.races?.[e.race_id];
  if(!race)continue;
  const completed=e.status==='RESULTED'&&
   race.status==='OFFICIAL_SIM_RESULT';
  const won=completed&&e.finish===1;
  if(entryTrainer(state,e)===trainerId){
   trainerMounts++;
   if(won)trainerWins++;
   if(completed&&e.finish<=3)trainerPlaces++;
   if(completed)trainerPursesMinor+=Number(race.results?.find(r=>
    r.horse_id===e.horse_id)?.jockey_share_minor||0);
   if(!mostRecentTrainerDate||race.date>mostRecentTrainerDate)
    mostRecentTrainerDate=race.date;
  }
  if(entryOwner(state,e)===ownerId){
   ownerMounts++;
   if(won)ownerWins++;
  }
 }
 // Repeat professional experience matters more than prior generated identity
 // hashes; early positive finishes help, but cannot guarantee any booking.
 const trainerBond=clamp((Math.min(trainerMounts,16)*.037)+
  (Math.min(trainerWins,8)*.044)+
  (Math.min(trainerPlaces,12)*.012),0,.8);
 const ownerBond=clamp(Math.min(ownerMounts,14)*.025+
  Math.min(ownerWins,8)*.035,0,.55);
 return {trainerId,ownerId,jockeyId,trainerMounts,trainerWins,trainerPlaces,
  trainerPursesMinor,ownerMounts,ownerWins,mostRecentTrainerDate,
  trainerBond:Math.round(trainerBond*1000)/1000,
  ownerBond:Math.round(ownerBond*1000)/1000,
  evidence:'REAL_SAVED_MOUNTS_AND_RESULTS_NOT_SYNTHETIC_PERSONALITY'};
}
