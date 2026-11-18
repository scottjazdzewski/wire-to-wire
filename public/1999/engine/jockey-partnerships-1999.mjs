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
 * Trainer-jockey and owner-jockey relationships are genuine past WORK.
 * Signed future mounts remain real professional commitments and are shown
 * as booked counts, but they cannot build loyalty BEFORE the horses run.
 * Only official, already completed rides build the competition preference.
 * Current offer's unbooked entry is never counted.
 */
export function get1999JockeyPartnership(state,{trainerId,ownerId,jockeyId}={}){
 if(!trainerId||!ownerId||!jockeyId)
  throw Error('Trainer, owner and jockey permanent IDs required');
 let trainerMounts=0,trainerWins=0,trainerPlaces=0,
  ownerMounts=0,ownerWins=0,trainerPursesMinor=0,
  trainerRiddenMounts=0,ownerRiddenMounts=0,
  trainerBookedMounts=0,ownerBookedMounts=0,
  mostRecentTrainerDate=null;
 for(const e of Object.values(state.runtime?.entries||{})){
  if(!isMount(e)||e.jockey_id!==jockeyId)continue;
  const race=state.runtime?.races?.[e.race_id];
  if(!race)continue;
  // Calendar authority is the career clock. A future signed reservation,
  // or even a mistakenly future-dated official row, cannot manufacture
  // trust for the current negotiation. Neither case changes the booking.
  const completed=e.status==='RESULTED'&&
   race.status==='OFFICIAL_SIM_RESULT'&&
   (!state.clock?.date||race.date<=state.clock.date);
  const won=completed&&e.finish===1;
  if(entryTrainer(state,e)===trainerId){
   trainerMounts++;
   if(e.status==='BOOKED')trainerBookedMounts++;
   if(completed){
    trainerRiddenMounts++;
    if(won)trainerWins++;
    if(e.finish<=3)trainerPlaces++;
    trainerPursesMinor+=Number(race.results?.find(r=>
     r.horse_id===e.horse_id)?.jockey_share_minor||0);
    if(!mostRecentTrainerDate||race.date>mostRecentTrainerDate)
     mostRecentTrainerDate=race.date;
   }
  }
  if(entryOwner(state,e)===ownerId){
   ownerMounts++;
   if(e.status==='BOOKED')ownerBookedMounts++;
   if(completed){
    ownerRiddenMounts++;
    if(won)ownerWins++;
   }
  }
 }
 // Completed work matters. Future contracted mounts count in the public
 // booking history, but never become the rider's earned preference.
 // Wins and finishes strengthen trust; even a long partnership cannot
 // guarantee victory over a better horse or a higher-prestige offer.
 const trainerBond=clamp((Math.min(trainerRiddenMounts,16)*.037)+
  (Math.min(trainerWins,8)*.044)+
  (Math.min(trainerPlaces,12)*.012),0,.8);
 const ownerBond=clamp(Math.min(ownerRiddenMounts,14)*.025+
  Math.min(ownerWins,8)*.035,0,.55);
 return {trainerId,ownerId,jockeyId,trainerMounts,trainerWins,trainerPlaces,
  trainerPursesMinor,ownerMounts,ownerWins,
  trainerRiddenMounts,ownerRiddenMounts,
  trainerBookedMounts,ownerBookedMounts,mostRecentTrainerDate,
  trainerBond:Math.round(trainerBond*1000)/1000,
  ownerBond:Math.round(ownerBond*1000)/1000,
  evidence:'ONLY_OFFICIAL_COMPLETED_RIDES_EARN_LOYALTY_SIGNED_MOUNTS_REMAIN_BOOKED'};
}
