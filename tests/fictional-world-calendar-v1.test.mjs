import test from 'node:test';
import assert from 'node:assert/strict';
import {buildFictional1999RaceCalendar} from '../public/1999/engine/fictional-world-calendar-v1.mjs';
test('1999 game-modeled cards use the real local meet schedule, with unentered fields',()=>{
 const c=buildFictional1999RaceCalendar([{id:'T-0001',name:'Aqueduct'}]);
 assert.ok(c.cards.length>30);
 assert.equal(c.summary.scheduledRaces,c.cards.length*8);
 assert.ok(c.cards.every(card=>card.races.every(r=>r.fieldHorseIds.length===0&&
  r.winnerId===null&&r.status==='SCHEDULED')));
 assert.equal(c.unprogrammedTrackIds.length,0);
 assert.ok(c.cards.every(card=>card.date.startsWith('1999-')));
});
test('unprogrammed tracks are reported, not assigned fabricated meet dates',()=>{
 const c=buildFictional1999RaceCalendar([{id:'T-UNKNOWN',name:'Unknown Track'}]);
 assert.deepEqual(c.unprogrammedTrackIds,['T-UNKNOWN']);
 assert.equal(c.cards.length,0);
});
