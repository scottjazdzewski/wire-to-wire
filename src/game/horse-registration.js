/**
 * Founding 1999 game-career registrations. Source world is read-only.
 * A registration requires an accepted naming-release manifest and a licensed
 * physical residence; merely having a farm/institution in canon is insufficient.
 */
import {ensure,isObject,requireString,validDate,worldIdentity} from './contracts.js';

export const HORSE_REGISTRATION_SCHEMA='WTW_CAREER_HORSES_V1';
export const HORSE_REGISTRATION_COMMANDS=Object.freeze(['REGISTER_GAME_HORSE']);
const SAFE_ID=/^H-GAME-1999-[A-Za-z0-9-]{1,64}$/;
const SAFE_REF=/^[A-Za-z0-9][A-Za-z0-9_:-]{1,127}$/;
const SEXES=new Set(['COLT','FILLY','HORSE','MARE','GELDING']);
const PROVENANCE='NEW_1999_GAME_FICTION';
const norm=x=>String(x||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('en-US');
const nonempty=(x,key)=>{requireString(x,key,128);ensure(SAFE_REF.test(x),'HORSE_REGISTRATION','Invalid '+key);return x};
export function createHorseRegistrationRuntime(){
 return {schema:HORSE_REGISTRATION_SCHEMA,by_id:{},by_receipt:{},name_release:null};
}
export function careerHorse(state,world,id){
 return state.runtime.registered_horses?.by_id?.[id]||worldIdentity(world,'horses',id)||null;
}
export function validateHorseRegistrationRuntime(state,world){
 const rt=state.runtime.registered_horses;
 if(rt===undefined)return; // Older untouched runs stay importable.
 ensure(isObject(rt)&&rt.schema===HORSE_REGISTRATION_SCHEMA&&isObject(rt.by_id)&&isObject(rt.by_receipt),
   'HORSE_REGISTRY','Malformed career horse registry');
 const names=new Set(world.entities.horses.map(h=>norm(h.name)));
 for(const [id,h] of Object.entries(rt.by_id)){
  ensure(isObject(h)&&h.horse_id===id&&SAFE_ID.test(id)&&!worldIdentity(world,'horses',id),
   'HORSE_REGISTRY','Invalid or colliding game horse ID');
  ensure(h.provenance===PROVENANCE&&h.registration_date<=state.clock.date&&validDate(h.registration_date),
   'HORSE_REGISTRY','Invalid registration provenance/date');
  ensure(h.foaling_year<=1996&&h.foaling_year>=1980&&Number.isInteger(h.foaling_year)&&
   validDate(h.birth_date)&&Number(h.birth_date.slice(0,4))===h.foaling_year&&
   h.racing_age_1999===1999-h.foaling_year&&SEXES.has(h.sex),
   'HORSE_REGISTRY','Invalid horse age, sex or date');
  ensure(typeof h.registered_name==='string'&&h.registered_name.trim()===h.registered_name&&
   h.registered_name.length>0&&!names.has(norm(h.registered_name)),
   'HORSE_REGISTRY','Duplicate or invalid registered name');
  names.add(norm(h.registered_name));
  ensure(worldIdentity(world,'organizations',h.owner_organization_id)&&
   worldIdentity(world,'organizations',h.breeder_organization_id),
   'HORSE_REGISTRY','Unknown approved owner/breeder');
  ensure(h.sire_id===null||worldIdentity(world,'horses',h.sire_id)||rt.by_id[h.sire_id],
   'HORSE_REGISTRY','Unresolved sire identity');
  ensure(h.dam_id===null||worldIdentity(world,'horses',h.dam_id)||rt.by_id[h.dam_id],
   'HORSE_REGISTRY','Unresolved dam identity');
  ensure(typeof h.foaling_location_id==='string'&&h.foaling_location_id.length>0&&
   typeof h.current_residence_id==='string'&&h.current_residence_id.length>0&&
   typeof h.trainer_id==='string'&&h.trainer_id.length>0&&
   typeof h.racing_barn_id==='string'&&h.racing_barn_id===h.current_residence_id,
   'HORSE_REGISTRY','Missing actual home/trainer/foaling locality');
  ensure(worldIdentity(world,'people',h.trainer_id),'HORSE_REGISTRY','Unknown trainer person identity');
  ensure(isObject(h.naming)&&h.naming.status==='ACCEPTED'&&
   typeof h.naming.release_id==='string'&&h.naming.release_id.length>0&&
   typeof h.naming.candidate_id==='string'&&h.naming.candidate_id.length>0,
   'HORSE_REGISTRY','Missing accepted name provenance');
  const site=state.runtime.facilities?.sites?.[h.current_residence_id];
  ensure(site&&site.id===h.current_residence_id&&site.status==='ACTIVE'&&
   ['RACING_STABLE','TRAINING_CENTER'].includes(site.type)&&
   site.stalls>0&&site.staff_count>=site.staff_required,
   'HORSE_REGISTRY','Registered horse home is not operational');
  ensure(isObject(h.career)&&h.career.starts===0&&h.career.wins===0&&h.career.earnings_minor===0,
   'HORSE_REGISTRY','Cannot import historical starts or winnings');
  ensure(rt.by_receipt[h.registration_receipt_id]===id,
   'HORSE_REGISTRY','Missing receipt-to-horse relation');
 }
 for(const [receipt,id] of Object.entries(rt.by_receipt))
  ensure(rt.by_id[id]?.registration_receipt_id===receipt,'HORSE_REGISTRY','Orphan receipt');
}
export function registerHorseAction({state,world,command,emit}){
 ensure(command.type==='REGISTER_GAME_HORSE'&&command.actor==='system',
   'UNAUTHORIZED_COMMAND','Only authorized registration service may admit horses');
 const p=command.payload, rt=state.runtime.registered_horses??(state.runtime.registered_horses=createHorseRegistrationRuntime());
 ensure(isObject(p)&&isObject(p.horse)&&isObject(p.naming_release),
   'HORSE_REGISTRATION','Horse and accepted naming release required');
 const h=p.horse,release=p.naming_release;
 nonempty(release.release_id,'naming_release.release_id');
 ensure(release.status==='ACCEPTED'&&Array.isArray(release.candidates),
   'HORSE_NAME_RELEASE','Naming release must be accepted and contain a candidate list');
 ensure(isObject(release.reserved_names)&&Array.isArray(release.reserved_names.names)&&
   typeof release.reserved_names.version==='string'&&release.reserved_names.version.length>0,
   'HORSE_NAME_RELEASE','Versioned reserved-name list required');
 nonempty(h.horse_id,'horse_id');
 ensure(SAFE_ID.test(h.horse_id)&&!careerHorse(state,world,h.horse_id),'DUPLICATE_HORSE_ID','Horse ID already used or invalid');
 nonempty(h.registration_receipt_id,'registration_receipt_id');
 ensure(!rt.by_receipt[h.registration_receipt_id],'DUPLICATE_HORSE_RECEIPT','Registration receipt already used');
 const candidate=release.candidates.find(c=>c.candidate_id===h.name_candidate_id&&c.name===h.registered_name&&c.status==='ACCEPTED');
 ensure(Boolean(candidate),'UNACCEPTED_HORSE_NAME','Horse name must exactly match accepted named candidate');
 ensure(![...world.entities.horses.map(x=>x.name),...Object.values(rt.by_id).map(x=>x.registered_name),...release.reserved_names.names]
   .some(x=>norm(x)===norm(h.registered_name)),'DUPLICATE_HORSE_NAME','Name collides with accepted world or reservations');
 ensure(typeof h.registered_name==='string'&&h.registered_name.trim()===h.registered_name&&h.registered_name.length<=100,
   'HORSE_NAME','Invalid registered name');
 ensure(SEXES.has(h.sex)&&Number.isInteger(h.foaling_year)&&h.foaling_year>=1980&&h.foaling_year<=1996&&
   validDate(h.birth_date)&&Number(h.birth_date.slice(0,4))===h.foaling_year,
   'HORSE_AGE','1999 January racing horse must be a properly aged animal');
 ensure(worldIdentity(world,'organizations',h.owner_organization_id)&&
   worldIdentity(world,'organizations',h.breeder_organization_id),'UNKNOWN_ORGANIZATION','Owner and breeder must exist');
 ensure((h.sire_id===null||h.sire_id===undefined)&&(h.dam_id===null||h.dam_id===undefined),
   'LINEAGE_NOT_RELEASED','Parent identity requires separately certified lineage authorization');
 ensure(typeof h.foaling_location_id==='string'&&h.foaling_location_id.trim()&&
   typeof h.current_residence_id==='string'&&h.current_residence_id.trim()&&
   h.current_residence_id===h.racing_barn_id&&
   typeof h.trainer_id==='string'&&h.trainer_id.trim(),
   'HORSE_HOME','Registration requires actual residence, barn, trainer and foaling locality');
 const site=state.runtime.facilities?.sites?.[h.current_residence_id]||null;
 ensure(site&&site.id===h.current_residence_id&&site.status==='ACTIVE'&&
   ['RACING_STABLE','TRAINING_CENTER'].includes(site.type)&&
   site.staff_count>=site.staff_required,
   'UNREGISTERED_BARN','Residence must be an active staffed physical race-training facility');
 const effectiveCapacity=site.staff_required>0?
   Math.floor(site.stalls*Math.min(site.staff_count,site.staff_required)/site.staff_required):site.stalls;
 const occupied=Object.values(rt.by_id).filter(x=>x.current_residence_id===h.current_residence_id).length;
 const reserved=(site.contracts||[]).filter(c=>c.start<=state.clock.date&&c.end>=state.clock.date)
   .reduce((sum,c)=>sum+c.stalls,0);
 ensure(effectiveCapacity>occupied+reserved,'BARN_FULL','No available operational stall capacity');
 ensure(worldIdentity(world,'people',h.trainer_id),'UNKNOWN_TRAINER','Trainer must resolve to approved person identity');
 ensure(h.status==='IN_TRAINING','HORSE_STATUS','Racehorses must register as in training');
 const horse={
  horse_id:h.horse_id,id:h.horse_id,name:h.registered_name,registered_name:h.registered_name,
  sex:h.sex,foaling_year:h.foaling_year,birth_date:h.birth_date,racing_age_1999:1999-h.foaling_year,
  sire_id:null,dam_id:null,
  breeder_organization_id:h.breeder_organization_id,owner_organization_id:h.owner_organization_id,
  foaling_location_id:h.foaling_location_id,current_residence_id:h.current_residence_id,
  racing_barn_id:h.racing_barn_id,trainer_id:h.trainer_id,status:'IN_TRAINING',
  provenance:PROVENANCE,registration_date:state.clock.date,registration_receipt_id:h.registration_receipt_id,
  naming:{status:'ACCEPTED',release_id:release.release_id,candidate_id:candidate.candidate_id,
   reserved_names_version:release.reserved_names.version},
  career:{starts:0,wins:0,earnings_minor:0}
 };
 rt.by_id[horse.horse_id]=horse;rt.by_receipt[horse.registration_receipt_id]=horse.horse_id;
 if(state.player.role==='owner'&&state.player.operation_id===horse.owner_organization_id)
  state.stable_horse_ids.push(horse.horse_id);
 emit('GAME_HORSE_REGISTERED',{horse_id:horse.horse_id,receipt_id:horse.registration_receipt_id,
  naming_release_id:release.release_id,source_world_unchanged:true});
}
export function getRegisteredHorseDirectory(state,world){
 validateHorseRegistrationRuntime(state,world);
 return Object.values(state.runtime.registered_horses?.by_id||{}).map(h=>structuredClone(h));
}
