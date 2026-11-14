import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ui=read('public/next/next.js');
const html=read('public/next/index.html');
const office=read('public/office-v30-4.js');
const browser=read('scripts/1999-management-browser-smoke.sh');
const start=ui.indexOf('function managerRecordViewControl(');
const end=ui.indexOf('\nfunction managerDashboard(){',start);
assert.ok(start>0&&end>start,'News and World must reuse canonical manager controls');
const functions=ui.slice(start,end);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[c]);
const mk=(section,page,notes)=>{
 const APP={section,page};
 const tabmap={Office:['Overview','Messages','News','Decisions'],
  World:['Overview','1999 Horses','People','Organizations','Tracks','Major Races','News']};
 return new Function('safe','glyph','tabmap','currentMessages','depGameDay','APP',
  functions+'\nreturn {managerRecordViewControl,sourceNewsDesk};')(
  esc,()=>'<svg aria-hidden="true"></svg>',tabmap,()=>notes,
  ()=>'1999-01-01',APP);
};

test('World overview and World race files no longer click the hidden 2014 Office directory',()=>{
 const nav=ui.slice(ui.indexOf('function openMenu('),ui.indexOf('\nlet engineDecisions=',ui.indexOf('function openMenu(')));
 assert.match(nav,/if\(section==='Stable'\|\|section==='World'\|\|DEP_NAMES\.has\(section\)\)/);
 assert.match(nav,/openCustomView\(section\+' — Overview',section,'Overview'\)/);
 assert.match(nav,/if\(s==='World'&&\(name==='Overview'\|\|name==='Major Races'\|\|name==='News'\)\)/);
 assert.match(nav,/openCustomView\('World — '\+name,'World',name\)/);
 assert.match(nav,/if\(name==='News'\)return openCustomView\('Office — News','Office','News'\)/);
 assert.doesNotMatch(nav,/bridgeNode\(originalAct\('News'\)\)/);
 assert.doesNotMatch(nav,/bridgeNode\(originalAct\('World'\)\)/);
});

