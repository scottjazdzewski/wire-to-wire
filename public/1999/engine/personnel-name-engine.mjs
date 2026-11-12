/*
 * WTW fictional human naming ecology for January 1999.
 * Country draw is provisional role-based editorial worldbuilding; it is NOT
 * an ethnicity inference, nationality certificate, or historical source claim.
 * The base 1990 US Census excerpts remain in geographic-names.mjs.
 *
 * Trainer, jockey, owner and supporting-profession rules are distinct.
 * Historically locked people are supplied as protected names and never edited.
 * Stable ordering and a fixed seed guarantee repeatable identities.
 */
import {createGeographicNameRoster,GEO_NAME_MODEL} from './geographic-names.mjs';
export const PERSONNEL_NAME_MODEL='WTW_1999_PROFESSIONAL_ROLE_NAMES_V2';

function hash(seed,key){
 let h=(2166136261^(seed>>>0))>>>0;
 for(const c of String(key)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
 h^=h>>>16;return h>>>0;
}
const norm=x=>String(x||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'');
const LATIN=new Set(['PR','PA','VE','MX','CL','PE','CO','DO']);
const STYLE={
 trainer:{middle:9,compound:3,secondFamily:7,nickname:2},
 jockey:{middle:5,compound:4,secondFamily:17,nickname:4},
 owner:{middle:15,compound:4,secondFamily:9,nickname:0},
 farm_manager:{middle:10,compound:2,secondFamily:5,nickname:1},
 veterinarian:{middle:17,compound:3,secondFamily:5,nickname:0},
 farrier:{middle:4,compound:1,secondFamily:7,nickname:4},
 bloodstock_agent:{middle:14,compound:3,secondFamily:9,nickname:1},
 racing_secretary:{middle:15,compound:2,secondFamily:5,nickname:0},
 assistant_trainer:{middle:6,compound:2,secondFamily:7,nickname:2},
 jockey_agent:{middle:9,compound:2,secondFamily:12,nickname:2},
 exercise_rider:{middle:4,compound:3,secondFamily:12,nickname:3},
 groom:{middle:4,compound:3,secondFamily:10,nickname:4},
 default:{middle:6,compound:2,secondFamily:7,nickname:1}
};
const NICKNAMES={
 Robert:'Bobby',William:'Billy',Joseph:'Joey',Michael:'Mike',
 Richard:'Richie',James:'Jimmy',Daniel:'Danny',Edward:'Eddie',
 Charles:'Charlie',Thomas:'Tommy',Anthony:'Tony',Samuel:'Sam',
 Jonathan:'Johnny',Francisco:'Frankie',Alejandro:'Alex',Miguel:'Mickey',
 Manuel:'Manny',Patrick:'Pat',Raymond:'Ray',Benjamin:'Benji'
};
const COMPOUND={
 Mary:'Mary Beth',Anne:'Anne Marie',Anna:'Anna Maria',John:'John Paul',
 Juan:'Juan Carlos',Jose:'Jose Luis',Maria:'Maria Elena',
 Carlos:'Carlos Alberto',Ana:'Ana Maria',Luis:'Luis Miguel'
};
function secondSurname(seed,i,country,byCountry,base,primary){
 const peers=byCountry.get(country)||[];
 if(peers.length<2)return null;
 for(let a=0;a<12;a++){
  const j=peers[hash(seed,'second-surname:'+i+':'+a)%peers.length];
  const parts=base[j].name.trim().split(/\s+/),other=parts.at(-1);
  if(other&&norm(other)!==norm(primary))return other;
 }
 return null;
}
function variant(seed,i,record,role,byCountry,base){
 const name=record.name;
 const parts=name.trim().split(/\s+/);
 if(parts.length<2)return {name,style:'GIVEN_SURNAME'};
 const first=parts[0],last=parts.slice(1).join(' ');
 const country=record.birthCountry;
 const rules=STYLE[role]||STYLE.default;
 const roll=hash(seed,'person-style:'+role+':'+i)%100;
 const middleLetter=String.fromCharCode(65+hash(seed,'middle-letter:'+i)%26);
 const western=country==='US'||country==='CA'||country==='GB'||country==='IE';
 const family=LATIN.has(country);
 if(role==='veterinarian'&&roll<32)return {name:'Dr. '+name,style:'PROFESSIONAL_TITLE'};
 if(family&&roll<rules.secondFamily){
  const surname2=secondSurname(seed,i,country,byCountry,base,last);
  if(surname2)return {name:name+' '+surname2,style:'TWO_SURNAMES'};
 }
 if(western&&roll>=rules.secondFamily&&roll<rules.secondFamily+rules.middle)
  return {name:first+' '+middleLetter+'. '+last,style:'MIDDLE_INITIAL'};
 if(COMPOUND[first]&&roll>=rules.middle&&roll<rules.middle+rules.compound)
  return {name:COMPOUND[first]+' '+last,style:'COMPOUND_GIVEN_NAME'};
 if(NICKNAMES[first]&&roll>=80&&roll<80+rules.nickname)
  return {name:first+' "'+NICKNAMES[first]+'" '+last,style:'COMMON_NICKNAME'};
 return {name,style:'GIVEN_SURNAME'};
}
export function createPersonnelNameRoster(seed,count,roleAt,protectedNames=[]){
 if(!Number.isSafeInteger(seed)||seed<1||!Number.isInteger(count)||count<0)
  throw Error('Invalid personnel name seed or count');
 const base=createGeographicNameRoster(seed,count,roleAt,protectedNames);
 const reserved=new Set(protectedNames.map(norm));
 // Reserve every base name first so variants cannot accidentally appropriate an
 // identity that belongs to a later person, or to a different professional role.
 for(const record of base){
  const key=norm(record.name);
  if(!key||reserved.has(key))throw Error('Base personnel name collision');
  reserved.add(key);
 }
 const byCountry=new Map();
 for(let i=0;i<base.length;i++){
  const country=base[i].birthCountry;
  if(!byCountry.has(country))byCountry.set(country,[]);
  byCountry.get(country).push(i);
 }
 return base.map((record,i)=>{
  const role=roleAt(i),candidate=variant(seed,i,record,role,byCountry,base);
  let name=record.name,nameStyle='GIVEN_SURNAME';
  if(candidate.name!==name&&!reserved.has(norm(candidate.name))){
   name=candidate.name;nameStyle=candidate.style;reserved.add(norm(name));
  }
  return {...record,name,nameStyle,nameModel:PERSONNEL_NAME_MODEL,
   roleNamingMethod:'ROLE_CONDITIONED_TEST_STYLE',baseNameModel:GEO_NAME_MODEL};
 });
}
