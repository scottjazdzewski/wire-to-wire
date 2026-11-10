import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const get=x=>fs.readFileSync(path.join(root,x),'utf8');

test('Next Office v3 remains one working visual system backed by the existing engine',()=>{
 const html=get('public/next/index.html'),css=get('public/next/next.css'),js=get('public/next/next.js');
 assert.equal((html.match(/<link\s+rel="stylesheet"/g)||[]).length,1);
 assert.match(html,/href="\/next\/next\.css"/);
 assert.ok(!css.includes('@import'));
 assert.match(css,/UNIFIED DESKTOP MANAGEMENT DESIGN SYSTEM/,'One rebuilt canonical FM/OOTP application stylesheet');
 assert.ok(js.includes('wtwOfficeStateV30'), 'Continue using original save namespace');
 for(const name of ['header','inbox','center','right']){
   assert.ok(js.includes('function '+name+'()'),name+' should render a working office region');
 }
 for(const name of ['ng-rosterrow','ng-entryrow','ng-msg','ng-move']){
   assert.ok(js.includes(name),name+' is missing from the live view');
 }
 for(const name of ['horse','track','case','move','action']){
   assert.ok(js.includes("key==='"+name+"'"),name+' must remain a navigable action');
 }
 assert.ok(js.includes('function calendarTimeline(races,nonraces)'), 'Keep connected calendar');
 assert.ok(js.includes('const glyph='), 'Use scalable icons');
 const syntax=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
});
