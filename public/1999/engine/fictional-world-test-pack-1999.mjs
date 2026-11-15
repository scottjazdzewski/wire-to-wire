/**
 * Local, reproducible fictional January 1999 test-world input pack.
 * No historical racing horses/results are imported. Track meet programs
 * come from the same 1999 program used by the management UI.
 */
import {TRACK_PROGRAM_1999} from '../../next/1999-track-program.mjs';
import {generateProvisional1999HorseNames} from '../game/horse-naming-local-v485.js';
import {createFictional1999GameRun} from './fictional-world-career-v1.mjs';
export const FICTIONAL_1999_TEST_PACK_SCHEMA='WTW_FICTIONAL_1999_TEST_PACK_V1';
export function fictional1999TrackPack(){
 return Object.values(TRACK_PROGRAM_1999).map(t=>({
  id:t.id,name:t.name,playableIn1999:t.playableIn1999!==false,
  trackOperating:t.trackOperating,surfaces:t.surfaces,
  basis:t.basis,meets:t.meets,stakesIds:t.stakesIds
 }));
}
export function fictional1999Foundation({seed=19990101,sires=80,mares=120}={}){
 if(!Number.isInteger(sires)||sires<1||sires>500||
  !Number.isInteger(mares)||mares<1||mares>500)
  throw Error('Invalid fictional pedigree foundation');
 const batch=generateProvisional1999HorseNames({
  seed:seed+101,horseCount:sires+mares
 });
 return batch.names.map((name,i)=>({
  id:'H-FICTIONAL-FOUNDATION-'+String(i+1).padStart(5,'0'),
  name,sex:i<sires?'HORSE':'MARE',
  foalYear:1978+(i%10),birth_date:String(1978+(i%10))+'-04-15',
  source:'FICTIONAL_GENERATED_PEDIGREE',
  activeIn1999:false
 }));
}
export async function create1999PopulatedTestWorld({
 seed=19990101,worldId='WTW1999Test',horseCount=20000,trackLimit=null
}={}){
 const tracks=fictional1999TrackPack().filter(t=>t.playableIn1999&&
  t.trackOperating==='OPEN_1999');
 const selected=trackLimit===null?tracks:tracks.slice(0,trackLimit);
 if(!selected.length)throw Error('No playable 1999 track programs');
 const foundationHorses=fictional1999Foundation({seed});
 const career=await createFictional1999GameRun({
  seed,worldId,tracks:selected,foundationHorses,horseCount
 });
 return {...career,testPackSchema:FICTIONAL_1999_TEST_PACK_SCHEMA};
}
