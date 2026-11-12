/**
 * WIRE TO WIRE — January 1999 age and career potential, shared by server and browser.
 *
 * A separate individual peak and trajectory is generated once for each entity.
 * Horse distribution has a population average around 4-5, but permits exceptional
 * two-year-old peaks and late-maturing older runners. Precocity can be inherited
 * partly from the same sire/dam IDs; this is a modeled trait, NOT verified genetics.
 * Based on typical Thoroughbred ages in Gramm & Marksteiner (2010), and the
 * existence—not the precise effect size—of genetic precocity in Hill et al. (2017).
 * Human role bands are GAMEPLAY assumptions; they are not empirical census data.
 */
export const AGE_ABILITY_SCHEMA='WTW_1999_AGE_ABILITY_V1';
export const AGE_CURVE_REVISION='INDIVIDUAL_MATURITY_PEDIGREE_V2';
const ROLES=Object.freeze({
 horse:{start:1,foundation:.22,growth:.78,decline:.062,minimum:.19,end:16},
 jockey:{start:16,foundation:.31,growth:.88,decline:.019,minimum:.22,end:66},
 trainer:{start:22,foundation:.46,growth:.85,decline:.010,minimum:.34,end:88},
 owner:{start:20,foundation:.50,growth:.88,decline:.009,minimum:.38,end:94},
 breeder:{start:23,foundation:.46,growth:.89,decline:.010,minimum:.36,end:90},
 farm_manager:{start:20,foundation:.45,growth:.88,decline:.013,minimum:.32,end:85},
 veterinarian:{start:25,foundation:.51,growth:.91,decline:.013,minimum:.34,end:85},
 farrier:{start:18,foundation:.39,growth:.88,decline:.018,minimum:.25,end:79},
 bloodstock_agent:{start:21,foundation:.46,growth:.87,decline:.010,minimum:.35,end:90},
 racing_secretary:{start:22,foundation:.50,growth:.90,decline:.011,minimum:.34,end:86}
});
/**
 * Horse target weights are gameplay population approximations, not a fitted
 * estimate from individual-level race data. Most peak at 3-5, a few at 2 or 7.
 */
