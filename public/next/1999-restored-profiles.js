/* WIRE TO WIRE 1999 Tier One profile source adapter.
 * Creates view-only source nodes for the ALREADY APPROVED profile renderer.
 * No secondary simulation, new entities, history writes, or altered layout. */
(()=>{
'use strict';
const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const field=(name,value)=>'<div class="profileField"><span>'+safe(name)+'</span><strong>'+safe(value??'—')+'</strong></div>';
const link=(name,value)=>value?'<div class="profileLine"><b>'+safe(name)+'</b><span>'+safe(value)+'</span></div>':'';
let registry=null;
fetch('/data/horse-foaling-registry-projection-v33.json',{credentials:'same-origin',cache:'force-cache'})
 .then(r=>r.ok?r.json():Promise.reject(Error('Registry foaling projection unavailable')))
 .then(data=>{if(data?.schema==='WTW_1999_HORSE_FOALING_REGISTRY_PROJECTION_V1'&&data.records){
  registry=data.records;window.__WTW_NEXT__?.paint?.();
 }})
 .catch(()=>{/* Missing source remains unknown: do not substitute racing base. */});
const panel=(name,items=[])=>'<section class="profilePanel"><h3>'+safe(name)+'</h3>'+items.map(x=>'<div class="achievementItem">'+safe(x)+'</div>').join('')+'</section>';
function source(kind,record,ui){
 const base=record||{},d=kind==='track'?{...base,...(ui?.trackProgramById?.(base.id)||{})}:base,name=d.name||d._name||'Unresolved record';
 const node=document.createElement('section');node.className='profilePage';
 if(kind==='horse'){
  const year=Number(d.foalYear||d._foalYear||0);
  const sourceId=d.id||d._canonId||d._id||'';
  const sourceModel=sourceId?ui?.sourceHorseModel?.(sourceId):null;
  const candidateAbility=d._testAbility||sourceModel?.ability||ui?.sourceHorseAbility?.(sourceId)||null;
  const ability=candidateAbility?.schema==='WTW_1999_AGE_ABILITY_V1'?candidateAbility:null;
  const foalRegistry=registry?.[sourceId]||null;
  const geo=d.foalingGeography||d.foalingLocation||d.foalingPlace||d.foaling||d.birthplace||
    (foalRegistry?{region:foalRegistry.region,country:foalRegistry.foalingCountry,countryCode:foalRegistry.foalingCountryCode}:{});
  const place=geo&&typeof geo==='object'?geo:{};
  const owner=d.owner||d.ownerName||ui?.ownerFor?.(name)||'';
  node.dataset.foalingCity=d.foalingCity||place.locality||place.city||foalRegistry?.locality?.trim()||'';
  node.dataset.foalingState=d.foalingState||place.region||place.state||place.province||foalRegistry?.region||'';
  node.dataset.foalingCountry=d.foalingCountry||place.country||foalRegistry?.foalingCountry||'';
  node.dataset.foalingCountryCode=d.foalingCountryCode||place.countryCode||place.country_code||foalRegistry?.foalingCountryCode||'';
  node.dataset.foalingEvidence=place.authority==='SIMULATED_1999_TEST_BIRTHPLACE'?
   'SIMULATED 1999 TEST WORLD birthplace; not a verified historic foaling site.':
   foalRegistry?'Source country is registered; region is the breeding jurisdiction, not a verified foaling municipality.':'';
  node.dataset.ownershipGroup=owner;node.dataset.ownerId=d.ownerId||'';
  node.dataset.breederId=d.breederId||'';
  node.dataset.foalingFarmId=d.breedingFarmId||'';
  node.dataset.homebred=d._testGenerated&&d.homebred===true?'true':'false';
  node.dataset.testGenerated=d._testGenerated?'true':'false';
  const modelHorseTraits=d._testAttrs||sourceModel?.attributes||{};
  node.dataset.testAttributeModel=Object.keys(modelHorseTraits).length?'true':'false';
  node.dataset.testAttributes=JSON.stringify(modelHorseTraits);
  node.dataset.testCareer=JSON.stringify(d._testCareer||{});
  node.dataset.testRelationships=JSON.stringify(d._testRelationships||{});
  const career=d._testCareer||{};
  const testCareer=career.provenance==='GENERATED_1998_AND_PRIOR_NONCANON_TEST_RACES_ONLY';
  node.innerHTML='<div class="profileSubline">'+safe(d._testGenerated?'1999 GENERATED TEST HORSE':sourceId?'1999 SOURCE-LINKED HORSE':'UNLINKED HORSE RECORD · ID NOT ESTABLISHED')+'</div>'+
    field('Age',d.age||(year>0?1999-year:'—'))+field('Sex',d.sex||'—')+
    (ability?field('CURRENT ABILITY · TEST',ability.currentStars+'/5')+
      field('FUTURE POTENTIAL · TEST',ability.potentialStars+'/5')+
      field('CAREER STAGE · TEST',ability.careerStage):'')+
    field('Date of birth',d.dateOfBirth||d.birthDate||'Not recorded')+
    field('Foaling year',year||'—')+field('Current stable',d.track||d.location||'—')+
    field('Racing status',String(d.racingStatus1999||d.racingStatus||d.status||'Not recorded').replaceAll('_',' '))+
    link('Owner',owner)+link('Trainer',d.trainer||'')+
    link('Breeder',d.breeder||d.breederName||'')+
    (d.breedingFarm?link('Foaling farm',d.breedingFarm):'')+
    (d._testGenerated&&d.homebred?'<div class="profileLine"><b>Breeding relationship</b><span>OWNER-BRED · TEST WORLD</span></div>':'')+
    link('Current stable',d.track||d.location||'')+
    '<div class="pedigreeNode"><span>Sire</span><strong>'+safe(d.sire||d.sireId||'—')+'</strong></div>'+
    '<div class="pedigreeNode"><span>Dam</span><strong>'+safe(d.dam||d.damId||'—')+'</strong></div>'+
    (testCareer?[
      ['PRE-1999 TEST STARTS',career.starts],
      ['PRE-1999 TEST WINS',career.wins],
      ['PRE-1999 TEST SECONDS',career.seconds],
      ['PRE-1999 TEST THIRDS',career.thirds],
      ['PRE-1999 TEST EARNINGS',career.earnings!=null?'$'+Number(career.earnings).toLocaleString('en-US'):'—'],
      ['LAST TEST START',career.lastRaceDate||'Unraced']
     ].map(([k,v])=>'<div class="recordStat"><span>'+safe(k)+'</span><b>'+safe(v??'—')+'</b></div>').join(''):'')+
    (d._testGenerated&&d._testRelationships?[
      ['OWNER–TRAINER TRUST',d._testRelationships.ownerTrainer?.trust],
      ['TRAINER–JOCKEY CHEMISTRY',d._testRelationships.trainerJockey?.chemistry],
      ['HORSE–TRAINER FAMILIARITY',d._testRelationships.horseTrainer?.familiarity]
     ].filter(([,v])=>v!=null).map(([k,v])=>'<div class="profileLine"><b>'+safe(k)+' · TEST</b><span>'+safe(v)+'</span></div>').join(''):'')+
    panel('Achievements')+panel('Racing notes',[d._testGenerated?
      'All generated ability, financial and pre-1999 career values are explicitly test data, not certified historical results.':
      'Historical identity preserved. No 1999 race result or future transaction is committed.']);
 }else if(kind==='person'){
  // All 1999 World and Personnel people use the EXISTING FM attribute dossier.
  // This node is a source adapter only; it does not invent skills or people.
  const personId=d.id||d._canonId||d._id||'';
  const role=String(d.role||d.job||d.profession||d.type||'Not recorded').replaceAll('_',' ');
  const place=value=>{
   if(typeof value==='string')return value;
   if(!value||typeof value!=='object')return '';
   return [value.city||value.locality||'',value.state||value.region||value.province||'',value.country||'']
    .filter(Boolean).join(', ');
  };
  const openingBase=place(d.base||d.openingBase||d.location);
  const birthplace=place(d.birthplace||d.birthPlace);
  const age=d.ageAtDate??d.ageAtOpening??d.age??'';
  const generated=d._testGenerated===true;
  const sourceModel=personId?ui?.sourcePersonModel?.(personId):null;
  const modelPersonTraits=d._testAttrs||sourceModel?.attributes||{};
  node.dataset.personId=personId;
  node.dataset.testGenerated=generated?'true':'false';
  node.dataset.testAttributeModel=Object.keys(modelPersonTraits).length?'true':'false';
  // These values already exist in the site's TEST population. They never
  // become canonical scouting observations or engine-facing decisions.
  node.dataset.testAttributes=JSON.stringify(modelPersonTraits);
  node.dataset.personRole=role.toLowerCase().replaceAll(' ','_');
  node.innerHTML='<div class="profileSubline">Job: '+safe(role)+'</div>'+
   field('Role',role)+field('Age',age||'Not recorded')+
   field('Birthplace',birthplace||'Not recorded')+
   field('Location',openingBase||'Not recorded')+
   field('1999 base',openingBase||'Not recorded')+
   field('Person ID',personId||'Not linked')+
   (d.homeTrack?link('Home track',d.homeTrack):'')+
   (d.ownershipOperation?link('Ownership operation',d.ownershipOperation):'')+
   (d.assignment?link('Appointment',d.assignment):'')+
   (d.relationship?link('Stable relationship',d.relationship):'')+
   panel('Career Wins',d.wins?[String(d.wins)+' recorded wins']:[])+
   panel('Stable Horses')+
   panel('Professional context',[generated?
    '1999 SIMULATED TEST PERSON · modeled attributes must not be represented as certified scouting or historical facts.':
    personId?'Canonical person identity and recorded geography preserved. Displayed modeled skills are clearly identified as TEST estimates, not historical observations; unassessed skills remain unknown.':
    'Unlinked person name; no canonical identity or skill observation has been invented.']);
 }else if(kind==='track'){
  const stakes=ui?.stakesForTrack?.(name)||[];
  const location=d.location||[d.locality,d.region].filter(Boolean).join(', ')||'—';
  node.innerHTML='<div class="profileSubline">1999 Racecourse · '+safe(d.circuit||d.region||'')+'</div>'+
    field('Location',location)+field('Surfaces',d.surfaces||d.surface||'Not certified')+
    field('Operating state',d.trackOperating==='OPEN_1999'?'OPEN · 1999 WTW WORLD':d.operating||'1999 schedule dependent')+
    '<div class="meetBlock"><span>1999 MEET WINDOW</span><strong>'+safe(d.meetWindow||'Schedule dependent')+'</strong></div>'+
    '<div class="meetBlock"><span>RACE DAYS</span><strong>'+safe(d.raceDays||'Schedule dependent')+'</strong></div>'+
    '<div class="trackNote"><b>Preferred days</b><span>'+safe(d.preferredDays||'Not certified')+'</span></div>'+
     '<div class="trackNote"><b>Meet evidence</b><span>'+safe(d.basis==='VERIFIED_1999_CALENDAR'?'1999 commission racing dates':d.basis==='APPROVED_WTW_1999_GAME_CALENDAR'?'Locked 1999 game calendar':d.basis==='WTW_ALTERNATE_HISTORY_CONTINUED_OPERATION'?'WTW alternate-history racecourse · active modeled meet':d.basis==='HISTORICAL_ONLY_NO_1999_MEET'?'Historical-only venue':'Wire to Wire game model · not historically certified')+'</span></div>'+
    stakes.map(x=>{
      const grade=String(x.grade||x.grade1999||x.status||'').match(/(?:G|GRADE\s*)([123])/i);
      const gradeLabel=grade?'G'+grade[1]:(x.status||'Major Stakes');
      const purse=Number(x.purse1999),purseLabel=Number.isFinite(purse)&&purse>0?'$'+purse.toLocaleString('en-US'):'—';
      return '<div class="stakesRow" data-stake-id="'+safe(x.id||'')+'"><span>'+safe(x.name||'')+'</span>'+
        '<span>'+safe(x.localDate||x.date||'—')+'</span><span>'+safe(gradeLabel)+'</span><span>'+safe(purseLabel)+'</span></div>';
    }).join('')+
    panel('Track context',[d.realAnchor?'Source track geography preserved.':'WTW expanded-universe track.',
      d.basis==='VERIFIED_1999_CALENDAR'?'1999 meet windows verified against source commission calendar.':d.basis==='WTW_ALTERNATE_HISTORY_CONTINUED_OPERATION'?'This track survives and races in the WTW alternate 1999 world. Meet dates and new stakes are modeled, not historical facts.':d.basis==='HISTORICAL_ONLY_NO_1999_MEET'?'Historical course. No 1999 meet; no active races.':d.basis==='APPROVED_WTW_1999_GAME_CALENDAR'?'Meets are locked in game canon, not independently certified as an actual 1999 calendar.':'1999 meets are game models, not historically source-certified.']);
 }
 return {node,route:{kicker:kind==='horse'?'Horse Profile':kind==='person'?'People Profile':'Track Profile',title:name}};
}
window.WTW1999Profiles=Object.freeze({source});
})();
