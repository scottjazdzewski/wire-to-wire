/** WTW 1999 canonical TEST aging model, shared by both world generators.
 * Horse peak calibrated around 4.5 years (Gramm & Marksteiner, 2010,
 * Journal of Equine Science, DOI 10.1294/jes.21.73).
 * Human role curves are explicit GAMEPLAY assumptions, not career-study facts.
 * No historical identities, achievements, measured scouting or health facts change.
 */
export const AGE_ABILITY_SCHEMA='WTW_1999_AGE_ABILITY_V1';
const CURVES=Object.freeze({
 horse:{start:1,peak:4.5,jitter:.7,foundation:.23,growth:.76,decline:.058,minimum:.24,end:16},
 jockey:{start:16,peak:33.5,jitter:3,foundation:.37,growth:.83,decline:.021,minimum:.27,end:63},
 trainer:{start:22,peak:52,jitter:5,foundation:.47,growth:.85,decline:.010,minimum:.38,end:86},
 owner:{start:20,peak:54,jitter:6,foundation:.53,growth:.88,decline:.008,minimum:.41,end:92},
 breeder:{start:22,peak:53,jitter:5,foundation:.47,growth:.90,decline:.010,minimum:.40,end:89},
 farm_manager:{start:20,peak:48,jitter:5,foundation:.47,growth:.85,decline:.012,minimum:.36,end:84},
 veterinarian:{start:25,peak:49,jitter:5,foundation:.55,growth:.85,decline:.012,minimum:.39,end:84},
 farrier:{start:18,peak:43,jitter:5,foundation:.45,growth:.85,decline:.019,minimum:.30,end:78},
 bloodstock_agent:{start:21,peak:53,jitter:6,foundation:.48,growth:.90,decline:.009,minimum:.39,end:89},
 racing_secretary:{start:22,peak:51,jitter:5,foundation:.54,growth:.90,decline:.010,minimum:.39,end:85}
});
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const round=n=>Math.round(n*10000)/10000;
function hash(seed,key){let h=(2166136261^(seed>>>0))>>>0;
 for(const c of String(key)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
 h^=h>>>16;h=Math.imul(h,2246822507);h^=h>>>13;return h>>>0;}
const unit=(seed,key)=>hash(seed,key)/4294967296;
export const supportedAgeRoles=Object.freeze(Object.keys(CURVES));
export function inferProfessionalRole(raw){const s=String(raw||'').toLowerCase().replace(/[_-]/g,' ');
 if(/jockey|rider/.test(s))return 'jockey';
 if(/trainer/.test(s))return 'trainer';
 if(/vet|doctor/.test(s))return 'veterinarian';
 if(/farrier/.test(s))return 'farrier';
 if(/racing secretar/.test(s))return 'racing_secretary';
 if(/farm manager|stud manager/.test(s))return 'farm_manager';
 if(/bloodstock|agent/.test(s))return 'bloodstock_agent';
 if(/breeder/.test(s))return 'breeder';
 return 'owner';
}
function factorAt(role,age,peakAge){const c=CURVES[role];
 if(age<=c.start)return c.foundation;
 if(age<peakAge){const fraction=clamp((age-c.start)/(peakAge-c.start),0,1);
  return c.foundation+(1-c.foundation)*Math.pow(fraction,c.growth);}
 const elapsed=Math.max(0,age-peakAge);
 return Math.max(c.minimum,1-c.decline*Math.pow(elapsed,1.12));
}
function stars(score){return clamp(Math.round(score/20),1,5)}
/** A future year is recalculated with the same person's or horse's peak; no reroll. */
export function evaluateAgeAbility(profile,age){
 if(!profile||profile.schema!==AGE_ABILITY_SCHEMA||!CURVES[profile.role])throw Error('Invalid WTW career profile');
 if(!Number.isFinite(age)||age<0||age>120)throw Error('Invalid entity age');
 const current=Math.round(clamp(profile.peakCeiling*factorAt(profile.role,age,profile.peakAge),1,99));
 // Potential is the BEST result still achievable FROM NOW; past prime is not potential.
 const c=CURVES[profile.role];
 const future=age<profile.peakAge&&age<=c.end?profile.peakCeiling:current;
 const potential=clamp(Math.max(current,future),1,99);
 const stage=age<c.start?'PRECAREER':age<profile.peakAge-2?'DEVELOPING':age<=profile.peakAge+2?'PRIME':'DECLINING';
 return {...profile,age,careerStage:stage,current,potential,currentStars:stars(current),
  potentialStars:stars(potential),ageFactor:round(factorAt(profile.role,age,profile.peakAge))};
}
export function createAgeAbility({seed,id,role,age,asOf='1999-01-01'}={}){
 if(!Number.isSafeInteger(seed)||seed<1||!String(id||'').trim()||!CURVES[role])throw Error('Invalid age-model identity');
 if(!Number.isFinite(age)||age<0||age>120)throw Error('Invalid age');
 const c=CURVES[role],late=role!=='horse'&&unit(seed,id+':late-bloom')<.018;
 const peakAge=round(c.peak+(unit(seed,id+':peak')-.5)*2*c.jitter+(late?3.5:0));
 const peakCeiling=clamp(Math.round(17+81*Math.pow(unit(seed,id+':ceiling'),.80)),18,99);
 return evaluateAgeAbility({schema:AGE_ABILITY_SCHEMA,role,peakAge,peakCeiling,asOf,
  developmentAnomaly:late?'LATE_BLOOMER':null,
  provenance:'DETERMINISTIC_1999_TEST_ABILITY_NOT_HISTORICAL_OR_SCOUT_EVIDENCE'},age);
}
