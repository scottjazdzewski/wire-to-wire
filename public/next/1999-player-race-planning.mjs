/**
 * Existing Racing > Race Planning workspace. This module is presentation
 * ONLY: the authoritative 1999 game service quotes and commits everything.
 * No second horse/race/finance state, no separate navigation or layout.
 */
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const currency=minor=>Number.isSafeInteger(minor)?
 new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(minor/100):'—';
const local={horseId:'',raceId:'',jockeyId:'',siteId:'',bonusMinor:0,busy:false,notice:'',error:''};
const service=()=>window.__WTW_1999_UI_DATA__?.gameplayService||null;
const paint=()=>window.__WTW_NEXT__?.paint?.();
const reset=(level=0)=>{
 if(level<=0)local.raceId='';
 if(level<=1){local.jockeyId='';local.siteId='';local.bonusMinor=0}
 local.notice='';local.error='';
};
const label=x=>String(x||'').replaceAll('_',' ');
function render(){
 const game=service();
 if(!game){
  return /[?&]playtest=38(?:&|$)/.test(location.search||'')?
   '<section class="ng-card ng-race-plan-workspace" role="status"><header class="ng-cardhead"><h3>RACE ENTRY DESK</h3></header><p>Loading the saved game career and race conditions…</p></section>':'';
 }
 const view=game.view(),owned=view.stable||[];
 if(!owned.length)return '<section class="ng-card ng-race-plan-workspace"><header class="ng-cardhead"><h3>RACE ENTRY DESK</h3></header><p>No owner-controlled registered racehorses in this career.</p></section>';
 if(!owned.some(h=>h.horse_id===local.horseId)){
  local.horseId=owned[0].horse_id;reset();
 }
 const selected=owned.find(h=>h.horse_id===local.horseId);
 const opportunities=game.getRaceOpportunities(selected.horse_id,{horizonDays:21,limit:150});
 const choices=opportunities.rows||[];
 const opened=choices.filter(r=>r.source_status==='ACTUAL_GAME_RACE_ENTRIES_OPEN');
 if(!choices.some(r=>r.race_id===local.raceId)){
  local.raceId=(opened.find(r=>r.status==='PREMIER_REPLACEMENT_REQUIRED'||r.status==='PLAYER_CAN_ENTER'||r.status==='SHIPPING_REQUIRED')||
   opened[0]||choices[0])?.race_id||'';
  reset(1);
 }
 const current=choices.find(r=>r.race_id===local.raceId)||null;
 const jockeys=current?.available_jockeys||[];
 if(!jockeys.some(j=>j.jockey_id===local.jockeyId)){
  local.jockeyId=(jockeys.find(j=>j.owner_can_pay)||jockeys[0])?.jockey_id||'';
  local.bonusMinor=0;
 }
 const chosenJockey=jockeys.find(j=>j.jockey_id===local.jockeyId)||null;
 const bidCap=chosenJockey?.premier_offer_required?
  chosenJockey.maximum_signing_bonus_minor:0;
 if(local.bonusMinor>bidCap)local.bonusMinor=0;
 const permittedBonuses=[0,25000,50000,100000,200000,250000].
  filter(b=>b<=bidCap);
 const bidChoices=permittedBonuses.map(b=>
  '<option value="'+b+'" '+(b===local.bonusMinor?'selected':'')+'>'+
  currency(b)+'</option>').join('');
 const barns=current?.receiving_barn_options||[];
 if(!barns.some(b=>b.destination_site_id===local.siteId))local.siteId=
  (barns.find(b=>b.allowed)||barns[0])?.destination_site_id||'';
 let quote=null;
 if(current&&current.source_status==='ACTUAL_GAME_RACE_ENTRIES_OPEN'&&
  current.status!=='ALREADY_ENTERED'&&
  current.status!=='PREMIER_OFFER_PENDING'&&local.jockeyId){
  quote=game.getRacePlanQuote({horse_id:selected.horse_id,race_id:current.race_id,
   jockey_id:local.jockeyId,bonus_minor:local.bonusMinor,
   destination_site_id:
    current.status==='SHIPPING_REQUIRED'?local.siteId||null:null});
 }
 const blockers=(quote?.blockers||[]).map(b=>b.code+': '+b.message);
 const raceReasons=current?.eligibility_reasons||[];
 const details=current?'<div class="ng-rp-summary">'+
  '<span><small>RACE DATE</small><b>'+safe(current.date)+'</b></span>'+
  '<span><small>TRACK</small><b>'+safe(view.races.find(x=>x.id===current.race_id)?.track_id||current.track_id)+'</b></span>'+
  '<span><small>CONDITIONS</small><b>'+safe(current.conditions)+
   (current.max_career_wins!=null?' · NW'+(current.max_career_wins+1):'')+'</b></span>'+
  '<span><small>COURSE</small><b>'+safe(current.surface)+' · '+safe(current.distance_furlongs)+'f</b></span>'+
  '<span><small>PURSE</small><b>'+currency(current.purse_minor)+'</b></span>'+
  '<span><small>FIELD</small><b>'+safe(current.entries)+' / '+safe(current.capacity)+'</b></span></div>':'';
 const status=current?current.source_status!=='ACTUAL_GAME_RACE_ENTRIES_OPEN'?
  'Condition-book proposal only — not open for entries':
  current.status==='PREMIER_OFFER_PENDING'?
   'Premier jockey offer submitted — awaiting competitive rider selection':
  current.status==='PREMIER_REPLACEMENT_REQUIRED'?'Premier bid lost — choose a replacement jockey for this existing entry':
  current.status==='PREMIER_REPLACEMENT_UNAVAILABLE'?'Premier bid lost — no affordable replacement currently available':
  current.status==='ALREADY_ENTERED'?'Already entered in this race':
  current.status==='PLAYER_CAN_ENTER'?'At racecourse; entry currently permitted':
  current.status==='SHIPPING_REQUIRED'?'Travel and receiving barn must be authorized':
  'Not currently eligible for this race':'No race selected';
 const horseOptions=owned.map(h=>'<option value="'+safe(h.horse_id)+'" '+(h.horse_id===local.horseId?'selected':'')+'>'+
  safe(h.name)+' · '+safe(h.condition?.readiness!=null?Math.round(h.condition.readiness*100)+'% ready':'condition unassessed')+'</option>').join('');
 const raceOptions=choices.map(r=>'<option value="'+safe(r.race_id)+'" '+(r.race_id===local.raceId?'selected':'')+'>'+
  safe(r.date+' · '+r.track_id+' · '+r.conditions+
   (r.max_career_wins!=null?' NW'+(r.max_career_wins+1):'')+' · '+
   (r.source_status==='ACTUAL_GAME_RACE_ENTRIES_OPEN'?r.status:'PROPOSAL ONLY'))+'</option>').join('');
 const jockeyOptions=jockeys.map(j=>{
  const p=view.people.find(x=>x.id===j.jockey_id);
  return '<option value="'+safe(j.jockey_id)+'" '+(j.jockey_id===local.jockeyId?'selected':'')+'>'+
   safe(p?.name||j.jockey_id)+' · '+currency(j.fee_minor)+
   (j.premier_offer_required?' · competitive premier offer':' · confirmed booking')+
   (j.away_travel?' · travel':' · local')+
   (j.owner_can_pay?'':' · insufficient cash')+'</option>';
 }).join('');
 const barnOptions=barns.map(b=>{
  const site=game.state.runtime.facilities.sites[b.destination_site_id];
  return '<option value="'+safe(b.destination_site_id)+'" '+(b.destination_site_id===local.siteId?'selected':'')+'>'+
   safe(site?.name||b.destination_site_id)+' · '+currency(b.shipping_minor)+
   ' · '+safe(b.travel_days)+'d'+(b.allowed?'':' · '+b.blockers.join(', '))+'</option>';
 }).join('');
 const quoteBlock=quote?'<div class="ng-rp-summary" aria-label="Owner authorization breakdown">'+
  '<span><small>AVAILABLE OWNER CASH</small><b>'+currency(quote.owner_cash_minor)+'</b></span>'+
  '<span><small>'+(quote.premier_offer_required?
   'JOCKEY FEE PAID NOW':'JOCKEY & TRAVEL BOOKING')+'</small><b>'+
   currency(quote.jockey_booking_minor)+'</b></span>'+
  (quote.premier_offer_required?
   '<span><small>JOCKEY COST IF OFFER WINS</small><b>'+
    currency(quote.potential_jockey_if_signed_minor)+'</b></span>'+
   '<span><small>MAX TOTAL IF SIGNED</small><b>'+
    currency(quote.total_if_signed_minor)+'</b></span>'+
   '<span><small>JOCKEY DECISION DUE</small><b>'+
    safe(quote.premier_decision_due_date)+'</b></span>':'')+
  '<span><small>HORSE SHIPPING NOW</small><b>'+currency(quote.outbound_shipping_minor)+'</b></span>'+
  '<span><small>IMMEDIATE TOTAL</small><b>'+currency(quote.immediate_total_minor)+'</b></span>'+
  '<span><small>CASH AFTER PAYMENT</small><b>'+currency(quote.cash_after_booking_minor)+'</b></span>'+
  '<span><small>EST. RETURN COST (LATER)</small><b>'+currency(quote.estimated_return_shipping_minor)+'</b></span>'+
  '</div>':'';
 return '<section class="ng-card ng-race-plan-workspace" aria-label="Owner race planning and confirmation">'+
  '<header class="ng-cardhead"><div class="ng-headinggroup"><h3>RACE ENTRY DESK</h3>'+
  '<span>OWNED HORSES · ONE SAVED GAME CAREER · JANUARY 1999 TEST</span></div>'+
  '<span class="ng-rp-count">'+safe(opened.length)+' OPEN OPPORTUNITIES</span></header>'+
  '<div class="ng-rs-tools ng-rp-tools"><label>YOUR HORSE <select data-ng-select="race-plan-horse">'+
  horseOptions+'</select></label><label>RACE OPPORTUNITY <select data-ng-select="race-plan-race" '+
  (!choices.length?'disabled':'')+'>'+raceOptions+'</select></label></div>'+
  details+'<p class="ng-dpt-disclosure" role="status"><strong>'+safe(status)+'</strong>'+
  (raceReasons.length?' · '+safe([...new Set(raceReasons.map(label))].join(' · ')):'')+'</p>'+
  (current&&current.source_status==='ACTUAL_GAME_RACE_ENTRIES_OPEN'&&
   !['ALREADY_ENTERED','PREMIER_OFFER_PENDING','PREMIER_REPLACEMENT_UNAVAILABLE'].includes(current.status)?'<div class="ng-rs-tools ng-rp-tools">'+
   '<label>ACCEPTING JOCKEY <select data-ng-select="race-plan-jockey" '+(!jockeys.length?'disabled':'')+'>'+
   (jockeyOptions||'<option>No accepting available jockey</option>')+'</select></label>'+
   (chosenJockey?.premier_offer_required?
    '<label>PREMIER SIGNING BONUS (PAID ONLY IF SELECTED) <select data-ng-select="race-plan-bonus">'+
    bidChoices+'</select></label>':'')+
   (current.status==='SHIPPING_REQUIRED'?'<label>RECEIVING BARN <select data-ng-select="race-plan-site" '+(!barns.length?'disabled':'')+'>'+
    (barnOptions||'<option>No supported receiving barn</option>')+'</select></label>':'')+'</div>':'')+
  (current?.status==='PREMIER_OFFER_PENDING'?
   '<p class="ng-dpt-disclosure" role="status">Unpaid premier offers: '+
    safe((current.pending_premier_offers||[]).map(o=>o.jockey_id+
     ' · bonus '+currency(o.bonus_minor)).join(' · '))+
    '. Only a winning signed offer creates a rider fee.</p>':'')+
  quoteBlock+
  (blockers.length?'<p class="ng-rp-error" role="status">ENGINE RESTRICTION · '+safe(blockers.join(' · '))+'</p>':'')+
  '<div class="ng-rp-actions">'+(local.error?'<p role="alert" class="ng-rp-error">'+safe(local.error)+'</p>':'')+
  (local.notice?'<p role="status" class="ng-rp-success">'+safe(local.notice)+'</p>':'')+
  '<button type="button" class="primary" data-ng="race-plan-confirm" '+
  (!quote?.can_confirm||local.busy?'disabled':'')+
  ' aria-label="'+(quote?.existing_entry_fallback?
   'Authorize a replacement jockey for the existing race entry of ':
   quote?.premier_offer_required?
   'Submit a competitive unsigned premier jockey offer for ':
   'Authorize actual game race entry and jockey booking for ')+safe(selected.name)+'">'+
  (local.busy?'SAVING AUTHORIZED ENTRY…':quote?.can_confirm?
   quote.existing_entry_fallback?
    'BOOK REPLACEMENT JOCKEY & PAY '+currency(quote.immediate_total_minor):
    quote.premier_offer_required?
    'SUBMIT PREMIER OFFER · PAY '+currency(quote.immediate_total_minor)+' NOW':
    'CONFIRM ENTRY & PAY '+currency(quote.immediate_total_minor):
    'ENTRY NOT AUTHORIZED')+'</button>'+
  '<small>Quote is read-only. Confirming is one atomic game command. Return shipping is a later decision.</small></div>'+
  '</section>';
}
function select(field,value){
 if(local.busy)return;
 if(field==='race-plan-horse'){local.horseId=value;reset()}
 else if(field==='race-plan-race'){local.raceId=value;reset(1)}
 else if(field==='race-plan-jockey'){
  local.jockeyId=value;local.bonusMinor=0;local.notice='';local.error='';
 }
 else if(field==='race-plan-bonus'){
  local.bonusMinor=Math.max(0,Number(value)||0);local.notice='';local.error='';
 }
 else if(field==='race-plan-site'){local.siteId=value;local.notice='';local.error=''}
 else return false;
 paint();return true;
}
async function confirm(){
 if(local.busy)return;
 const game=service();
 if(!game){local.error='The career is not loaded.';return paint()}
 const opts={horse_id:local.horseId,race_id:local.raceId,
  jockey_id:local.jockeyId,bonus_minor:local.bonusMinor,
  destination_site_id:local.siteId||null};
 const opportunity=game.getRaceOpportunities(local.horseId,{horizonDays:21,limit:150}).
  rows.find(x=>x.race_id===local.raceId);
 if(!opportunity){local.error='Race opportunity changed; choose an actual open race.';return paint()}
 if(opportunity.status!=='SHIPPING_REQUIRED')opts.destination_site_id=null;
 const quote=game.getRacePlanQuote(opts);
 if(!quote.can_confirm){local.error=quote.blockers.map(x=>x.code+': '+x.message).join('; ');return paint()}
 const h=game.view().stable.find(x=>x.horse_id===local.horseId);
 const message=quote.existing_entry_fallback?
  'The premier rider selected a rival. Sign a replacement jockey for '+h.name+
  ' in '+quote.race_id+' for '+currency(quote.jockey_booking_minor)+
  '? The horse is already entered and will not pay a second entry or shipping fee.':
  quote.premier_offer_required?
  'Submit competitive premier-jockey offer for '+h.name+' in '+quote.race_id+
  ' on '+quote.race_date+'? Signing bonus '+currency(quote.offer_bonus_minor)+
  '; maximum jockey cost if selected '+currency(quote.potential_jockey_if_signed_minor)+
  '; decision due '+quote.premier_decision_due_date+
  '. No jockey fee is charged now. Immediate shipping cost '+
  currency(quote.outbound_shipping_minor)+
  '. Max possible combined charge '+currency(quote.total_if_signed_minor)+'.':
  'Authorize '+h.name+' to enter '+quote.race_id+' on '+quote.race_date+
  '? Jockey booking '+currency(quote.jockey_booking_minor)+
  (quote.outbound_shipping_minor?' + outbound shipping '+currency(quote.outbound_shipping_minor):'')+
  ' = '+currency(quote.immediate_total_minor)+' charged now.'+
  (quote.estimated_return_shipping_minor?
   ' Future return shipping (NOT charged now): about '+currency(quote.estimated_return_shipping_minor)+'.':'');
 if(!window.confirm(message))return;
 local.busy=true;local.error='';local.notice='';paint();
 try{
  await game.submit('CONFIRM_1999_RACE_PLAN',{...opts,
   expected_revision:quote.expected_revision,
   maximum_total_minor:quote.total_if_signed_minor},'player');
  local.notice=quote.existing_entry_fallback?
   'REPLACEMENT JOCKEY BOOKED · '+h.name+' · existing entry retained · '+
    currency(quote.immediate_total_minor)+' charged and saved.':
   quote.premier_offer_required?
   'PREMIER OFFER SUBMITTED · '+h.name+' · rider decides on '+
    quote.premier_decision_due_date+
    ' · no jockey fee yet; shipping paid now '+currency(quote.outbound_shipping_minor)+'.':
   'ENTRY CONFIRMED · '+h.name+' · jockey booked · '+
    currency(quote.immediate_total_minor)+' charged and saved in the game ledger.';
 }catch(error){local.error='NO BOOKING OR PAYMENT COMMITTED · '+String(error?.message||error)}
 finally{local.busy=false;paint()}
}
window.WTW1999PlayerRacePlans=Object.freeze({
 render,select,confirm,
 pickHorse(id){local.horseId=id;reset();paint()},
 current:()=>({...local})
});
window.__WTW_NEXT__?.paint?.();
