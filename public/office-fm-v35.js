/* WIRE TO WIRE v35 — game-board Office composition.
   Move existing live nodes; never clone model state or decision controls. */
(() => {
  'use strict';
  const body = document.body;
  const center = document.querySelector('main.main .mid.decisionDeskShell');
  if (!center || !body.classList.contains('wtw-fm-v34') || body.classList.contains('wtw-fm-v35')) return;
  const identity = center.querySelector('.wtwOfficeIdentity');
  const decision = center.querySelector('.decisionDesk');
  const intel = center.querySelector('.intelPanel');
  const move = center.querySelector('.movePanel');
  const factors = decision?.querySelector('.caseFacts');
  const caseHero = decision?.querySelector('.caseHero');
  if (!identity || !decision || !intel || !move || !factors || !caseHero) return;

  // Two independently sized feature cards replace the monolithic decision panel.
  const featureRow = document.createElement('div');
  featureRow.className = 'wtwV35FeatureRow';
  const factorsPanel = document.createElement('section');
  factorsPanel.className = 'panel wtwV35FactorsPanel';
  factorsPanel.setAttribute('aria-label','Decision factors');
  const factorsHeader = document.createElement('div');
  factorsHeader.className = 'panelHead';
  factorsHeader.innerHTML = '<div class="panelTitle"><img class="wtwV35SectionBadge" src="/assets/profile-badges/v2/wtw_badge_connections.png" alt="" aria-hidden="true">Decision Factors</div>';
  const factorBody = document.createElement('div');
  factorBody.className = 'wtwV35FactorsBody';
  factorsPanel.append(factorsHeader, factorBody);
  factorBody.appendChild(factors);
  featureRow.append(decision,factorsPanel);

  const supportRow = document.createElement('div');
  supportRow.className = 'wtwV35SupportRow';
  supportRow.append(intel,move);
  center.append(featureRow,supportRow);
  identity.querySelector('.wtwOfficeEyebrow').textContent='THE RACING OFFICE · DAILY BRIEFING';
  identity.querySelector('.wtwOfficeHeadline h2').textContent='Racing Office';
  identity.querySelector('.wtwOfficeHeadline p').textContent='Decisions, commitments and opportunities';
  const stats = identity.querySelector('.wtwOfficeSummary');
  if (stats) {
    const countNode = stats.querySelector('#wtwBoardCount');
    const countCaption = countNode?.nextElementSibling;
    if (countCaption) countCaption.textContent='Horses';
    const scheduleNode = stats.querySelector('#wtwScheduleCount');
    const scheduleCaption = scheduleNode?.nextElementSibling;
    if (scheduleCaption) scheduleCaption.textContent='Schedule items';
  }

  // Categories are derived from the existing case IDs, not invented data sources.
  const inboxTags = {
    powerline:['Racing','race'],lastmatch:['Vet','medical'],saratoga:['Sales','sales'],
    pieta:['Training','training'],cash:['Finance','finance'],newsbuzz:['Media','media'],
    entries:['Entries','race'],cedar:['Farm','farm']
  };
  document.querySelectorAll('.msgList .msg').forEach(item=>{
    const legacyMarker=item.firstElementChild;
    if(legacyMarker && !legacyMarker.className && !legacyMarker.children.length && !legacyMarker.textContent.trim()) legacyMarker.remove();
    if (item.querySelector('.wtwV35Status')) return;
    const t=item.querySelector('.time');
    if (!t) return;
    const d=document.createElement('div');d.className='wtwV35Status';
    const info=inboxTags[item.dataset.case] || ['Office','office'];
    const tag=document.createElement('span');tag.className='wtwV35Tag '+info[1];tag.textContent=info[0];
    d.append(tag,t);item.appendChild(d);
  });
  const filters=document.querySelector('.messages .filters');
  const priority=filters?.querySelector('.filterTools');
  if(priority) {priority.textContent='···';priority.setAttribute('role','button');priority.setAttribute('tabindex','0');priority.setAttribute('title','Priority feed');priority.setAttribute('aria-label','Priority feed');priority.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();priority.click();}});}
  // The date is read from the existing clock chip, not a new racing calendar.
  const list=document.querySelector('.messages .msgList');
  if(list && !list.querySelector('.wtwV35FeedDate')){
    const header=document.createElement('div');header.className='wtwV35FeedDate';
    const refreshDate=()=>{header.textContent='OFFICE FEED · '+(document.querySelector('.dateChip')?.textContent?.trim()||'IN-GAME DAY')};
    refreshDate();list.prepend(header);
    const date=document.querySelector('.dateChip');
    if(date) new MutationObserver(refreshDate).observe(date,{characterData:true,childList:true,subtree:true});
  }
  // Preserve each named arrow action while making room in narrow panel headers.
  const opportunityLink=document.querySelector('.right .opportunities .panelHead .link');
  if(opportunityLink){opportunityLink.setAttribute('title',opportunityLink.textContent.trim());opportunityLink.textContent='All';}
  const scheduleLink=document.querySelector('.right .fixtures .panelHead .link');
  if(scheduleLink){scheduleLink.setAttribute('title',scheduleLink.textContent.trim());scheduleLink.textContent='All';}
  body.classList.add('wtw-fm-v35');
})();
