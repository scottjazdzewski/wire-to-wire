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
 const d=record||{},name=d.name||d._name||'Unresolved record';
 const node=document.createElement('section');node.className='profilePage';
 if(kind==='horse'){
  const year=Number(d.foalYear||d._foalYear||0);
  const sourceId=d.id||d._canonId||d._id||'';
  const foalRegistry=registry?.[sourceId]||null;
  const geo=d.foalingGeography||d.foalingLocation||d.foalingPlace||d.foaling||d.birthplace||
    (foalRegistry?{region:foalRegistry.region,country:foalRegistry.foalingCountry,countryCode:foalRegistry.foalingCountryCode}:{});
  const place=geo&&typeof geo==='object'?geo:{};
  const owner=d.owner||d.ownerName||ui?.ownerFor?.(name)||'';
  node.dataset.foalingCity=d.foalingCity||place.locality||place.city||'';
  node.dataset.foalingState=d.foalingState||place.region||place.state||place.province||'';
  node.dataset.foalingCountry=d.foalingCountry||place.country||'';
  node.dataset.foalingCountryCode=d.foalingCountryCode||place.countryCode||place.country_code||'';
  node.dataset.foalingEvidence=foalRegistry?
   'Foaling country is source registered; regional label is breeding jurisdiction, NOT a separately verified foaling municipality.':'';
  node.dataset.ownershipGroup=owner;node.dataset.ownerId=d.ownerId||'';
  node.dataset.testGenerated=d._testGenerated?'true':'false';
  node.dataset.testAttributes=JSON.stringify(d._testAttrs||{});
  const career=d._testCareer||{};
  const testCareer=career.provenance==='GENERATED_1998_AND_PRIOR_NONCANON_TEST_RACES_ONLY';
  node.innerHTML='<div class="profileSubline">'+safe(d._testGenerated?'1999 GENERATED TEST HORSE':'1999 SOURCE-LINKED HORSE')+'</div>'+
    field('Age',d.age||(year>0?1999-year:'—'))+field('Sex',d.sex||'—')+
    field('Date of birth',d.dateOfBirth||d.birthDate||'Not recorded')+
    field('Foaling year',year||'—')+field('Current stable',d.track||d.location||'—')+
    field('Racing status',d.racingStatus||d.status||'1999 opening')+
    link('Owner',owner)+link('Trainer',d.trainer||'')+link('Breeder',d.breeder||'')+
    link('Current stable',d.track||d.location||'')+
    '<div class="pedigreeNode"><span>Sire</span><strong>'+safe(d.sire||d.sireId||'—')+'</strong></div>'+
    '<div class="pedigreeNode"><span>Dam</span><strong>'+safe(d.dam||d.damId||'—')+'</strong></div>'+
    (testCareer?'<div class="recordStat"><span>PRE-1999 TEST STARTS</span><b>'+safe(career.starts??'—')+'</b></div>'+
      '<div class="recordStat"><span>PRE-1999 TEST WINS</span><b>'+safe(career.wins??'—')+'</b></div>':'')+
    panel('Achievements')+panel('Racing notes',[d._testGenerated?
      'All generated ability, financial and pre-1999 career values are explicitly test data, not certified historical results.':
      'Historical identity preserved. No 1999 race result or future transaction is committed.']);
 }else if(kind==='track'){
  const stakes=ui?.stakesForTrack?.(name)||[];
  const location=d.location||[d.locality,d.region].filter(Boolean).join(', ')||'—';
  node.innerHTML='<div class="profileSubline">1999 Racecourse · '+safe(d.circuit||d.region||'')+'</div>'+
    field('Location',location)+field('Surfaces',d.surfaces||d.surface||'Not certified')+
    field('Operating state',d.operating||'1999 schedule dependent')+
    '<div class="meetBlock"><span>1999 MEET WINDOW</span><strong>'+safe(d.meetWindow||'Schedule dependent')+'</strong></div>'+
    '<div class="meetBlock"><span>RACE DAYS</span><strong>'+safe(d.raceDays||'Schedule dependent')+'</strong></div>'+
    '<div class="trackNote"><b>Preferred days</b><span>'+safe(d.preferredDays||'Not certified')+'</span></div>'+
    stakes.map(x=>{
      const grade=String(x.grade||x.grade1999||x.status||'').match(/(?:G|GRADE\s*)([123])/i);
      const gradeLabel=grade?'G'+grade[1]:(x.status||'Major Stakes');
      const purse=Number(x.purse1999),purseLabel=Number.isFinite(purse)&&purse>0?'$'+purse.toLocaleString('en-US'):'—';
      return '<div class="stakesRow" data-stake-id="'+safe(x.id||'')+'"><span>'+safe(x.name||'')+'</span>'+
        '<span>'+safe(x.localDate||x.date||'—')+'</span><span>'+safe(gradeLabel)+'</span><span>'+safe(purseLabel)+'</span></div>';
    }).join('')+
    panel('Track context',[d.realAnchor?'Source track geography preserved.':'WTW expanded-universe track.',
      '1999 operating windows are test assumptions until source-certified.']);
 }
 return {node,route:{kicker:kind==='horse'?'Horse Profile':'Track Profile',title:name}};
}
window.WTW1999Profiles=Object.freeze({source});
})();
