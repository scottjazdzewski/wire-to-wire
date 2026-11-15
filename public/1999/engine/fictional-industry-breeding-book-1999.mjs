/**
 * Deterministic opening breeding-season booking ledger.
 * Allocates one mare to at most one stallion and enforces service-book limits.
 * These are COVERINGS, not pregnancies or guaranteed live foals.
 */
import {assignStallionServiceBooks} from './fictional-industry-ecosystem-1999.mjs';
export const BREEDING_BOOK_1999_SCHEMA='WTW_BREEDING_BOOK_1999_V1';
export function* generate1999CoveringLedger({
 seed=19990101,broodmares=63000,stallions=7000,targetCovers=59000,
 batchSize=1000
}={}){
 if(!Number.isSafeInteger(seed)||seed<1||
  !Number.isInteger(batchSize)||batchSize<1||batchSize>5000)
  throw Error('Invalid covering ledger request');
 const service=assignStallionServiceBooks({seed,broodmares,stallions,targetCovers});
 const multiplier=broodmares>1?broodmares-1:1;
 // A coprime step traverses the mare population without duplicates.
 let step=2*Math.floor(multiplier/3)+1;
 const gcd=(a,b)=>b?gcd(b,a%b):a;
 while(gcd(step,broodmares)!==1)step+=2;
 let offset=0,batch=[];
 for(let stallion=0;stallion<stallions;stallion++){
  for(let n=0;n<service.books[stallion];n++){
   const mareIndex=(offset*step+seed)%broodmares;
   batch.push({
    id:'COVER-1999-'+String(offset+1).padStart(7,'0'),
    mareId:'H-FICTIONAL-1999-BROODMARES-'+String(mareIndex+1).padStart(7,'0'),
    stallionId:'H-FICTIONAL-1999-STALLIONS-'+String(stallion+1).padStart(7,'0'),
    status:'COVERING_BOOKED',pregnancy:null,liveFoalId:null,
    provenance:'MODELED_1999_COVERING_NOT_CONFIRMED_PREGNANCY'
   });
   offset++;
   if(batch.length===batchSize){
    yield {schema:BREEDING_BOOK_1999_SCHEMA,records:batch,
     completedCoverings:offset};
    batch=[];
   }
  }
 }
 if(batch.length)yield {schema:BREEDING_BOOK_1999_SCHEMA,records:batch,
  completedCoverings:offset};
}
