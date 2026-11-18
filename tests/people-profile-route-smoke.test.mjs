import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=filename=>fs.readFileSync(path.join(root,filename),'utf8');

test('People Overview safely renders a linked horse and provides a working original-record action',()=>{
 const js=read('public/next/next.js');
 const begin=js.indexOf('  const horseAssignments=()=>{');
 const end=js.indexOf('  const careerOverview=',begin);
 assert.ok(begin>0&&end>begin,'People horse roster is present in actual production page renderer');
 const fragment=js.slice(begin,end);
 // Execute the production template itself, rather than asserting that a marker
 // or stylesheet exists. This failed when a single DOM Element was used with
 // Array#indexOf and made the Gabe Larkin profile fail to open.
 const render=new Function('sourceLinks','$','$$','horseOwnership','horseOwnerBadge','state','safe','glyph','entityReferenceButton',
  fragment+'\nreturn horseAssignments();');
 const horseButton={textContent:'Powerline'};
 const horseItem={textContent:'Powerline',button:horseButton};
 const single=(query,scope)=>query==='button[data-act]'?scope?.button||null:null;
 const many=query=>query==='#routeBody [data-act]'?[horseButton]:[];
 const owner=()=>null;
 const badge=()=>'<span class="ng-horse-owner-badge">?</span>';
 const state=()=>({horseState:{Powerline:{status:'Work'}}});
 const escape=s=>String(s);
 const glyph=()=>'<svg aria-hidden="true"></svg>';
 const entityLink=(name,kind)=>'<button data-ng="named-entity" data-kind="'+kind+'">'+name+' ↗</button>';
 const html=render([horseItem],single,many,owner,badge,state,escape,glyph,entityLink);
 assert.ok(html.includes('data-ng="sourcebutton" data-val="0"'),'Linked horse uses its existing original-action index');
 assert.ok(html.includes('Powerline')&&html.includes('Work'),'Actual linked horse/status are shown immediately');
 assert.ok(html.includes('Owner not recorded'),'Unknown owner stays explicit and unassigned');
 assert.ok(html.includes('ng-horse-owner-badge'),'Approved reusable owner badge occupies the roster position');
 const orphan=render([horseItem],single,()=>[],owner,badge,state,escape,glyph,entityLink);
 assert.ok(orphan.includes('data-ng="named-entity"'),'Missing source action still opens its own clearly marked unregistered-profile preview');
 const empty=render([],single,many,owner,badge,state,escape,glyph,entityLink);
 assert.ok(empty.includes('No linked horses recorded.'),'Empty legitimate records get an honest no-data state');
 const namedOwner=render([horseItem],single,many,()=>({name:'Kingsmere'}),badge,state,escape,glyph,entityLink);
 assert.ok(namedOwner.includes('data-kind="connection"'),'Owner opens independently of the horse profile');
});

test('People direct URLs, internal search and entity directories all use the same real profile route',()=>{
 const office=read('public/office-v30-4.js');
 const next=read('public/next/next.js');
 assert.match(office,/'Gabe Larkin':[^\n]*job:'Stable staff'/,'Tested personnel record is in the actual Office universe');
 assert.ok(office.includes("if(page==='person'&&name){openPersonProfile(name);return;}"),'Direct person URLs restore actual source profiles');
 assert.ok(office.includes("if(kind==='person'&&Object.prototype.hasOwnProperty.call(personProfiles,name)){openPersonProfile(name);return true;}"),'Search opens the same real People route');
 assert.ok(next.includes("APP.custom='';APP.moreOpen=false;"),'Navigating from Search clears the directory overlay');
 assert.ok(next.includes("const route=APP.custom?null:currentRoute()"),'Actual person route takes priority once search is dismissed');
 assert.ok(next.includes("const source=$('#routeBody .profilePage')"),'Visible profile derives from original Office route content');
});
