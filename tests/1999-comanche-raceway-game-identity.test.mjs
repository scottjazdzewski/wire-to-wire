import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {trackProgram1999} from '../public/next/1999-track-program.mjs';
import {createFoundingSourceBase1999} from '../public/1999/engine/founding-source-base-1999.mjs';
import {openingWorld1999 as canon} from '../public/1999/engine/canon-mini.mjs';

const directory=JSON.parse(readFileSync(new URL('../public/data/wtw-1999-founding-directory-v1.json',import.meta.url),'utf8'));

test('Comanche Raceway is a gameplay name, not an invented real-history replacement',()=>{
 const program=trackProgram1999('T-0061');
 assert.equal(program.name,'Sunland Park');
 assert.equal(program.gameDisplayName,'Comanche Raceway');
 const source=canon.tracks.find(t=>t.id==='T-0061');
 assert.equal(source?.name,'Sunland Park');
 const base=createFoundingSourceBase1999();
 const projected=Array.from({length:base.counts.tracks},(_,i)=>base.trackAt(i))
  .find(t=>t.id==='T-0061');
 assert.equal(projected?.name,'Comanche Raceway');
 assert.equal(projected?.historicalName,'Sunland Park');
 assert.equal(projected?.sourceTrackId,'T-0061');
 assert.equal(projected?.location.city,'Sunland Park');
 assert.equal(projected?.playableIn1999,true);
 const founding=directory.tracks.find(t=>t.id==='T-0061');
 assert.equal(founding?.name,'Sunland Park');
 assert.equal(founding?.gameDisplayName,'Comanche Raceway');
});
