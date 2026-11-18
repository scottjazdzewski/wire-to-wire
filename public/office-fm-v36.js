/* WTW v36: FM-style no-scroll Office panels. Paging is presentational;
   all original message/horse/fixture/opportunity DOM nodes and game events remain. */
(() => {
  'use strict';
  const body=document.body;
  if (!body?.classList.contains('wtw-fm-v35') || body.classList.contains('wtw-fm-v36')) return;
  const list=document.querySelector('.left.messages .msgList');
  const date=list?.querySelector('.wtwV35FeedDate');
  if (!list || !date) return;
  const inbox=document.createElement('div');inbox.className='wtwV36InboxRows';inbox.setAttribute('role','list');
  [...list.querySelectorAll(':scope > .msg')].forEach(n=>inbox.append(n));
  const footer=document.createElement('div');footer.className='wtwV36InboxFooter';
  footer.innerHTML='<span class="wtwV36InboxRange" aria-live="polite"></span><span class="wtwV36InboxButtons"><button type="button" class="wtwV36InboxPrev" aria-label="Previous messages">‹</button><span class="wtwV36InboxPage">1 / 1</span><button type="button" class="wtwV36InboxNext" aria-label="Next messages">›</button></span>';
  list.append(inbox,footer);
  let inboxPage=0,rendering=false,lastSelection=null,lastFilter='';
  const inboxSize=()=>innerHeight<690?4:innerHeight>=865?8:innerHeight>=785?7:6;
  function renderInbox(forceSelection=false){
    if(rendering)return;rendering=true;
    const all=[...inbox.querySelectorAll('.msg')];
    const available=all.filter(n=>!n.classList.contains('hiddenByFilter'));
    const size=inboxSize();const total=Math.max(1,Math.ceil(available.length/size));
    const selected=available.find(n=>n.classList.contains('selected'));
    if(forceSelection&&selected)inboxPage=Math.floor(available.indexOf(selected)/size);
    inboxPage=Math.min(Math.max(inboxPage,0),total-1);
    const start=inboxPage*size;
    all.forEach(n=>n.classList.toggle('wtwV36Hidden',!available.includes(n)||available.indexOf(n)<start||available.indexOf(n)>=start+size));
    const shown=Math.min(size,Math.max(0,available.length-start));
    inbox.style.gridTemplateRows=`repeat(${shown},minmax(0,1fr))`;
    footer.querySelector('.wtwV36InboxRange').textContent=available.length?`${start+1}–${start+shown} of ${available.length} messages`:'No matching messages';
    footer.querySelector('.wtwV36InboxPage').textContent=`${inboxPage+1} / ${total}`;
    footer.querySelector('.wtwV36InboxPrev').disabled=inboxPage===0;
    footer.querySelector('.wtwV36InboxNext').disabled=inboxPage>=total-1;
    lastSelection=selected?.dataset.case||null;
    lastFilter=all.map(n=>n.classList.contains('hiddenByFilter')?'0':'1').join('');
    rendering=false;
  }
  footer.querySelector('.wtwV36InboxPrev').addEventListener('click',()=>{inboxPage--;renderInbox();});
  footer.querySelector('.wtwV36InboxNext').addEventListener('click',()=>{inboxPage++;renderInbox();});
  // FM-style compact access strip replaces unused empty rail space without
  // duplicating any game entities or introducing inert controls.
  const right=document.querySelector('main.main .right');
  if(right&&!right.querySelector('.wtwV36QuickPanel')){
    const shortcuts=document.createElement('section');
    shortcuts.className='panel wtwV36QuickPanel';
    shortcuts.innerHTML='<div class="wtwV36QuickHead">DESK SHORTCUTS</div><div class="wtwV36QuickActions"><button type="button" data-act="Stable">Stable roster <span aria-hidden="true">›</span></button><button type="button" data-act="Race Calendar">Race calendar <span aria-hidden="true">›</span></button></div>';
    right.append(shortcuts);
  }
  // The underlying engine replaces the move cards with one resolved outcome.
  // Present its three independent facts as tabs, never as a one-row tiny table.
  const moveGrid=document.getElementById('moveGrid');
  function showOutcomeFact(which){
    const card=moveGrid?.querySelector('.decisionOutcome');if(!card)return;
    [...card.querySelectorAll('.outcomeFacts > div')].forEach((item,i)=>item.classList.toggle('wtwV36OutcomeHidden',i!==which));
    [...card.querySelectorAll('.wtwV36OutcomeTabs button')].forEach((button,i)=>{
      button.classList.toggle('selected',i===which);
      button.setAttribute('aria-pressed',String(i===which));
    });
  }
  function prepareOutcome(){
    const article=moveGrid?.querySelector('.decisionOutcome');
    if(!article||article.classList.contains('wtwV36OutcomeReady'))return;
    const facts=article.querySelector('.outcomeFacts');if(!facts)return;
    const tabBar=document.createElement('nav');tabBar.className='wtwV36OutcomeTabs';tabBar.setAttribute('aria-label','Decision outcome details');
    tabBar.innerHTML='<button type="button" data-wtw-outcome="0">Immediate Effect</button><button type="button" data-wtw-outcome="1">Barn Reaction</button><button type="button" data-wtw-outcome="2">Follow-up</button>';
    article.insertBefore(tabBar,facts);
    article.classList.add('wtwV36OutcomeReady');showOutcomeFact(0);
  }
  if(moveGrid){
    const observer=new MutationObserver(prepareOutcome);
    observer.observe(moveGrid,{childList:true});
    prepareOutcome();
  }
  // At 125% zoom / shorter heights, switch game panels instead of cropping
  // their bottoms or enabling a scrollbar. The same real DOM/control nodes move
  // between focus views; nothing is cloned or dropped from the game state.
  const center=document.querySelector('.mid.decisionDeskShell');
  if(center && !center.querySelector('.wtwV36CenterTabs')){
    const tabs=document.createElement('nav');tabs.className='wtwV36CenterTabs';
    tabs.setAttribute('aria-label','Office view');
    tabs.innerHTML='<button type="button" data-wtw-center="decision">Decision + Factors</button><button type="button" data-wtw-center="intel">Intel Stack</button><button type="button" data-wtw-center="moves">Your Move</button>';
    center.insertBefore(tabs,center.querySelector('.wtwV35FeatureRow'));
  }
  if(right&&!right.querySelector('.wtwV36RightTabs')){
    const tabs=document.createElement('nav');tabs.className='wtwV36RightTabs';
    tabs.setAttribute('aria-label','Right rail view');
    tabs.innerHTML='<button type="button" data-wtw-right="fixtures">Races</button><button type="button" data-wtw-right="board">Stable</button><button type="button" data-wtw-right="opportunities">Offers</button><button type="button" data-wtw-right="wtwV36QuickPanel">Tools</button>';
    right.prepend(tabs);
  }
  function focusPage(group,name){
    if(group==='center'){
      center.dataset.wtwFocus=name;
      center.querySelectorAll('.wtwV36CenterTabs button').forEach(b=>{const yes=b.dataset.wtwCenter===name;b.classList.toggle('selected',yes);b.setAttribute('aria-pressed',String(yes));});
    } else if(group==='right'){
      right.dataset.wtwFocus=name;
      right.querySelectorAll('.wtwV36RightTabs button').forEach(b=>{const yes=b.dataset.wtwRight===name;b.classList.toggle('selected',yes);b.setAttribute('aria-pressed',String(yes));});
      right.querySelectorAll(':scope > .panel').forEach(p=>p.classList.toggle('wtwV36RightSelected',p.classList.contains(name)));
    }
  }
  focusPage('center','decision');focusPage('right','fixtures');
  const panels=[
    {key:'races',panel:'.right .fixtures',container:'.fixtureList',item:'.fixture',size:()=>innerHeight<690?6:2,prev:'Race Schedule previous',next:'Race Schedule next'},
    {key:'stable',panel:'.right .board',container:'.boardRows',item:'.rankRow',size:()=>innerHeight<690?6:3,prev:'Stable Board previous',next:'Stable Board next'},
    {key:'opportunities',panel:'.right .opportunities',container:'.oppList',item:'.oppItem',size:()=>innerHeight<690?3:1,prev:'Opportunity Board previous',next:'Opportunity Board next'}
  ];
  const actions=new Map();
  for(const p of panels){
    const panel=document.querySelector(p.panel);
    const container=panel?.querySelector(p.container);
    if(!panel||!container)continue;
    const parent=panel.querySelector('.panelArrows');
    if(!parent)continue;
    let index=0;
    const indicator=document.createElement('span');indicator.className='wtwV36PanelPage';indicator.setAttribute('aria-live','polite');parent.insertBefore(indicator,parent.firstChild);
    const update=()=>{
      const rows=[...container.querySelectorAll(':scope > '+p.item)];
      const size=p.size();const total=Math.max(1,Math.ceil(rows.length/size));
      index=(index+total)%total;
      rows.forEach((n,i)=>n.classList.toggle('wtwV36Hidden',Math.floor(i/size)!==index));
      indicator.textContent=`${index+1}/${total}`;
      const previous=parent.querySelector(`[data-act="${p.prev}"]`),next=parent.querySelector(`[data-act="${p.next}"]`);
      previous?.setAttribute('aria-label',`Previous ${p.key} page`);
      next?.setAttribute('aria-label',`Next ${p.key} page`);
    };
    actions.set(p.prev,()=>{index--;update()});actions.set(p.next,()=>{index++;update()});
    p.update=update;
    update();
  }
  // Capture these before the historical app handler: it had (incorrectly)
  // bound every sidebar arrow to changing the current Decision Desk case.
  window.addEventListener('click',e=>{
    const outcome=e.target.closest?.('[data-wtw-outcome]');
    if(outcome){
      e.preventDefault();e.stopImmediatePropagation();
      showOutcomeFact(Number(outcome.dataset.wtwOutcome));return;
    }
    const focus=e.target.closest?.('[data-wtw-center],[data-wtw-right]');
    if(focus){
      e.preventDefault();e.stopImmediatePropagation();
      if(focus.dataset.wtwCenter)focusPage('center',focus.dataset.wtwCenter);
      if(focus.dataset.wtwRight)focusPage('right',focus.dataset.wtwRight);
      return;
    }
    const pager=e.target.closest?.('.wtwV36InboxPrev,.wtwV36InboxNext');
    if(pager){
      e.preventDefault();e.stopImmediatePropagation();
      inboxPage += pager.classList.contains('wtwV36InboxNext')?1:-1;
      renderInbox();return;
    }
    const button=e.target.closest?.('[data-act]');if(!button)return;
    const action=button.getAttribute('data-act');
    if(actions.has(action)){
      e.preventDefault();e.stopImmediatePropagation();actions.get(action)();return;
    }
    if(action?.startsWith('Filter ')){
      // Original event handler updates hiddenByFilter in bubble phase.
      inboxPage=0;setTimeout(()=>renderInbox(false),0);
    }
  },true);
  let updateQueued=false;
  const mutationObserver=new MutationObserver(()=>{
    if(updateQueued||rendering)return;
    const rows=[...inbox.querySelectorAll('.msg')];
    const selection=rows.find(n=>n.classList.contains('selected'))?.dataset.case||null;
    const filter=rows.map(n=>n.classList.contains('hiddenByFilter')?'0':'1').join('');
    if(selection!==lastSelection||filter!==lastFilter){
      updateQueued=true;requestAnimationFrame(()=>{updateQueued=false;renderInbox(selection!==lastSelection)});
    }
  });
  mutationObserver.observe(inbox,{attributes:true,attributeFilter:['class'],subtree:true});
  window.addEventListener('resize',()=>{renderInbox();panels.forEach(p=>p.update?.())});
  body.classList.add('wtw-fm-v36');
  renderInbox();
})();