const HORSE_PEAKS=Object.freeze([
 {label:'PRECOCIOUS',from:2.1,to:2.95,weight:.045},
 {label:'EARLY',from:3.0,to:3.9,weight:.22},
 {label:'CLASSIC',from:4.0,to:4.85,weight:.34},
 {label:'MATURE',from:4.9,to:5.75,weight:.245},
 {label:'LATE',from:5.8,to:6.65,weight:.11},
 {label:'VERY_LATE',from:6.7,to:7.35,weight:.04}
]);
/** Jockey careers legitimately differ. A late-blooming rider still peaks by ~43. */
const JOCKEY_PEAKS=Object.freeze([
 {label:'EARLY_PROFESSIONAL',from:22.5,to:25.5,weight:.10},
 {label:'EARLY_PRIME',from:25.5,to:29.5,weight:.22},
 {label:'ESTABLISHED_PRIME',from:29.5,to:34.5,weight:.38},
 {label:'MATURE_PRIME',from:34.5,to:39.5,weight:.27},
 {label:'LATE_PROFESSIONAL',from:39.5,to:42.5,weight:.03}
]);
const HUMAN_BANDS=Object.freeze({
 trainer:[{from:34,to:45,weight:.13},{from:45,to:57,weight:.54},{from:57,to:72,weight:.33}],
 owner:[{from:34,to:46,weight:.18},{from:46,to:60,weight:.54},{from:60,to:72,weight:.28}],
 breeder:[{from:33,to:45,weight:.20},{from:45,to:59,weight:.55},{from:59,to:71,weight:.25}],
 farm_manager:[{from:30,to:42,weight:.25},{from:42,to:53,weight:.60},{from:53,to:65,weight:.15}],
 veterinarian:[{from:33,to:44,weight:.22},{from:44,to:55,weight:.61},{from:55,to:65,weight:.17}],
 farrier:[{from:27,to:39,weight:.27},{from:39,to:48,weight:.54},{from:48,to:58,weight:.19}],
 bloodstock_agent:[{from:34,to:46,weight:.20},{from:46,to:59,weight:.56},{from:59,to:70,weight:.24}],
 racing_secretary:[{from:33,to:44,weight:.18},{from:44,to:57,weight:.58},{from:57,to:68,weight:.24}]
});
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const round=n=>Math.round(n*10000)/10000;
function hash(seed,key){let h=(2166136261^(seed>>>0))>>>0;
 for(const c of String(key)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
 h^=h>>>16;h=Math.imul(h,2246822507);h^=h>>>13;return h>>>0;}
const unit=(seed,key)=>hash(seed,key)/4294967296;
function chooseBand(bands,roll){let p=clamp(roll,0,.999999);
 for(const band of bands){if(p<band.weight)return {...band,position:p/band.weight};p-=band.weight}
 const b=bands[bands.length-1];return {...b,position:1};
}
// Gaussian-copula construction preserves the intended marginal peak frequencies
// while allowing shared bloodline effects. Clipping a shifted uniform roll would
// overproduce 2-year-old stars and late bloomers; never use that distribution.
function normal(seed,key){
 const u=Math.max(1e-12,unit(seed,key+':gaussian:u')),v=unit(seed,key+':gaussian:v');
 return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
}
function cdf(z){
 // Abramowitz-Stegun erf approximation, max error ~1.5e-7.
 const x=Math.abs(z)/Math.SQRT2,t=1/(1+.3275911*x);
 const erf=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-x*x);
 return clamp(.5*(1+(z<0?-erf:erf)),0,.999999);
}
function horsePedigree(seed,id,pedigree){
 const sireId=typeof pedigree?.sireId==='string'&&pedigree.sireId?pedigree.sireId:null;
 const damId=typeof pedigree?.damId==='string'&&pedigree.damId?pedigree.damId:null;
 const sire=sireId?normal(seed,sireId+':inherited_precocity'):null;
 const dam=damId?normal(seed,damId+':inherited_precocity'):null;
 const familyZ=sire!==null&&dam!==null?(sire+dam)*Math.SQRT1_2:
  sire!==null?sire:dam!==null?dam:normal(seed,id+':inherited_precocity');
 const ownZ=normal(seed,id+':inherited_precocity');
 // The same inherited genotype influences the parent's own maturation and
 // its offspring's maturity. Family inheritance is substantial but not absolute.
 const expressedZ=(sire!==null||dam!==null)?
  .72*familyZ+Math.sqrt(1-.72*.72)*ownZ:ownZ;
 const sprintZ=sireId&&damId?
  (normal(seed,sireId+':distance_preference')+normal(seed,damId+':distance_preference'))*Math.SQRT1_2:
  normal(seed,id+':distance_preference');
 const environmentZ=normal(seed,id+':individual_maturity');
 const combined=.54*expressedZ+.18*sprintZ+Math.sqrt(1-.54*.54-.18*.18)*environmentZ;
 const distribution=cdf(-combined); // Higher genetic precocity -> younger peak.
 return {sireId,damId,ancestry:round(cdf(familyZ)),ownGenotype:round(cdf(ownZ)),
  expressedPrecocity:round(cdf(expressedZ)),individual:round(cdf(environmentZ)),
  distanceInfluence:round(cdf(sprintZ)),distribution};
}
export const supportedAgeRoles=Object.freeze(Object.keys(ROLES));
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
function factorAt(profile,age){const c=ROLES[profile.role],peak=profile.peakAge;
 const foundation=profile.foundation??c.foundation;
 const growth=profile.growthExponent??c.growth;
 const decline=profile.declineRate??c.decline;
 const minimum=profile.minimumFactor??c.minimum;
 if(age<=c.start)return foundation;
 if(age<peak){const progress=clamp((age-c.start)/(peak-c.start),0,1);
  return foundation+(1-foundation)*Math.pow(progress,growth);}
 return Math.max(minimum,1-decline*Math.pow(Math.max(0,age-peak),profile.declineExponent??1.12));
}
const stars=score=>clamp(Math.round(score/20),1,5);
/** Reuse a fixed individual peak/ceiling as time advances. Never reroll identity. */
export function evaluateAgeAbility(profile,age){
 if(!profile||profile.schema!==AGE_ABILITY_SCHEMA||!ROLES[profile.role])throw Error('Invalid WTW career profile');
 if(!Number.isFinite(age)||age<0||age>120)throw Error('Invalid entity age');
 const factor=factorAt(profile,age);
 const current=Math.round(clamp(profile.peakCeiling*factor,1,99));
 // Future potential excludes vanished youthful talent and is never below current.
 const potential=age<profile.peakAge&&age<=ROLES[profile.role].end?Math.max(current,profile.peakCeiling):current;
 const careerStage=age<ROLES[profile.role].start?'PRECAREER':
  age<profile.peakAge-1.75?'DEVELOPING':age<=profile.peakAge+1.75?'PRIME':'DECLINING';
 return {...profile,age,current,potential,currentStars:stars(current),potentialStars:stars(potential),
  careerStage,ageFactor:round(factor)};
}
/**
 * For horses, pass pedigree: {sireId, damId}. The same parents exert a stable
 * partial effect on foals, but no unverifiable real-world maturity is asserted.
 */
