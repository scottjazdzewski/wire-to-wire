
(function(){
  function cleanup(){
    document.querySelectorAll('.pager').forEach(pager=>{
      pager.querySelectorAll('.pgNum').forEach(n=>n.remove());
      Array.from(pager.querySelectorAll('button')).forEach(btn=>{
        const t = btn.textContent.trim();
        if(t === '«' || t === '»') btn.remove();
        if(t === '‹') btn.setAttribute('aria-label','Previous');
        if(t === '›') btn.setAttribute('aria-label','Next');
      });
    });
    document.querySelectorAll('.fixtures > .pager, .board > .pager, .opportunities > .pager').forEach(p=>p.remove());
    document.querySelectorAll('.panelArrows button').forEach(btn=>{
      const t=btn.textContent.trim();
      if(t==='‹') btn.setAttribute('aria-label','Previous');
      if(t==='›') btn.setAttribute('aria-label','Next');
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cleanup);
  else cleanup();
  setTimeout(cleanup, 50);
})();
