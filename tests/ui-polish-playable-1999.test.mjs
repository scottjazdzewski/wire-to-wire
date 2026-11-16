import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const ui=read('public/next/next.js');
const css=read('public/next/next.css');
const qa=read('scripts/ui-polish-playable-1999-browser-cdp.mjs');

test('live track links open canonical source IDs, never dormant Office fixtures',()=>{
 const begin=ui.indexOf("if(key==='track'){");
 const end=ui.indexOf("if(key==='answer-decision')",begin);
 assert.ok(begin>0&&end>begin);
 const handler=ui.slice(begin,end);
 assert.match(handler,/world1999Entry\('track:'\+val\)/);
 assert.match(handler,/world1999Match\('track',val\)/);
 assert.match(handler,/openWorld1999Entity\(match.worldKey\)/);
 assert.match(handler,/openMenu\('Tracks'\)/);
 assert.doesNotMatch(handler,/bridgeNode|\.right \.fixture/);
});

test('Calendar venue name links open canonical Track Profiles before other record search',()=>{
 const a=ui.indexOf("function openEntityRecord(name,preferred='',row=null){");
 const b=ui.indexOf("function ",a+15);
 assert.ok(a>0&&b>a);
 const block=ui.slice(a,b);
 assert.match(block,/if\(preferred==='track'\)/);
 assert.match(block,/world1999Match\('track',name\)/);
 assert.match(block,/openWorld1999Entity\(venue.worldKey\)/);
 assert.ok(block.indexOf("if(preferred==='track')")<block.indexOf('entitySourceMatch('),
  'Legacy Office search must not steal Calendar Track links');
});

test('Office Race Schedule visible rows no longer target retired fixtureList DOM',()=>{
 const begin=ui.indexOf("if(key==='fixture'){");
 const end=ui.indexOf("if(key==='track'){",begin);
 assert.ok(begin>0&&end>begin);
 const action=ui.slice(begin,end);
 assert.match(action,/racingRows\(\)\[Number\(val\)\]/);
 assert.match(action,/stableHorsePreview/);
 assert.match(action,/openEntityRecord\(target.name,'horse'\)/);
 assert.doesNotMatch(action,/fixtureList|bridgeNode/);
 assert.match(ui,/class="ng-entryrow" aria-label="Open race target/);
});

test('Stable first paints quick but retains explicit All Columns choice at 1024',()=>{
 assert.match(ui,/stableMode:'auto'/);
 assert.match(ui,/APP\.stableMode==='auto'\?\(window\.innerWidth<=1080\?'compact':'all'\)/);
 assert.match(ui,/if\(key==='stable-mode'\)\{APP\.stableMode=val;return paint\(\)\}/);
 const narrow=css.slice(css.indexOf('/* UI Window 4:'));
 assert.match(narrow,/@media \(min-width:781px\) and \(max-width:1080px\)/);
 assert.match(narrow,/ng-rs-table\.compact/);
 assert.match(narrow,/nth-child\(15\)/);
 assert.match(qa,/1024,768/);
});

test('release capture covers three actual laptop sizes and approved four tracks',()=>{
 for(const v of ['1440,900','1280,720','1024,768'])assert.ok(qa.includes(v));
 for(const id of ['T-0002','T-0013','T-0014','T-0003'])assert.ok(qa.includes('WorldRecord:track:'+id));
 assert.match(qa,/start-test-career/);
 assert.match(qa,/Page.captureScreenshot/);
});
