import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../public/next/next.js',import.meta.url),'utf8');
const roster=source.slice(source.indexOf('function liveStableRosterView(directory=false){'),
 source.indexOf('\nfunction functionalRoute(route){'));
test('Stable and World Horse Directory share the identical 17-column roster renderer',()=>{
 assert.match(source,/if\(section==='World'&&page==='1999 Horses'\)return liveStableRosterView\(true\)/);
 assert.match(source,/if\(section==='Stable'&&\(page==='Overview'\|\|page==='Horses'\)\)return liveStableRosterView\(\)/);
 assert.match(roster,/const columns=\[\['name','HORSE'\]/);
 assert.match(roster,/\['activity','CURRENT ACTIVITY'\]\]/);
 assert.match(roster,/const sortKey=directory\?APP\.directorySort:APP\.stableSort/);
 assert.match(roster,/const stableCriteria=window\.WTW1999RosterFilters\?\.get\(APP,scope\)/);
 assert.match(roster,/const mode=directory\?APP\.directoryMode:APP\.stableMode/);
 assert.match(roster,/data-ng="'\+\(directory\?'directory-sort':'stable-sort'\)/);
 assert.match(roster,/data-ng="'\+\(directory\?'directory-horse':'horse'\)/);
});
test('Directory uses world roster rather than personal stable and has separate search/sort state',()=>{
 assert.match(source,/function worldDirectoryHorseRows\(\)/);
 assert.match(source,/adapter\.worldHorseBrowse\(\{offset:0,limit:Math\.max\(160,total\),sort:'name'\}\)/);
 assert.match(roster,/const horses=directory\?universe\.items:horseRows\(\)/);
 assert.match(source,/directorySearch:'',directoryHorseItems:\[\]/);
 assert.match(source,/if\(key==='directory-sort'\)/);
 assert.match(source,/if\(key==='directory-horse'\)/);
 assert.match(source,/input\[data-ng-input="directory-search"\]/);
});
