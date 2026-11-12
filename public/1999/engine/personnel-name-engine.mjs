/*
 * WTW professional human naming layer for the January 1999 TEST world.
 * Uses the existing role/country sample pools as its base; never rewrites
 * source-backed people, never infers real ethnicity from an occupation.
 */
import {createGeographicNameRoster,GEO_NAME_MODEL} from './geographic-names.mjs';
export const PERSONNEL_NAME_MODEL='WTW_1999_PROFESSIONAL_ROLE_NAMES_V1';
function hash(seed,key){let h=(2166136261^(seed>>>0))>>>0;for(const c of String(key)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}h^=h>>>16;return h>>>0;}
const norm=x=>String(x||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
const probability={trainer:9,jockey:4,owner:12,farm_manager:8,assistant_trainer:5,exercise_rider:3,groom:2,veterinarian:16,farrier:6,bloodstock_agent:15,jockey_agent:8,racing_secretary:14};
function alternate(name,role,seed,i){
 const pieces=name.split(' ');
 if(pieces.length<2)return name;
 const first=pieces[0],last=pieces.slice(1).join(' '),k=role+':'+i;
 if(role==='veterinarian'&&hash(seed,k+':dr')%3===0)return 'Dr. '+name;
 if(role==='owner'&&hash(seed,k+':suffix')%7===0)return name+' '+(hash(seed,k+':ii')%3===0?'III':'Jr.');
 if(role==='trainer'&&hash(seed,k+':suffix')%15===0)return name+' Jr.';
 const letter=String.fromCharCode(65+hash(seed,k+':middle')%26);
 return first+' '+letter+'. '+last;
}
export function createPersonnelNameRoster(seed,count,roleAt,protectedNames=[]){
 const base=createGeographicNameRoster(seed,count,roleAt,protectedNames);
 const used=new Set(protectedNames.map(norm));
 for(const record of base)used.add(norm(record.name));
 return base.map((record,i)=>{
  const role=roleAt(i),threshold=probability[role]??7;
  let name=record.name,style='GIVEN_SURNAME';
  if(hash(seed,'style:'+i+':'+role)%100<threshold){
   const proposed=alternate(name,role,seed,i);
   if(!used.has(norm(proposed))){used.add(norm(proposed));name=proposed;style='ROLE_SPECIFIC_EXTENDED_NAME';}
  }
  return {...record,name,nameStyle:style,nameModel:PERSONNEL_NAME_MODEL,
   baseNameModel:GEO_NAME_MODEL};
 });
}