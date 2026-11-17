/**
 * WTW 1999 approved-source-only engine adapter.
 * No generated horse, owner, trainer, barn, auction, race result or salary.
 * Retains 118 protected North American/Cuban source tracks plus six owner-approved
 * game-world track records (107 active meet venues, 17 historical-only IDs) and protected
 * pre-1999 history strictly as source references, not living test entries.
 */
import {openingWorld1999 as canon} from './canon-mini.mjs';
import {trackProgram1999,trackCardSurface1999} from '../../next/1999-track-program.mjs';
import {trackConditionProfile1999,buildConditionBook1999} from '../../next/1999-condition-book-engine.mjs';
import {applyVerifiedStakeDay1999} from '../../next/1999-verified-stakes-dates.mjs';
import {APPROVED_NEW_TRACK_PROGRAMS_1999} from '../../next/approved-track-expansion-1999.mjs';
import {validateCareerGameDate} from './age-ability.mjs';
const location=o=>({city:o?.locality||o?.city||'',state:o?.region||o?.state||'',
 country:o?.country||'USA'});
// The source directory retains all 118 established track identities.
// A track's OPEN_1999 status governs racing eligibility separately.
const protectedSourceTracks=canon.tracks;
const approvedNewTracks=APPROVED_NEW_TRACK_PROGRAMS_1999.map(t=>({
 id:t.id,name:t.name,locality:t.locality,region:t.state,country:t.country,
 circuit:t.circuit,metroOrSubregion:t.metroOrSubregion,
 registry:'NORTH_AMERICA',geographyStatus:'OWNER_APPROVED_FICTIONAL_OR_ALT_HISTORY',
 sourceBasis:t.basis
}));
const tracks=[...protectedSourceTracks,...approvedNewTracks];
if(protectedSourceTracks.length!==118||tracks.length!==124||
 new Set(tracks.map(t=>t.id)).size!==124)
 throw Error('Approved 1999 track directory unexpectedly changed');
const stakes=canon.stakes1999.map(applyVerifiedStakeDay1999);
const trainers=canon.people.filter(p=>String(p.role||'').toLowerCase().includes('trainer'));
export function createFoundingSourceBase1999({seed=19990101}={}){
 if(!Number.isSafeInteger(seed)||seed<1||seed>4294967295)
  throw Error('Invalid founding source seed');
 const trackAt=i=>{
  if(!Number.isInteger(i)||i<0||i>=tracks.length)throw Error('Track index');
  const t=tracks[i],program=trackProgram1999(t.id),
   active=program?.trackOperating==='OPEN_1999',
   profile=active?trackConditionProfile1999(t.id,seed):null;
  return {id:t.id,sourceTrackId:t.id,name:program?.name||t.name,
   sourceName:program?.sourceName||t.name,location:location(t),
   region:program?.region||t.macro_circuit||t.region||t.state||'',
   circuit:program?.circuit||t.macro_circuit||t.circuit||'',
   metroOrSubregion:program?.metroOrSubregion||t.metroOrSubregion||'',
   surface:trackCardSurface1999(t.id,1)||'HISTORICAL',
   surfaces:program?.surfaces||'Not recorded',
   operating:active?'OPEN_1999':'HISTORICAL_ONLY',playableIn1999:active,
   trackOperating:program?.trackOperating||'HISTORICAL_ONLY',
   ...(program?.physicalTrackId?{physicalTrackId:program.physicalTrackId}:{}),
   ...(program?.venueType?{venueType:program.venueType}:{}),
   ...(program?.physicalFacilityStatus?{physicalFacilityStatus:program.physicalFacilityStatus}:{}),
   ...(program?.classification?{classification:program.classification}:{}),
   ...(program?.archiveStatus?{archiveStatus:program.archiveStatus}:{}),
   meetWindow:active?(program?.meetWindow||''):'',
   raceDays:active?(program?.raceDays||''):'',
   preferredDays:active?(program?.preferredDays||''):'',
   calendarBasis:program?.basis||'',
   surfacesNote:program?.surfaceStatus||'',
   racing:{racesPerCard:active?(profile?.typicalRaces??0):0,
    programTier:active?(profile?.tier||''):'',
    firstPostHour:null},authority:'APPROVED_TRACK_ID__1999_MODELED_MEET_PROGRAM'};
 };
 const ownerAt=i=>{
  if(!Number.isInteger(i)||i<0||i>=canon.organizations.length)throw Error('Source owner index');
  return {...canon.organizations[i],finances:null,portfolio:null,
   authority:'HISTORICAL_SOURCE_ID_ONLY__NO_TEST_FUNDS'};
 };
 const trainerAt=i=>{
  if(!Number.isInteger(i)||i<0||i>=trainers.length)throw Error('Source trainer index');
  const t=trainers[i];
  return {...t,generatedRunners:0,sourceRunners:0,barnCapacity:null,
   roleAttributes:null,ability:null,contract:null,
   authority:'HISTORICAL_TRAINER_ID_ONLY__NOT_EMPLOYED'};
 };
 const horseAt=i=>{throw Error('No original generated racehorses admitted to the 1999 opening');};
 const horseDirectoryAt=horseAt;
 const horseAttributeAt=horseAt;
 const sourcePersonAt=i=>{
  if(!Number.isInteger(i)||i<0||i>=canon.people.length)throw Error('Source person index');
  return {...canon.people[i],ability:null,roleAttributes:null,
   authority:'SOURCE_PERSON__NO_UNAPPROVED_ABILITY'};
 };
 const conditionBook=(date,i)=>{
  validateCareerGameDate(date);
  const track=trackAt(i);
  return buildConditionBook1999({date,track,trackIndex:i,seed,sourceStakes:stakes,
   includeKnownStakes:true});
 };
 const projectAtDate=(record,date='1999-01-01')=>{
  validateCareerGameDate(date);
  return record; // source identity never gains speculative age, skill or money
 };
 return {counts:{tracks:tracks.length,
   activeTracks:tracks.filter(t=>trackProgram1999(t.id)?.trackOperating==='OPEN_1999').length,
   historicalTracks:tracks.filter(t=>trackProgram1999(t.id)?.trackOperating==='HISTORICAL_ONLY').length},sourceStakes:stakes,
  trackAt,ownerAt,trainerAt,horseAt,horseDirectoryAt,horseAttributeAt,
  sourcePersonAt,projectAtDate,conditionBook,
  jockeyBookingMarket:()=>null};
}