export function createAgeAbility({seed,id,role,age,pedigree=null,asOf='1999-01-01'}={}){
 if(!Number.isSafeInteger(seed)||seed<1||!String(id||'').trim()||!ROLES[role])throw Error('Invalid age-model identity');
 if(!Number.isFinite(age)||age<0||age>120)throw Error('Invalid age');
 const curve=ROLES[role];let band,pedigreeModel=null,peakAge;
 if(role==='horse'){
  pedigreeModel=horsePedigree(seed,id,pedigree);
  band=chooseBand(HORSE_PEAKS,pedigreeModel.distribution);
 }else{
  band=chooseBand(role==='jockey'?JOCKEY_PEAKS:HUMAN_BANDS[role],unit(seed,id+':career_peak_band'));
 }
 peakAge=round(band.from+(band.to-band.from)*clamp(band.position,0,1));
 // Both trajectory and decline vary within every role, but stay attached to ID.
 const foundation=round(clamp(curve.foundation+(.5-unit(seed,id+':foundation'))*.12,.08,.75));
 const growthExponent=round(curve.growth*(.70+unit(seed,id+':development_rate')*.62));
 const declineRate=round(curve.decline*(.65+unit(seed,id+':aging_resilience')*.70));
 const declineExponent=round(1.03+unit(seed,id+':aging_shape')*.28);
 const minimumFactor=round(curve.minimum*(.85+unit(seed,id+':late_floor')*.3));
 const ceilingRoll=unit(seed,id+':ceiling');
 const familyTalent=pedigreeModel?.sireId||pedigreeModel?.damId?
  ((pedigreeModel.sireId?unit(seed,pedigreeModel.sireId+':inherited_talent'):.5)+
   (pedigreeModel.damId?unit(seed,pedigreeModel.damId+':inherited_talent'):.5))/2:.5;
 const talent=role==='horse'&&pedigreeModel?.sireId&&pedigreeModel?.damId?
  .84*ceilingRoll+.16*familyTalent:ceilingRoll;
 const peakCeiling=clamp(Math.round(17+81*Math.pow(talent,.8)),18,99);
 return evaluateAgeAbility({schema:AGE_ABILITY_SCHEMA,modelRevision:AGE_CURVE_REVISION,
  role,asOf,peakAge,peakCeiling,foundation,growthExponent,declineRate,declineExponent,minimumFactor,
  maturityClass:band.label||'ROLE_DEVELOPMENT',developmentAnomaly:
  role==='horse'&&['PRECOCIOUS','VERY_LATE'].includes(band.label)?band.label:
  role==='jockey'&&['EARLY_PROFESSIONAL','LATE_PROFESSIONAL'].includes(band.label)?band.label:null,
  pedigreeMaturity:pedigreeModel?{
   sireId:pedigreeModel.sireId,damId:pedigreeModel.damId,
   modeledAncestryPrecocity:pedigreeModel.ancestry,
   modeledInheritedGenotype:pedigreeModel.ownGenotype,
   modeledExpressedPrecocity:pedigreeModel.expressedPrecocity,
   modeledIndividualPrecocity:pedigreeModel.individual,
   basis:'SIMULATED_ID_BASED_BREEDING_PROPENSITY_NOT_VERIFIED_GENOTYPE'
  }:null,
  provenance:'DETERMINISTIC_1999_TEST_ABILITY_NOT_HISTORICAL_OR_SCOUT_EVIDENCE'},age);
}
