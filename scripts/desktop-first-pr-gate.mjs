#!/usr/bin/env node
/**
 * WTW commercial desktop-first PR gate.
 * The text declaration is mandatory; diff scan catches obvious new
 * hosted-game dependencies. Neither replaces actual packaged Windows QA.
 */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const eventFile=process.env.GITHUB_EVENT_PATH;
if(!eventFile)throw Error('GITHUB_EVENT_PATH is required (GitHub Actions PR event)');
const event=JSON.parse(fs.readFileSync(eventFile,'utf8'));
const pr=event.pull_request;
if(!pr)throw Error('Run only on a pull_request event');
const body=String(pr.body||'');
const required={
 'Desktop compatibility assessment':/desktop compatibility assessment\s*:\s*\S/i,
 'Local runtime and data':/local runtime and data\s*:\s*\S/i,
 'Save compatibility':/save compatibility\s*:\s*\S/i,
 'Network dependencies':/network dependencies\s*:\s*\S/i,
 'Offline verification':/offline verification\s*:\s*\S/i
};
const failures=[];
for(const [name,re] of Object.entries(required)){
 if(!re.test(body))failures.push('PR description must provide \"'+name+':\" with an actual assessment');
}
// Reject clearly unfilled boilerplate; honest NOT YET DESKTOP CERTIFIED is
// acceptable at this stage, while claiming a completed EXE test is not.
if(/(local runtime and data|network dependencies|offline verification)\s*:\s*(TODO|TBD|\.\.\.|\[fill\])/i.test(body))
 failures.push('Replace TODO/TBD/blank template fields with a concrete, honest assessment');

// New mandatory network calls in the shipping game are prohibited. The
// existing preview and D1 authoring infrastructure are outside these paths.
// False positives are resolved by changing the architecture, not hiding calls.
const base=String(pr.base?.ref||'main');
if(!/^[A-Za-z0-9._\/-]+$/.test(base))throw Error('Unsafe base ref');
let diff='';
try{
 diff=execFileSync('git',['diff','--unified=0',`origin/${base}...HEAD`,'--',
   'public/next/','public/1999/engine/','desktop/'],{encoding:'utf8',maxBuffer:10*1024*1024});
}catch(err){throw Error('Could not compare PR against base: '+err.message)}
let file='';
for(const line of diff.split(/\r?\n/)){
 if(line.startsWith('+++ b/')){file=line.slice(6);continue}
 if(!line.startsWith('+')||line.startsWith('+++'))continue;
 const added=line.slice(1);
 const forbidden=[
  /\bfetch\s*\(\s*['"`]\s*(?:https?:\/\/|\/api\/)/i,
  /\bnew\s+(?:WebSocket|EventSource)\s*\(\s*['"`]\s*(?:https?:\/\/|wss?:\/\/|\/api\/)/i,
  /\b(?:src|href)\s*=\s*['"]\s*https?:\/\//i,
  /\bimport\s+['"]https?:\/\//i,
  /\b(?:@import|url)\s*\(?\s*['"]?https?:\/\//i
 ];
 if(forbidden.some(re=>re.test(added))){
  failures.push(`New hosted dependency in ${file}: ${added.trim().slice(0,160)}`);
 }
}
if(failures.length){
 console.error('WIRE TO WIRE — DESKTOP-FIRST PR CONTRACT FAILED');
 for(const [i,v] of failures.entries())console.error(`${i+1}. ${v}`);
 console.error('Read AGENTS.md and docs/engineering/WTW_DESKTOP_WORKSTREAM_HANDOFF.md.');
 process.exit(1);
}
console.log('WTW_DESKTOP_PR_POLICY_PASS — declaration complete; no obvious new remote gameplay dependency in diff');
console.log('This is NOT a Windows/offline build certification. See issue #180.');
