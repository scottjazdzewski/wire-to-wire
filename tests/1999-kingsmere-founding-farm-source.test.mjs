import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const founding=JSON.parse(readFileSync(
 new URL('../public/data/wtw-1999-founding-directory-v1.json',import.meta.url),'utf8'));
const ui=readFileSync(new URL('../public/next/next.js',import.meta.url),'utf8');

test('Kingsmere Farm remains a distinct approved founding-world identity, not a generated alias',()=>{
 const org=founding.organizations.find(x=>x.id==='O-000061');
 assert.equal(org?.name,'Kingsmere Farm');
 assert.match(org.type,/FARM/);
 assert.match(org.locationLabel,/Versailles/);
 assert.equal(founding.horses.length,73);
 const horses=founding.horses.filter(h=>h.farmOrganizationId===org.id||
  h.standingFarm1999?.farmOrganizationId===org.id);
 assert.deepEqual(horses.map(h=>h.name).sort(),
  ['Butter Crock','Faye Window','Heyday','Lila Quarry','Sunrise Box'].sort());
 assert.equal(horses.filter(h=>h._role==='stallion').length,1);
 assert.equal(horses.filter(h=>h._role==='broodmare').length,4);
 assert.equal(new Set(horses.map(h=>h.id)).size,5);
});
test('Stable offers explicit founding-farm view by permanent organization and horse IDs',()=>{
 assert.match(ui,/approvedFoundingFarmStableRosterView/);
 assert.match(ui,/x\.id===approvedWorkplaceId/);
 assert.match(ui,/world1999Data\?\.organizations\?\.find/);
 assert.match(ui,/h\.farmOrganizationId===id\|\|h\.standingFarm1999\?\.farmOrganizationId===id/);
 assert.match(ui,/saved-stable-founding-horse/);
 assert.match(ui,/openWorld1999Entity\('horse:'\+found\.id\)/);
 assert.match(ui,/APP\.savedStableIgnoreDefaultEmployer/);
 assert.match(ui,/They are not invented 1999 race starters|not invented 1999 race starters/);
 assert.doesNotMatch(ui,/name==='Kingsmere Farm'&&.*\.slice\(0,30\)/);
});
