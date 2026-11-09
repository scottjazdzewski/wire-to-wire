/* v34 layout-only shell correction. Retains existing page routing and canonical state. */
(() => {
  'use strict';
  const body=document.body;
  if (!body || !body.classList.contains('wtw-fm-v33') || body.classList.contains('wtw-fm-v34')) return;
  const header=document.querySelector('.top');
  const primary=header?.querySelector('.wtwPrimaryBar');
  const secondary=header?.querySelector('.wtwSecondaryBar');
  const actions=header?.querySelector('.wtwPrimaryActions');
  if (!primary || !secondary || !actions) return;
  const back=actions.querySelector('button[data-act="Back"]');
  const forward=actions.querySelector('button[data-act="Forward"]');
  if (back || forward) {
    const history=document.createElement('nav');
    history.className='wtwHistoryNav';
    history.setAttribute('aria-label','Page history');
    if (back) history.appendChild(back);
    if (forward) history.appendChild(forward);
    secondary.insertBefore(history,secondary.querySelector('.wtwUtilityActions'));
  }
  primary.querySelector('.nav')?.setAttribute('aria-label','Primary game navigation');
  secondary.querySelector('.subnav')?.setAttribute('aria-label','Office tools and calendar');
  // Preserve the full Opportunity Board page label; use a shorter navigation heading
  // so that review link and previous/next arrows never compete for the same pixels.
  const opportunityHeading=document.querySelector('.opportunities .panelTitle');
  if (opportunityHeading) {
    const label=Array.from(opportunityHeading.childNodes).find(n=>n.nodeType===Node.TEXT_NODE && n.textContent.trim());
    if (label) label.textContent='Opportunities';
    const openAll=opportunityHeading.parentElement?.querySelector('.link[data-act="Open opportunity board"]');
    if (openAll) {openAll.textContent='All';openAll.title='Review all opportunities';openAll.setAttribute('aria-label','Review all opportunities');}
  }
  document.querySelectorAll('.panelHead').forEach(head=>{
    if (!head.hasAttribute('aria-label')) {
      const title=head.querySelector('.panelTitle')?.textContent?.trim();
      if(title)head.setAttribute('aria-label',title);
    }
  });
  body.classList.add('wtw-fm-v34');
})();