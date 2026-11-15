/**
 * Bounded deterministic opening-industry registry materializer.
 * Produces genuine individual horse records in small batches, not one giant
 * in-memory snapshot. Does not assign invented racing names or results.
 * Consumers must durably commit each batch and its cursor before advancing.
 * The January 1 opening registry excludes 1999 foals not yet born. An optional
 * forecast mode emits projected records with null DOB/sex, never live horses.
 */
import {plan1999Ecosystem} from './fictional-industry-ecosystem-1999.mjs';
export const INDUSTRY_REGISTRY_1999_SCHEMA='WTW_INDUSTRY_REGISTRY_1999_V1';
const cohorts=[
 ['broodmares','BROODMARE',1985],['stallions','STALLION',1984],
 ['annualFoals','FOAL',1999],['yearlings','YEARLING',1998],
 ['twoYearOldProspects','TWO_YEAR_OLD_PROSPECT',1997],
 ['threeYearOldRunners','RACING',1996],
 ['fourYearOldRunners','RACING',1995],
 ['fivePlusRunners','RACING',1993]
];
function hash(seed,key){
 let h=(2166136261^(seed>>>0))>>>0;
 for(let i=0;i<key.length;i++){h^=key.charCodeAt(i);h=Math.imul(h,16777619)}
 return h>>>0;
}
function choose(seed,key,n){return hash(seed,key)%n}
function ref(kind,ordinal){return 'H-FICTIONAL-1999-'+kind.toUpperCase()+'-'+String(ordinal+1).padStart(7,'0')}
function validateRefs(label,items){
 if(!Array.isArray(items)||!items.length||
  items.some(x=>typeof x?.id!=='string'||!x.id))
  throw Error('Missing opening industry '+label+' directory');
 return items;
}
export function* generate1999IndustryRegistryBatches({
 seed=19990101,plan=plan1999Ecosystem({seed}),
 farms,tracks,owners,batchSize=1000,includeProjectedFoals=false
}={}){
 if(!Number.isSafeInteger(seed)||seed<1||!plan?.counts||
  !Number.isInteger(batchSize)||batchSize<1||batchSize>5000)
  throw Error('Invalid opening industry batch request');
 validateRefs('farms',farms);validateRefs('tracks',tracks);
 validateRefs('owners',owners);
 const counts=plan.counts,broodmareCount=counts.broodmares,stallionCount=counts.stallions;
 let batch=[],offset=0;
 for(const [cohort,status,year] of cohorts){
  if(cohort==='annualFoals'&&!includeProjectedFoals)continue;
  const count=counts[cohort];
  if(!Number.isSafeInteger(count)||count<0)throw Error('Invalid registry cohort '+cohort);
  for(let i=0;i<count;i++){
   const id=ref(cohort,i);
   const farm=farms[choose(seed,id+':farm',farms.length)];
   const owner=owners[choose(seed,id+':owner',owners.length)];
   const track=tracks[choose(seed,id+':track',tracks.length)];
   const racing=status==='RACING';
   const breeder=status==='BROODMARE'||status==='STALLION';
   const sex=status==='BROODMARE'?'MARE':status==='STALLION'?'HORSE':
    choose(seed,id+':sex',2)===0?'COLT':'FILLY';
   const born=year-(breeder?choose(seed,id+':age',11):
    cohort==='fivePlusRunners'?choose(seed,id+':older',5):0);
   const sireId=breeder?null:ref('stallions',choose(seed,id+':sire',stallionCount));
   const damId=breeder?null:ref('broodmares',choose(seed,id+':dam',broodmareCount));
   const projected=cohort==='annualFoals';
   const horse={
    id,cohort,status:projected?'PROJECTED_NOT_YET_BORN':status,
    sex:projected?null:sex,foalYear:born,
    dateOfBirth:projected?null:String(born)+'-'+String(2+choose(seed,id+':month',5)).padStart(2,'0')+
     '-'+String(1+choose(seed,id+':day',28)).padStart(2,'0'),
    name:null,namingStatus:'UNNAMED_PERMANENT_ID',
    sireId,damId,ownerId:owner.id,foalingFarmId:farm.id,
    birthplace:{city:farm.location?.city??null,region:farm.location?.region??null,
     country:farm.location?.country??null,farmId:farm.id,
     provenance:'MODELED_FOALING_FARM'},
    homeTrackId:racing?track.id:null,
    development:{readiness:choose(seed,id+':readiness',101),
     soundness:choose(seed,id+':soundness',101),
     potential:1+choose(seed,id+':potential',99)},
    registryProvenance:'FICTIONAL_1999_DETERMINISTIC_V1'
   };
   batch.push(horse);
   if(batch.length===batchSize){
    yield {schema:INDUSTRY_REGISTRY_1999_SCHEMA,seed,offset,
     records:batch,continuation:cohort+':'+(i+1)};
    offset+=batch.length;batch=[];
   }
  }
 }
 if(batch.length)yield {schema:INDUSTRY_REGISTRY_1999_SCHEMA,seed,offset,
  records:batch,continuation:null};
}
export function count1999Registry(plan,{includeProjectedFoals=false}={}){
 return Object.entries(plan.counts).reduce((sum,[cohort,n])=>
  sum+(cohort==='annualFoals'&&!includeProjectedFoals?0:n),0);
}
