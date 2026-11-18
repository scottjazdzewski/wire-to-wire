/* WTW v37 — all six horses, real racing targets, and a compact offers shortcut.
   Moves existing canonical Office nodes; it does not clone or replace game state. */
(() => {
 'use strict';
 const body=document.body;
 if(!body?.classList.contains('wtw-fm-v36')||body.classList.contains('wtw-fm-v37'))return;
 const right=document.querySelector('main.main .right');
 const board=right?.querySelector(':scope > .board');
 const fixtures=right?.querySelector(':scope > .fixtures');
 const opportunities=right?.querySelector(':scope > .opportunities');
 if(!board||!fixtures||!opportunities)return;
 // Stable first, race calendar second. Original panel DOM events/routes are preserved.
 right.insertBefore(board,fixtures);
 const badgeBase='/assets/profile-badges/v2/';
 const safeBadge=(name)=>{const img=document.createElement('img');img.className='wtwV37Badge';img.alt='';img.setAttribute('aria-hidden','true');img.src=badgeBase+name;return img;};
 const stableTitle=board.querySelector('.panelTitle'),raceTitle=fixtures.querySelector('.panelTitle');
 if(stableTitle){stableTitle.textContent='YOUR STABLE';stableTitle.prepend(safeBadge('wtw_badge_horse.png'));const counter=document.createElement('span');counter.className='wtwV37PanelCount';counter.textContent=board.querySelectorAll('.rankRow').length+' horses';stableTitle.append(counter);}
 if(raceTitle){raceTitle.textContent='UPCOMING RACES';raceTitle.prepend(safeBadge('wtw_badge_meet_schedule.png'));const counter=document.createElement('span');counter.className='wtwV37PanelCount';counter.id='wtwV37EntrySummary';counter.textContent='Targets';raceTitle.append(counter);}
 // Show the whole existing Stable Board. Activity is drawn from the same current Office
 // messages, fixtures and case-state propagation; it is never invented.
 const activityMap=new Map();
 const rows=[...board.querySelectorAll('.boardRows>.rankRow')];
 for(const row of rows){
   const strong=row.querySelector('strong');if(!strong)continue;
   const name=strong.textContent.trim();
   const wrapper=document.createElement('div');wrapper.className='wtwV37HorseIdentity';
   const activity=document.createElement('span');activity.className='wtwV37HorseActivity';
   strong.replaceWith(wrapper);wrapper.append(strong,activity);
   row.setAttribute('tabindex','0');row.setAttribute('role','link');
   row.setAttribute('aria-label','Open horse profile: '+name);
   row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();row.click();}});
   const msg=[...document.querySelectorAll('.left .msg')].find(m=>m.querySelector('.title')?.textContent.toLowerCase().includes(name.toLowerCase()));
   const fixture=[...fixtures.querySelectorAll('.fixture')].find(f=>f.dataset.profile===name);
   const note=msg?.querySelector('.msgText .meta')?.textContent.trim() || fixture?.querySelector('p')?.textContent.trim() || 'No current Office activity recorded';
   activityMap.set(row,{activity,note});
 }
 const raceRows=[...fixtures.querySelectorAll('.fixture[data-track]')];
 for(const row of raceRows){
   row.setAttribute('tabindex','0');row.setAttribute('role','link');
   const name=row.querySelector('h4')?.textContent.trim()||'Race';
   row.setAttribute('aria-label','Open race or target: '+name);
   row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();row.click();}});
   const info=row.querySelector('p');
   if(info){const flag=document.createElement('span');flag.className='wtwV37EntryFlag';flag.textContent='· Target';info.after(flag);}
 }
 // Only the confirmed entered state from the original decision engine may read Entered.
 function syncFacts(){
   for(const [row,data] of activityMap){
     const full=row.title?.trim();
     const proposed=full||data.note;
     const concise=proposed.length>49 ? (row.querySelector('span:last-child')?.textContent.trim()||data.note) : proposed;
     if(data.activity.textContent!==concise)data.activity.textContent=concise;
   }
   let entered=0;
   for(const row of raceRows){
     const marker=row.querySelector('.wtwV37EntryFlag');
     const linkedHorse=rows.find(h=>h.querySelector('strong')?.textContent.trim()===row.dataset.profile);
     const full=(row.title||'')+' '+(row.querySelector('p')?.textContent||'')+' '+(linkedHorse?.title||'');
     const confirmed=/\bentered\b|\bentry confirmed\b/i.test(full) && !/not entered|entry held|pending|awaiting/i.test(full);
     if(marker){marker.textContent=confirmed?'· Entered':'· Target';marker.classList.toggle('entered',confirmed);}
     if(confirmed)entered++;
   }
   const summary=document.getElementById('wtwV37EntrySummary');
   if(summary)summary.textContent=entered?entered+' entered · '+(raceRows.length-entered)+' targets':raceRows.length+' targets';
 }
 const leads=document.createElement('section');leads.className='panel wtwV37Leads';
 const count=opportunities.querySelectorAll('.oppItem').length;
 leads.innerHTML='<button type="button" data-act="Open opportunity board" aria-label="Open '+count+' racing and business opportunities"><span class="wtwV37LeadsIcon">✦</span><span>Opportunities</span><span class="wtwV37LeadsCount">'+count+' leads</span><span class="wtwV37LeadsArrow" aria-hidden="true">›</span></button>';
 right.append(leads);
 const subtitle=document.querySelector('.wtwOfficeHeadline p');if(subtitle)subtitle.textContent="Today's decisions, horses and racing commitments";
 body.classList.add('wtw-fm-v37');
 syncFacts();
 // Original game updates status in the existing DOM after decisions; update only
 // our supplementary labels, without writing back into the state or source rows.
 right.addEventListener('click',()=>setTimeout(syncFacts,0));
 document.addEventListener('click',()=>setTimeout(syncFacts,0));
 window.addEventListener('focus',syncFacts);
})();