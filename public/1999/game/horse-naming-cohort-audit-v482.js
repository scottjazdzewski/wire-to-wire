/**
 * Read-only naming COHORT audit — independent of registration and human taste.
 * Flags repeated generic vocabulary and adjacent race-call confusability.
 * These are diagnostic measures, NEVER a substitute for owner creativity review.
 */
export const NAMING_COHORT_AUDIT_SCHEMA_V482='WTW_NAMING_COHORT_VITALITY_AUDIT_V1';
const SW=new Set(['a','an','the','to','of','for','in','at','on','and','from','with','my','your','me','i','it','is','was','as']);
const stock=new Set(['golden','silver','midnight','quiet','little','old','wild','blue','red','morning','evening','moon','river','storm','shadow']);
const words=s=>String(s||'').toLocaleLowerCase('en-US').match(/[\p{L}\p{N}]+/gu)||[];
const key=s=>words(s).join('');
export function auditHorseNamingCohort({names=[],recentWindow=40}={}){
 if(!Array.isArray(names)||names.length>100000||!Number.isInteger(recentWindow)||recentWindow<8||recentWindow>200)
  throw Error('Invalid read-only naming cohort');
 const seen=new Set(),duplicateNames=[],openingHits=new Map(),contentHits=new Map();
 const rolling=[],alerts=[];
 let genericPairCount=0, multi=0;
 let single=0,two=0,longer=0;
 const distinctOpeners=new Set(),uniqueContent=new Set();
 for(let i=0;i<names.length;i++){
  const name=typeof names[i]==='string'?names[i]:names[i]?.name;
  if(typeof name!=='string'||!name.trim())throw Error('Naming cohort includes an empty name');
  const terms=words(name),nkey=key(name);
  if(seen.has(nkey))duplicateNames.push({index:i,name});else seen.add(nkey);
  if(terms.length===1)single++;else if(terms.length===2)two++;else longer++;
  const opener=terms[0]||'';
  distinctOpeners.add(opener);
  const content=[...new Set(terms.filter(w=>w.length>=4&&!SW.has(w)))];
  for(const w of content)uniqueContent.add(w);
  if(terms.length===2){multi++;if(stock.has(terms[0]))genericPairCount++}
  // Inspect BEFORE adding the current name so a word in this single name is not self-repetition.
  if((openingHits.get(opener)||0)>=3&&opener.length>=4)alerts.push({index:i,kind:'RECENT_REPEATED_OPENER',value:opener});
  for(const w of content)if((contentHits.get(w)||0)>=5)alerts.push({index:i,kind:'RECENT_CONTENT_WORD_FATIGUE',value:w});
  const add=(map,k)=>map.set(k,(map.get(k)||0)+1);
  const sub=(map,k)=>{const next=(map.get(k)||0)-1;if(next<=0)map.delete(k);else map.set(k,next)};
  add(openingHits,opener);content.forEach(w=>add(contentHits,w));
  rolling.push({opener,content});
  if(rolling.length>recentWindow){const old=rolling.shift();sub(openingHits,old.opener);old.content.forEach(w=>sub(contentHits,w));}
 }
 const total=names.length;
 if(multi>=10&&genericPairCount/multi>=.3)alerts.push({index:null,kind:'COHORT_STOCK_PAIR_SATURATION',value:genericPairCount/multi});
 return {
  schema:NAMING_COHORT_AUDIT_SCHEMA_V482,total,
  uniqueExact:seen.size,duplicateNames:duplicateNames.slice(0,100),
  shapes:{single,two,longer},distinctOpeners:distinctOpeners.size,
  distinctContentWords:uniqueContent.size,stockModifierTwoWordShare:multi?genericPairCount/multi:0,
  flags:alerts.slice(0,250),flagCount:alerts.length,
  readOnly:true,ownerAcceptanceProven:false,gameWrites:0,
  interpretation:'Flags approximate overused wording. A human must still assess life, personality, origin, and plausibility.'
 };
}