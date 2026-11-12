// Active 1999 release checks. Stale pre-1999 static Office snapshots are
// retained as archival references but cannot substitute for Chromium UI QA.
import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const obsolete=new Set([
 'approved-badges-v2.test.mjs',
 'fm-management-screen-family.test.mjs',
 'manager-v2-independent.test.mjs',
 'next-office-v6.test.mjs',
 'next-office-v7.test.mjs',
 'office-pedigree-existing-tab.test.mjs',
 'office-single-visual-layer.test.mjs',
 'office-v30-site.test.mjs',
 'site-main-promotion.test.mjs',
 'ui-canonical-style.test.mjs'
]);
const files=readdirSync(new URL('../tests/',import.meta.url))
 .filter(p=>p.endsWith('.test.mjs')&&!obsolete.has(p))
 .map(p=>'tests/'+p).sort();
if(files.length<30)throw Error('Unexpectedly small current release test suite');
const proc=spawnSync(process.execPath,['--test',...files],{stdio:'inherit'});
if(proc.error)throw proc.error;
process.exit(proc.status??1);
