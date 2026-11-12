/*
 * Read-only, paged projection of the 87,500 accepted opening production horses.
 * Uses one source read-model; no alternate UI or transaction database.
 */
import {PRODUCTION_COUNT,productionHorseAt,productionHorseById,
 productionHorsesForOwner,productionHorsesForTrainer,
 productionPedigree,productionIndexSummary} from './source-readmodel.mjs';
import {participantById,productionParticipantSummary,ownersWithSourceNames,trainersWithSourceNames} from './participant-readmodel.mjs';
const asUrl=x=>x instanceof URL?x:new URL(x,'https://wtw.invalid');
const bounded=(value,fallback,max)=>{const n=Number(value);return value!==null&&Number.isInteger(n)&&n>=0?Math.min(n,max):fallback};
const page=(q,indexes)=>{
 const total=indexes===null?PRODUCTION_COUNT:indexes.length;
 const offset=bounded(q.get('offset'),0,total),limit=Math.min(100,bounded(q.get('limit'),20,100));
 const items=Array.from({length:Math.min(limit,total-offset)},(_,n)=>productionHorseAt(indexes===null?offset+n:indexes[offset+n]));
 return {total,offset,limit,items,recordsSource:'ACCEPTED_1999_PRODUCTION_PARTITIONS__NOT_TEST_GENERATED'};
};
const pageRecords=(q,records)=>{const total=records.length,offset=bounded(q.get('offset'),0,total),limit=Math.min(100,bounded(q.get('limit'),20,100));return {total,offset,limit,items:records.slice(offset,offset+limit),recordsSource:'ACCEPTED_1999_PRODUCTION_PARTICIPANTS'};};
export function readProduction1999World(input){
 const u=asUrl(input),p=u.pathname,q=u.searchParams;
 if(p==='/api/1999/production/overview')return productionIndexSummary();
 if(p==='/api/1999/production/participants/overview')return productionParticipantSummary();
 if(p==='/api/1999/production/participants/owners'){
  const owners=ownersWithSourceNames();return pageRecords(q,owners);
 }
 if(p==='/api/1999/production/participants/trainers'){
  const trainers=trainersWithSourceNames();return pageRecords(q,trainers);
 }
 const person=p.match(/^\/api\/1999\/production\/participants\/([OP]-[0-9]{6})$/);
 if(person){const value=participantById(person[1]);return value?{participant:value}:{error:'Participant identity not in accepted source scaffold',status:404};}
 if(p==='/api/1999/production/horses')return page(q,null);
 if(p==='/api/1999/production/owner-horses'){
  const id=q.get('ownerId');if(!id||!/^O-[A-Z0-9-]{1,50}$/.test(id))throw Error('Owner ID required');
  return page(q,productionHorsesForOwner(id));
 }
 if(p==='/api/1999/production/trainer-horses'){
  const id=q.get('trainerId');if(!id||!/^P-[A-Z0-9-]{1,50}$/.test(id))throw Error('Trainer ID required');
  return page(q,productionHorsesForTrainer(id));
 }
 const horse=p.match(/^\/api\/1999\/production\/horse\/(H-[A-Z0-9-]+)$/i);
 if(horse){const value=productionHorseById(horse[1]);return value?{horse:value}:{error:'Horse not in accepted opening production',status:404};}
 const ped=p.match(/^\/api\/1999\/production\/pedigree\/(H-[A-Z0-9-]+)$/i);
 if(ped){const value=productionPedigree(ped[1],bounded(q.get('depth'),4,5));return value?{pedigree:value}:{error:'Horse not in accepted opening production',status:404};}
 throw Error('Unknown accepted 1999 production read route '+p);
}
