// The current management UI and 1999 world use ONE active test suite.
// Obsolete tests for retired Office/Manager layouts are removed from the
// repository rather than kept as silent exclusions or alternate authorities.
import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const files=readdirSync(new URL('../tests/',import.meta.url))
 .filter(p=>p.endsWith('.test.mjs'))
 .map(p=>'tests/'+p).sort();
if(files.length<30)throw Error('Unexpectedly small current release test suite');
const proc=spawnSync(process.execPath,['--test',...files],{stdio:'inherit'});
if(proc.error)throw proc.error;
process.exit(proc.status??1);
