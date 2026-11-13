/* WIRE TO WIRE · approved-only January 1999 founding dossier templates.
 * Ownership + facility use the approved Track information architecture.
 * People use the approved Horse's detailed dossier information architecture.
 * Read-only: NEVER registers a facility, contract, staff member, horse or result.
 * Every link uses an exact immutable organization/person/horse ID. */
(()=>{
'use strict';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
const text=value=>typeof value==='string'&&value.trim()?value.trim():'';
const place=value=>typeof value==='string'?value:(value&&typeof value==='object'?
 [value.locality||value.city||'',value.region||value.state||'',value.country||''].filter(Boolean).join(', '):'');
const notKnown=value=>!text(String(value??''))||/^(?:unknown|not recorded|unverified|not certified|null)$/i.test(String(value));
const moneyUnknown='NOT CERTIFIED';
const EMPTY='Not recorded';
const TYPES=Object.freeze({
 'STUD_FARM':'STUD FARM','FARM':'FARM','RACING_STABLE_ORGANIZATION':'RACING OPERATION',
 'ORGANIZATION_ONLY':'ORGANIZATION'
});
function category(o){
 const t=String(o.facilityDisplayCategory||'').toUpperCase();
 if(TYPES[t])return t;
 const type=String(o.type||'').toUpperCase(),name=String(o.name||'').toUpperCase();
 if(/STUD|STALLION|INTEGRATED BREEDING/.test(type)||/\bSTUD\b/.test(name))return 'STUD_FARM';
 if(/FARM|NURSERY/.test(type))return 'FARM';
 if(/RACING STABLE|OWNERSHIP STABLE/.test(type))return 'RACING_STABLE_ORGANIZATION';
 return 'ORGANIZATION_ONLY';
}
function link(kind,id,label){
 if(!id||!label)return '<strong>'+esc(label||EMPTY)+'</strong>';
 return '<button type="button" class="ng-entity-reference" data-ng="founding-open" data-val="'+
 esc(kind+':'+id)+'" title="Open '+esc(label)+' profile">'+esc(label)+' ↗</button>';
}
function fact(label,value,html=''){
 return '<div class="ng-track-meet-fact"><small>'+esc(label)+'</small><strong>'+
 (html||esc(text(String(value??''))||EMPTY))+'</strong></div>';
}
function card(title,body,action='',actionLabel=''){
 return '<section class="ng-tier1-card ng-founding-card"><header>'+esc(title)+
  (action?'<button type="button" data-ng="detailtab" data-val="'+esc(action)+'">'+
  esc(actionLabel||'VIEW RECORD')+' ↗</button>':'')+
  '</header>'+body+'</section>';
}
function empty(message){return '<p class="ng-founding-empty">'+esc(message)+'</p>';}
function heading(kind,rec,badgeHtml,returnMenu,summary){
 return '<div class="ng-profile-intro ng-founding-header">'+
  (badgeHtml||'')+'<div class="ng-profile-identity">'+
  '<div class="ng-profile-breadcrumb">1999 FOUNDING WORLD <span> / </span> '+esc(kind)+'</div>'+
  '<h2>'+esc(rec.name)+'</h2><p class="ng-founding-subline">'+esc(summary)+'</p>'+
  '<div class="ng-founding-id">EXACT ID · '+esc(rec.id)+'</div></div>'+
  '<div class="ng-profile-tools"><button data-ng="menu" data-val="'+esc(returnMenu)+'">← '+esc(returnMenu.toUpperCase())+'</button>'+
  '<button data-ng="office">RACING OFFICE</button></div></div>';
}
function nav(active,options){
 return '<nav class="ng-founding-nav ng-person-dossierbar ng-management-dossierbar" aria-label="Profile record navigation">'+
 '<span class="ng-person-dossierlabel">FOUNDING FILE <small>1999 · READ ONLY</small></span>'+
 '<div class="ng-person-dossieractions">'+options.map(label=>
 '<button type="button" data-ng="detailtab" data-val="'+esc(label)+'" class="'+(active===label?'on':'')+'">'+
 esc(label.toUpperCase())+'</button>').join('')+'</div></nav>';
}
function openingStock(world,organizationId){
 return (world.horses||[]).filter(h=>
  h._role==='stallion'&&h.standingFarm1999?.farmOrganizationId===organizationId||
  h._role==='broodmare'&&h.boardingFarm1999?.farmOrganizationId===organizationId);
}
function assoc(world,organizationId){return (world.historicalAnchors||[]).filter(x=>x.organizationId===organizationId);}
function people(world,organization){
 const ids=new Set([organization.publicPrincipalId,organization.principalOwnerId,
  organization.publicInvestorId,...(organization.leadershipPeopleIds||[])].filter(Boolean));
 return (world.people||[]).filter(p=>ids.has(p.id));
}
function associationTable(rows){
 if(!rows.length)return empty('No verified historical horse associations in this founding record.');
 return '<div class="ng-founding-table" role="table" aria-label="Historical horse associations">'+
 '<div class="ng-founding-table-head" role="row"><span>HORSE</span><span>RECORDED ROLE</span><span>YEARS</span></div>'+
 rows.map(a=>'<div class="ng-founding-table-row" role="row">'+link('horse',a.horseId,a.horse)+
 '<span>'+esc(String(a.role||'ROLE UNVERIFIED').replaceAll('_',' '))+
  (a.status==='SOURCE_VERIFIED'?' · SOURCE':' · REVIEW')+'</span><span>'+
 esc((a.recordedStakesYears||[]).join(', ')||'Not dated')+'</span></div>').join('')+
 '</div><p class="ng-founding-note">Year-level historical associations are not proof of race-day ownership, contracts or 1999 entries.</p>';
}
function stockTable(rows){
 if(!rows.length)return empty('No source-linked living breeding stock is assigned to this institution.');
 return '<div class="ng-founding-table" role="table" aria-label="1999 breeding-stock records">'+
 '<div class="ng-founding-table-head" role="row"><span>HORSE</span><span>ROLE</span><span>LOCATION EVIDENCE</span></div>'+
 rows.map(h=>'<div class="ng-founding-table-row" role="row">'+link('horse',h.id,h.name)+
 '<span>'+esc(h._role==='stallion'?'STANDING STALLION':'BOARDING BROODMARE')+'</span>'+
 '<span>'+esc(h._role==='stallion'?'1999 standing farm':'1999 boarding farm')+'</span></div>').join('')+
 '</div>';
}
function principalBlock(org,world){
 const members=people(world,org),primaryId=org.publicPrincipalId||org.principalOwnerId||'';
 const lead=members.find(p=>p.id===primaryId);
 const investor=members.find(p=>p.id===org.publicInvestorId);
 const remainder=members.filter(p=>p.id!==primaryId&&p.id!==org.publicInvestorId);
 const primary=lead?link('person',lead.id,lead.name):
  '<span class="ng-founding-pending">PENDING APPROVAL · NO PRINCIPAL ASSIGNED</span>';
 const rows='<div class="ng-founding-person-row"><small>1999 PRINCIPAL</small>'+primary+'</div>'+
 remainder.map(p=>'<div class="ng-founding-person-row"><small>'+esc(String(p.positionTitle||p.role||'SECONDARY LEADERSHIP').replaceAll('_',' '))+'</small>'+
 link('person',p.id,p.name)+'</div>').join('')+
 (investor?'<div class="ng-founding-person-row"><small>MAJOR NON-OPERATING INVESTOR</small>'+
 link('person',investor.id,investor.name)+'</div>':'');
 return '<div class="ng-founding-people-list">'+rows+'</div>';
}
function institution(kind,org,world,options){
 if(!org||!world?.organizations?.some(o=>o.id===org.id))return '';
 const facility=kind==='facility';
 const tab=options.tab||'Overview',type=category(org),stock=openingStock(world,org.id),history=assoc(world,org.id);
 const badge=options.logoMarkup||'';
 const klass='ng-profile-view ng-profile-track ng-founding-profile '+(facility?'ng-founding-facility':'ng-founding-ownership');
 const subject=facility?'FACILITY FILE':'OWNERSHIP FILE';
 const officeCategory=TYPES[type]||'ORGANIZATION';
 const summary=officeCategory+' · '+(org.location||org.locationLabel||'LOCATION NOT RECORDED');
 const header=heading(subject,org,badge,facility?'Facilities':'Personnel',summary);
 const operations=card(facility?'FACILITY & OPERATIONS':'OWNERSHIP & OPERATIONS',
  '<div class="ng-track-meet-facts">'+
  fact('INSTITUTION TYPE',org.type||officeCategory)+
  fact('1999 BASE',org.location||org.locationLabel)+
  fact('PRINCIPAL STATUS',org.leadershipStatus==='PENDING_USER_REVIEW_NO_APPROVED_PRINCIPAL'?
   'AWAITING NAME APPROVAL':'APPROVED / ESTABLISHED')+
  fact('OPENING RACING HORSES','0 REGISTERED')+'</div>'+
  '<p class="ng-founding-note">This is an organization, not a newly constructed building. Facilities, cash, contracts and staffing require separate approval.</p>','Operations','FULL RECORD');
 const peopleCard=card('PRINCIPALS & CONNECTIONS',principalBlock(org,world),'Leadership','ALL PEOPLE');
 const historyBlurb=text(org.approvedOrigin)||'No separate approved origin narrative has been recorded.';
 const historyCard=card('INSTITUTION HISTORY',
   '<p class="ng-track-history-blurb">'+esc(historyBlurb)+'</p>'+
   '<div class="ng-founding-histline">'+esc(history.length+' source-linked historical horse associations')+'</div>',
   'History','FULL HISTORY');
 const stockCard=card('LIVING BREEDING STOCK · 1999',
   stockTable(stock.slice(0,8))+(stock.length>8?'<p class="ng-founding-note">'+(stock.length-8)+' more in Breeding Stock.</p>':''),
   'Breeding Stock','ALL STOCK');
 const histRecords=card('HISTORICAL RACING & BLOODLINES',
  associationTable(history.slice(0,15))+
  (history.length>15?'<p class="ng-founding-note">Showing 15 of '+history.length+' recorded associations.</p>':''),
  'History','ALL HISTORY');
 const physical=card('FACILITY READINESS',
   '<div class="ng-track-meet-facts">'+fact('BUILDING / BARN','NOT REGISTERED')+
   fact('CAPACITY',moneyUnknown)+fact('STAFFING',moneyUnknown)+
   fact('OPERATING COST',moneyUnknown)+'</div>'+
   '<p class="ng-founding-note">Facility detail is not inferred from the name of a farm, racing stable or track.</p>');
 const ownership=card('1999 RACING OWNERSHIP',
  '<div class="ng-track-meet-facts">'+fact('REGISTERED RUNNERS','NONE RELEASED')+
   fact('OWNER ACCOUNTS','NOT CERTIFIED')+
   fact('ACTIVE CONTRACTS','NOT CERTIFIED')+'</div>'+
   empty('New racehorses, transfers and settlement data will appear only after an authoritative engine release.'));
 let left='',right='';
 if(tab==='Overview'){
  left=facility?stockCard:histRecords;
  right='<div class="ng-track-info-stack">'+operations+peopleCard+
   (facility?physical:historyCard)+'</div>';
 }else if(tab==='Leadership'){
  left=peopleCard;right='<div class="ng-track-info-stack">'+operations+historyCard+'</div>';
 }else if(tab==='Breeding Stock'){
  left=card('ALL SOURCE-LINKED 1999 BREEDING STOCK',stockTable(stock));
  right='<div class="ng-track-info-stack">'+operations+physical+'</div>';
 }else if(tab==='History'){
  left=card('DOCUMENTED HISTORICAL CONNECTIONS',associationTable(history));
  right='<div class="ng-track-info-stack">'+historyCard+operations+'</div>';
 }else{
  left=facility?physical:ownership;
  right='<div class="ng-track-info-stack">'+peopleCard+operations+'</div>';
 }
 const tabs=['Overview','Operations','Leadership','Breeding Stock','History'];
 return '<div class="'+klass+'" data-founding-kind="'+esc(kind)+'" data-founding-id="'+esc(org.id)+'">'+
  header+nav(tab,tabs)+
  '<div class="ng-detail-cols ng-detail-cols-tier1"><div class="ng-track-workspace ng-founding-workspace">'+
  '<div class="ng-founding-main">'+left+'</div>'+right+'</div></div>'+
  '<footer class="ng-founding-footnote">1999 founding universe · Exact organization ID · Read-only source relationships · No unapproved game entities</footer></div>';
}
function person(rec,world,options){
 if(!rec||!world?.people?.some(p=>p.id===rec.id))return '';
 const tab=options.tab||'Overview',base=place(rec.base)||place(rec.baseGeography)||EMPTY;
 const born=place(rec.birthplace)||EMPTY,age=rec.ageAtOpening??rec.age??EMPTY;
 const role=String(rec.positionTitle||rec.role||'ROLE NOT RECORDED').replaceAll('_',' ');
 const direct=(world.organizations||[]).filter(o=>o.principalOwnerId===rec.id||
  o.publicPrincipalId===rec.id||o.publicInvestorId===rec.id||
  (o.leadershipPeopleIds||[]).includes(rec.id));
 const isInvestor=rec.relationshipType==='MAJOR_INVESTOR_NON_OPERATING';
 const affiliationRows=direct.map(org=>'<div class="ng-founding-person-row"><small>'+
  esc(org.publicInvestorId===rec.id?'MAJOR NON-OPERATING INVESTOR':
   org.publicPrincipalId===rec.id||org.principalOwnerId===rec.id?'PRINCIPAL':'SECONDARY LEADERSHIP')+'</small>'+
  link('ownership',org.id,org.name)+'</div>').join('')||
  empty('No approved operating or investment assignment is recorded.');
 const biography='<div class="ng-horse-biography ng-founding-biography">'+[
  ['ROLE',role],['AGE · JAN 1999',age],['BIRTHPLACE',born],['OPERATING BASE',base]
 ].map(([label,value])=>'<span><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong></span>').join('')+'</div>';
 const bioHeader=heading('PERSONNEL DOSSIER',rec,
  options.personBadge||'', 'Personnel',role+' · '+base);
 const ratingRows=['Professional ability','Race or farm specialization','Experience','Reputation','Current availability'].map(x=>
  '<div class="ng-horse-rating-row ability-unrated"><span>'+esc(x)+'</span>'+
  '<span class="ng-horse-rating-unassessed" aria-hidden="true"></span><strong class="unknown">—</strong></div>').join('');
 const ratingCard='<section class="ng-horse-mgr-panel ng-horse-ratings"><header><strong>PROFESSIONAL EVALUATION</strong>'+
  '<span>AWAITING CERTIFIED DATA</span></header><div class="ng-horse-rating-rows">'+ratingRows+'</div>'+
  '<p class="ng-founding-note">No simulated ability ratings have been promoted to the founding personnel roster.</p></section>';
 const affiliation=card('FOUNDING ORGANIZATIONS & ROLE', '<div class="ng-founding-people-list">'+affiliationRows+'</div>');
 const career=card('CAREER & EMPLOYMENT', '<div class="ng-track-meet-facts">'+
  fact('APPOINTMENT',isInvestor?'NON-OPERATING INVESTOR':'FOUNDING ROLE')+
  fact('CERTIFIED CAREER WINS',EMPTY)+fact('1999 CONTRACT',moneyUnknown)+
  fact('PAYROLL',moneyUnknown)+'</div>'+
  '<p class="ng-founding-note">Historical racing associations do not establish employment contracts or performance totals.</p>');
 const horses=card('CURRENT HORSE ASSIGNMENTS',
  empty('No registered 1999 horses or current assignments have been released by the gameplay engine.'));
 const bio=card('BIOGRAPHY & PROVENANCE','<div class="ng-track-meet-facts">'+
  fact('PERSON ID',rec.id)+fact('RECORDED ROLE',role)+fact('BIRTHPLACE',born)+
  fact('1999 BASE',base)+'</div>'+
  '<p class="ng-founding-note">'+esc(isInvestor?
   'Investment role only. No management authority or ownership percentage is implied.':
   'Approved game-world affiliation does not establish historical employment or ownership rights.')+'</p>');
 let contents='';
 if(tab==='Overview')contents='<div class="ng-founding-person-grid">'+
  '<div class="ng-founding-person-main">'+ratingCard+affiliation+'</div>'+
  '<div class="ng-founding-person-side">'+horses+career+'</div></div>';
 else if(tab==='Connections')contents='<div class="ng-founding-person-grid">'+affiliation+bio+'</div>';
 else if(tab==='Career')contents='<div class="ng-founding-person-grid">'+career+horses+'</div>';
 else contents='<div class="ng-founding-person-grid">'+bio+career+'</div>';
 return '<div class="ng-profile-view ng-profile-horse ng-profile-person ng-founding-profile ng-founding-person"'+
  ' data-founding-kind="person" data-founding-id="'+esc(rec.id)+'">'+bioHeader+biography+
  nav(tab,['Overview','Connections','Career','History'])+
  '<div class="ng-detail-cols ng-detail-cols-horse-overview">'+contents+'</div>'+
  '<footer class="ng-founding-footnote">Read-only personnel dossier · Exact person ID · No test-world staff or synthetic performance</footer></div>';
}
window.WTW1999FoundingProfiles=Object.freeze({institution,person,category});
})();