#!/usr/bin/env node
/**
 * Mirrors the canonical Node gameplay modules into public/1999/game so the
 * static Cloudflare site executes the SAME game rules. No second simulator.
 * Run without flags to sync; --check fails CI on every source/browser drift.
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const modules=[
 'contracts.js','rng.js','attribute-contract.js','reputation.js',
 'facility-operations.js','ownership.js','horse-registration.js',
 'horse-starting-attributes.js','horse-care.js','daily-agents.js',
 'racing-1999.js','race-agents-1999.js','people-generator.js',
 'facility-market-1999.js','state.js','kernel.js','persistence.js',
 'selectors.js','horse-connections.js','1999-pilot-fixture.js','index.js'
];
const check=process.argv.includes('--check');
let mismatched=0;
for(const file of modules){
 const original=readFileSync(resolve(root,'src/game',file),'utf8');
 const expected=original.replaceAll('../../public/1999/engine/','../engine/')
  .replaceAll('../../public/next/','../../next/');
 const destination=resolve(root,'public/1999/game',file);
 let actual=null;
 try{actual=readFileSync(destination,'utf8')}catch{}
 if(actual!==expected){
  console.error('WTW BROWSER GAMEPLAY DRIFT: '+file);
  mismatched++;
  if(!check){mkdirSync(dirname(destination),{recursive:true});
   writeFileSync(destination,expected)}
 }
}
const source=readFileSync(resolve(root,'data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json'),'utf8');
const target=resolve(root,'public/data/wtw-1999-playtest-cohort-38-v1.json');
let current=null;try{current=readFileSync(target,'utf8')}catch{}
if(current!==source){
 mismatched++;console.error('WTW PLAYTEST MANIFEST DRIFT');
 if(!check)writeFileSync(target,source);
}
if(check&&mismatched)process.exit(1);
console.log(check?'PASS: Browser gameplay mirrors Node modules and isolated manifest exactly':
 'Synced '+modules.length+' gameplay modules and provisional playtest manifest');
