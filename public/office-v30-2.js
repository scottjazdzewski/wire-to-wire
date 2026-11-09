
(function(){
  function btn(txt, act){ const b=document.createElement('button'); b.type='button'; b.textContent=txt; b.setAttribute('data-act',act); return b; }
  function addHeaderArrows(panelSel, base){
    const head = document.querySelector(panelSel + ' .panelHead');
    if(!head || head.querySelector('.panelArrows')) return;
    const wrap=document.createElement('span'); wrap.className='panelArrows';
    wrap.appendChild(btn('‹', base + ' previous'));
    wrap.appendChild(btn('›', base + ' next'));
    head.appendChild(wrap);
  }
  function addPager(panelSel, base, pages=3){
    const panel=document.querySelector(panelSel);
    if(!panel || panel.querySelector(':scope > .pager')) return;
    const pager=document.createElement('div'); pager.className='pager';
    pager.appendChild(btn('«', base + ' first page'));
    pager.appendChild(btn('‹', base + ' previous page'));
    for(let i=1;i<=pages;i++){
      const n=document.createElement('span'); n.className='pgNum' + (i===1?' active':''); n.textContent=String(i); n.setAttribute('data-act',base+' page '+i); pager.appendChild(n);
    }
    pager.appendChild(btn('›', base + ' next page'));
    pager.appendChild(btn('»', base + ' last page'));
    panel.appendChild(pager);
  }
  addPager('.messages','Messages',3);
  addHeaderArrows('.decisionDesk','Decision Desk');
  addHeaderArrows('.intelPanel','Intel Stack');
  addHeaderArrows('.movePanel','Your Move');
  addHeaderArrows('.fixtures','Race Schedule');
  addPager('.fixtures','Race Schedule',3);
  addHeaderArrows('.board','Stable Board');
  addPager('.board','Stable Board',3);
  addHeaderArrows('.opportunities','Opportunity Board');
  addPager('.opportunities','Opportunity Board',3);
  document.querySelectorAll('.pager .pgNum').forEach(n=>{
    n.addEventListener('click', e=>{
      const p=n.closest('.pager'); if(!p) return;
      p.querySelectorAll('.pgNum').forEach(x=>x.classList.remove('active'));
      n.classList.add('active');
    });
  });
})();
