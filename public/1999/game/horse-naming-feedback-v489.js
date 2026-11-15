/**
 * WTW V489 — one career-local, replayable horse-naming preference ledger.
 * This file is PURE: no browser storage, registration, AI or external calls.
 * KEEP is available for later use, REJECT is permanently excluded from this
 * career, CHOOSE is tied to one exact horse ID but NOT a registration.
 */
export const HORSE_NAMING_FEEDBACK_SCHEMA='WTW_HORSE_NAMING_FEEDBACK_V1';
const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
 .toLocaleLowerCase('en-US').replace(/[^a-z0-9]/g,'');
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const validName=s=>typeof s==='string'&&s.trim()===s&&
 s.length>0&&s.length<=18&&/^[\p{L}\p{N} '&\u2019-]+$/u.test(s);
const statuses=Object.freeze(['KEEP','REJECT','CHOOSE']);
export const NAMING_FEEDBACK_DECISIONS=statuses;
export const nameFeedbackKey=norm;
export function createNamingFeedback(){
 return {schema:HORSE_NAMING_FEEDBACK_SCHEMA,revision:0,decisions:{},events:[]};
}
export function validateNamingFeedback(value){
 if(!plain(value)||value.schema!==HORSE_NAMING_FEEDBACK_SCHEMA||
  !Number.isSafeInteger(value.revision)||value.revision<0||
  !plain(value.decisions)||!Array.isArray(value.events)||
  value.events.length>250000||Object.keys(value.decisions).length>100000||
  value.revision!==value.events.length)
  throw Error('Invalid saved naming preference history');
 for(const [key,row] of Object.entries(value.decisions)){
  if(!plain(row)||!validName(row.name)||norm(row.name)!==key||
   !statuses.includes(row.decision)||typeof row.motifId!=='string'||
   row.motifId.length>60||typeof row.horseId!=='string'||
   row.horseId.length>128||
   (row.decision==='CHOOSE'&&!row.horseId))
   throw Error('Invalid saved naming decision');
 }
 const replay=createNamingFeedback();
 for(const e of value.events){
  if(!plain(e)||!statuses.includes(e.decision)||!validName(e.name)||
   typeof e.motifId!=='string'||e.motifId.length>60||
   typeof e.horseId!=='string'||e.horseId.length>128||
   typeof e.prompt!=='string'||e.prompt.length>300)
   throw Error('Invalid saved naming feedback event');
  const key=norm(e.name),previous=replay.decisions[key];
  if(previous?.decision==='REJECT'||previous?.decision==='CHOOSE'||
   e.decision==='CHOOSE'&&!e.horseId||
   e.decision==='CHOOSE'&&Object.values(replay.decisions).some(row=>
    row.decision==='CHOOSE'&&row.horseId===e.horseId&&norm(row.name)!==key))
   throw Error('Contradictory saved naming decisions');
  if(previous?.decision===e.decision&&previous.horseId===e.horseId)
   throw Error('Duplicate naming feedback event');
  replay.decisions[key]={name:e.name,decision:e.decision,motifId:e.motifId,
   horseId:e.decision==='CHOOSE'?e.horseId:''};
  replay.events.push(e);
 }
 if(JSON.stringify(replay.decisions)!==JSON.stringify(value.decisions))
  throw Error('Naming preferences differ from event history');
 return value;
}
export function recordNamingFeedback(profile,{name,decision,motifId='',horseId='',prompt=''}={}){
 const prior=validateNamingFeedback(profile);
 if(!validName(name)||!statuses.includes(decision)||
  typeof motifId!=='string'||motifId.length>60||
  typeof horseId!=='string'||horseId.length>128||
  typeof prompt!=='string'||prompt.length>300)
  throw Error('Invalid horse name feedback');
 if(decision==='CHOOSE'&&!horseId)throw Error('Choose requires an actual horse ID');
 const key=norm(name),previous=prior.decisions[key];
 if(previous?.decision==='REJECT')throw Error('A permanently rejected name cannot return');
 if(previous?.decision==='CHOOSE')throw Error('A chosen horse name cannot be reassigned');
 if(decision==='CHOOSE'&&Object.values(prior.decisions).some(row=>
  row.decision==='CHOOSE'&&row.horseId===horseId))
  throw Error('That horse already has a selected name');
 if(previous?.decision===decision&&previous.horseId===horseId)return prior;
 const next=JSON.parse(JSON.stringify(prior));
 const event={name,decision,motifId,horseId:decision==='CHOOSE'?horseId:'',prompt};
 next.events.push(event);next.revision=next.events.length;
 next.decisions[key]={name,decision,motifId,horseId:event.horseId};
 return validateNamingFeedback(next);
}
export function excludedNamingFeedbackNames(profile){
 const p=validateNamingFeedback(profile);
 return Object.values(p.decisions).filter(x=>x.decision!=='KEEP').map(x=>x.name);
}
export function savedNamingBank(profile){
 const p=validateNamingFeedback(profile);
 return Object.values(p.decisions).filter(x=>x.decision==='KEEP').map(x=>x.name);
}
const shape=name=>{const count=name.split(/\s+/).length;return count===1?'single':count===2?'two':'phrase'};
/** Learning changes actual ordering, not just reports: previous choices train
 * motif/shape preferences, and free-form direction biases locally recognizable
 * styles. Never copies previously reviewed names into new proposals.
 */
export function namingTasteScore(profile,{name,originMotif=''},{direction=''}={}){
 validateNamingFeedback(profile);
 const preference={motif:{},shape:{}};
 for(const event of profile.events){
  const weight=event.decision==='CHOOSE'?4:event.decision==='KEEP'?2:-4;
  if(event.motifId)preference.motif[event.motifId]=(preference.motif[event.motifId]||0)+weight;
  const part=shape(event.name);
  preference.shape[part]=(preference.shape[part]||0)+weight;
 }
 const candidateShape=shape(name);
 let score=(preference.motif[originMotif]||0)*2+(preference.shape[candidateShape]||0);
 // Learn from the owner's explicit previous creative prompts as well as
 // their outcomes. Rejects temper that direction; keeps/choices reinforce it.
 // This is deterministic local preference memory, NOT neural training.
 const promptMatch=hint=>{
  const p=String(hint||'').toLowerCase();let v=0;
  if(/\b(one.word|single.word|short names?|brief names?)\b/.test(p)&&candidateShape==='single')v+=12;
  if(/\b(two.word|two words?)\b/.test(p)&&candidateShape==='two')v+=12;
  if(/\b(phrase|sentence|conversation|spoken)\b/.test(p)&&candidateShape==='phrase')v+=12;
  if(/\b(subtle|understated|simple)\b/.test(p)&&name.length<=11)v+=4;
  if(/\b(longer|lyrical|poetic)\b/.test(p)&&name.length>=13)v+=4;
  return v;
 };
 let historical=0;
 for(const e of profile.events){
  const weight=e.decision==='CHOOSE'?0.75:e.decision==='KEEP'?0.5:-0.5;
  historical+=promptMatch(e.prompt)*weight;
 }
 score+=Math.max(-24,Math.min(24,historical));
 score+=promptMatch(direction)*1.5; // the current prompt has priority
 return score;
}
export function rankNamingCandidates(candidates,profile,{direction=''}={}){
 validateNamingFeedback(profile);
 return [...candidates].map((candidate,index)=>({candidate,index,
  score:namingTasteScore(profile,candidate,{direction})}))
  .sort((a,b)=>b.score-a.score||a.index-b.index)
  .map(({candidate})=>candidate);
}