test('world directory preview includes every source category without rendering unbounded full population',()=>{
 const body=ui.slice(ui.indexOf('function managerDashboard(){'),ui.indexOf('\nfunction open1999Race('));
 assert.match(body,/World:\{kinds:\['horse','person','farm','track','race'\]/);
 assert.match(body,/const all=section==='World'&&page==='Overview'&&isClean1999\(\)\?/);
 assert.match(body,/world1999Entries\(\):globalSearchItems\(\)/);
 assert.match(body,/visibleItems=section==='World'&&page==='Overview'\?/);
 assert.match(body,/items\.filter\(row=>row\.kind===kind\)\.slice\(0,20\)/);
 assert.match(body,/visibleItems\.length\+' OF '\+items\.length\+' SOURCE RECORDS/);
 assert.match(body,/const records=visibleItems\.map/);
 assert.match(body,/managerRecordViewControl\(section,page\)/);
});

test('News uses the same record-view dropdown as the established management dashboards',()=>{
 const common=mk('World','News',[]);
 const select=common.managerRecordViewControl('World','News');
 const news=common.sourceNewsDesk();
 assert.match(news,/ng-manager-screen ng-news-screen/);
 assert.match(news,/ng-manager-head/);
 assert.match(news,/ng-manager-workspace/);
 assert.match(news,/ng-manager-primary/);
 assert.match(news,/ng-manager-sidebar/);
 assert.match(news,/ng-manager-secondary/);
 assert.match(news,/data-ng-select="manager-screen"/);
 assert.ok(news.includes(select));
 assert.match(select,/<option value="News" selected>News<\/option>/);
 assert.match(news,/VERIFIED EXTERNAL NEWS/);
 assert.match(news,/NOT CONNECTED/);
 assert.match(news,/No verified external racing-news feed is connected/);
 assert.doesNotMatch(news,/Argosy colt buzz building|Pieta gallop-out report/);
});

test('News lists only actual Office messages with working case links and clear provenance',()=>{
 const notes=[{
  case:'opening-stakes',from:'Racing Secretary',title:'Opening stakes',
  meta:'No entries recorded'
 },{
  case:'opening-breeding',from:'Breeding Office',title:'Breeding status',
  meta:'No declared matings'
 }];
 const view=mk('Office','News',notes).sourceNewsDesk();
 assert.equal((view.match(/class="ng-manager-row"/g)||[]).length,2);
 assert.ok(view.includes('data-ng="case" data-val="opening-stakes"'));
 assert.ok(view.includes('data-ng="case" data-val="opening-breeding"'));
 assert.match(view,/2 SOURCE-LINKED MESSAGES/);
 assert.match(view,/IN-GAME OFFICE BRIEFINGS/);
 assert.match(view,/internal game correspondence, not published news articles/);
 assert.doesNotMatch(view,/Argosy|Pieta|Powerline/);
 const injection=mk('Office','News',[{
  case:'open" onclick="bad()',title:'<script>fake</script>',from:'<b>source</b>',meta:'x'
 }]).sourceNewsDesk();
 assert.doesNotMatch(injection,/<script>fake<\/script>|onclick="bad\(\)"/);
});

test('News remains empty rather than making up a racing feed when source briefings are unavailable',()=>{
 const out=mk('World','News',[]).sourceNewsDesk();
 assert.match(out,/No Office briefings are currently recorded/);
 assert.match(out,/0 SOURCE-LINKED MESSAGES/);
 assert.match(out,/data-ng="search-history"/);
 assert.match(out,/HISTORY VAULT/);
});

test('one 1999 UI asset and canonical News renderer, no additional stylesheet or application',()=>{
 assert.match(html,/\/next\/next\.js\?rev=wtw1999-track-profile-permanent-20261114/);
 assert.match(ui,/else if\(APP\.custom==='Office — News'\|\|APP\.custom==='World — News'\)\{body=sourceNewsDesk\(\)\}/);
 assert.equal((html.match(/rel="stylesheet"/g)||[]).length,1);
 assert.doesNotMatch(functions,/querySelector|\.app \[data-act\]|document\.createElement/);
 assert.match(office,/function openWorldDirectory\(\)/); // old data bridge intact but never used for 1999 World navigation
});


test('real 1999 browser smoke keeps complete People/Tracks checks with the shared World selector',()=>{
 assert.match(browser,/select\[data-ng-select="manager-screen"\]/);
 assert.match(browser,/worldPeopleView\.value='People'/);
 assert.match(read('scripts/desktop-visual-audit.sh'),/worldPreviewSourceOnly/);
 assert.match(browser,/worldTracksView\.value='Tracks'/);
 assert.match(browser,/worldView\.value='News'/);
 assert.match(browser,/World News uses current source-backed Office briefings/);
 assert.match(browser,/Site track registry mismatch/);
 assert.match(browser,/1999 world person source row is navigable/);
 assert.doesNotMatch(browser,/const worldPeopleTab=\[/);
 assert.doesNotMatch(browser,/const worldTracksTab=\[/);
});


test('News variant uses the SAME full-width manager container as World, not a half-width generic route',()=>{
 const news=mk('World','News',[]).sourceNewsDesk();
 assert.match(news,/^<section class="ng-manager-screen ng-news-screen">/);
 assert.match(ui,/isManager=body\.startsWith\('<section class="ng-manager-screen'\)/);
 assert.match(ui,/isManager\?'ng-route-manager'/);
 // Shared CSS selector .ng-route-manager owns the full-width management stage.
 // The additional ng-news-screen class is only a variant, never a new layout.
 assert.doesNotMatch(ui,/isManager=body\.startsWith\('<section class="ng-manager-screen">'\)/);
 assert.match(news,/<strong>RACING NEWS STATUS<\/strong><span>NOT CONNECTED<\/span>/);
 assert.match(news,/PRIORITY BRIEFINGS/);
 assert.equal((news.match(/class="ng-manager-metric"/g)||[]).length,4);
});
