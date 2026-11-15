import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createNamingFeedback,validateNamingFeedback,recordNamingFeedback,
 excludedNamingFeedbackNames,savedNamingBank,namingTasteScore,rankNamingCandidates}
 from '../src/game/horse-naming-feedback-v489.js';
import {createNamingFeedback as browserNew,rankNamingCandidates as browserRank}
 from '../public/1999/game/horse-naming-feedback-v489.js';
import {createNamingDeskController} from '../public/next/1999-naming-desk.mjs';

const story='The night the colt was born, a thunderstorm knocked out the electricity. The rain struck the gate and an old bell rang while the mare remained calm and quiet in the dark barn.';
const fields={ownerName:'Test Owner',breederName:'Test Breeder',story,foalingYear:'1996'};
const samples=[
 {name:'A Brief Encounter',originMotif:'wildlife'},
 {name:'Night Courier',originMotif:'night'},
 {name:'First Light',originMotif:'sun'}
];

test('V489 feedback is versioned, deterministic, mirrored, and derives styles from decisions',async()=>{
 const a=await readFile(new URL('../src/game/horse-naming-feedback-v489.js',import.meta.url),'utf8');
 const b=await readFile(new URL('../public/1999/game/horse-naming-feedback-v489.js',import.meta.url),'utf8');
 assert.equal(a,b);
 const zero=createNamingFeedback();
 assert.deepEqual(zero,browserNew());
 const kept=recordNamingFeedback(zero,{name:'Night Courier',decision:'KEEP',motifId:'night',prompt:'short poetic names'});
 const rejected=recordNamingFeedback(kept,{name:'A Brief Encounter',decision:'REJECT',motifId:'wildlife'});
 const chosen=recordNamingFeedback(rejected,{name:'First Light',decision:'CHOOSE',motifId:'sun',horseId:'H-GAME-1999-A001'});
 assert.equal(chosen.revision,3);
 assert.deepEqual(savedNamingBank(chosen),['Night Courier']);
 assert.deepEqual(excludedNamingFeedbackNames(chosen),['A Brief Encounter','First Light']);
 assert.deepEqual(browserRank(samples,chosen),rankNamingCandidates(samples,chosen));
 assert.ok(namingTasteScore(chosen,samples[2])>namingTasteScore(chosen,samples[0]));
 assert.equal(chosen.events[0].prompt,'short poetic names');
 assert.equal(validateNamingFeedback(chosen),chosen);
 assert.deepEqual(chosen,JSON.parse(JSON.stringify(chosen)));
});

test('permanent rejects cannot be reused, and accepted names cannot move horses',()=>{
 const a=recordNamingFeedback(createNamingFeedback(),{name:'Trouble Already',decision:'REJECT',motifId:'personality'});
 assert.throws(()=>recordNamingFeedback(a,{name:'Trouble Already',decision:'KEEP'}),/permanently rejected/i);
 assert.throws(()=>recordNamingFeedback(createNamingFeedback(),{name:'Nightjar',decision:'CHOOSE'}),/actual horse ID/);
 const b=recordNamingFeedback(createNamingFeedback(),{name:'Nightjar',decision:'CHOOSE',horseId:'H-GAME-1999-0003'});
 assert.throws(()=>recordNamingFeedback(b,{name:'Nightjar',decision:'CHOOSE',horseId:'H-GAME-1999-0004'}),/cannot be reassigned/);
 assert.throws(()=>recordNamingFeedback(b,{name:'Other Horse',decision:'CHOOSE',horseId:'H-GAME-1999-0003'}),/already has a selected name/);
 assert.throws(()=>validateNamingFeedback({...a,revision:9}),/Invalid saved/);
 assert.throws(()=>validateNamingFeedback({...a,decisions:{}}),/differ from event history/);
});

test('Naming Desk uses dense list and persists Keep / Reject / Choose through the same saved-career adapter',()=>{
 let saved=createNamingFeedback(),writes=0;
 const target=[{id:'H-GAME-1999-0001',name:'Unnamed Foal'}];
 const desk=()=>createNamingDeskController({
  loadFeedback:()=>saved,
  saveFeedback:(next,expected)=>{
   assert.equal(saved.revision,expected);
   saved=next;writes++;return next;
  },
  getTargets:()=>target
 });
 let d=desk();
 for(const [name,value] of Object.entries(fields))d.setField(name,value);
 d.setField('direction','short and understated one word');
 d.setField('targetHorseId',target[0].id);
 assert.equal(d.generate(),true);
 const suggestions=d.snapshot().results.filter(r=>r.status==='AWAITING_INDEPENDENT_EDITOR');
 assert.ok(suggestions.length>=3,'need three distinct proposals for choices');
 assert.match(d.render(),/<table class="ng-naming-table">/);
 assert.match(d.render(),/CHOOSE FOR THIS HORSE/);
 assert.match(d.render(),/KEEP/);
 assert.match(d.render(),/REJECT/);
 assert.equal(d.mark(suggestions[0].name),true);
 assert.equal(d.reject(suggestions[1].name),true);
 assert.equal(d.choose(suggestions[2].name),true);
 assert.equal(saved.revision,3);
 assert.equal(writes,3);
 assert.ok(d.render().includes('KEPT FOR LATER'));
 assert.ok(d.render().includes('REJECTED · NEVER REUSE'));
 assert.ok(d.render().includes('CHOSEN FOR HORSE'));
 assert.equal(d.clear(),true);
 assert.equal(saved.revision,3,'clearing a temporary list must not erase preferences');
 d=desk();
 assert.equal(d.snapshot().feedback.revision,3,'feedback restored from career save');
 for(const [name,value] of Object.entries(fields))d.setField(name,value);
 d.generate();
 const names=d.snapshot().results.map(x=>x.name);
 assert.ok(!names.includes(suggestions[1].name),'rejected name never returns');
 assert.ok(!names.includes(suggestions[2].name),'chosen name is reserved for this horse');
 assert.ok(savedNamingBank(saved).includes(suggestions[0].name),'keep remains usable later');
 assert.equal(d.setView('KEEP'),true);
 assert.ok(d.render().includes('KEPT FOR LATER'));
 assert.equal(d.setView('REJECT'),true);
 assert.ok(d.render().includes('REJECTED · NEVER REUSE'));
});

test('no real horse target means choose fails closed, but keep and reject work',()=>{
 const d=createNamingDeskController();
 for(const [name,value] of Object.entries(fields))d.setField(name,value);
 assert.equal(d.generate(),true);
 const name=d.snapshot().results[0].name;
 assert.equal(d.choose(name),false);
 assert.match(d.snapshot().error,/Select an actual horse/);
 assert.equal(d.mark(name),true);
 assert.equal(d.snapshot().feedback.revision,1);
});

test('new Naming Desk uses existing game save, does not create a second storage or remote name generator',async()=>{
 const [bootstrap,desk,ui]=await Promise.all([
  readFile(new URL('../public/next/1999-bootstrap.js',import.meta.url),'utf8'),
  readFile(new URL('../public/next/1999-naming-desk.mjs',import.meta.url),'utf8'),
  readFile(new URL('../public/next/next.js',import.meta.url),'utf8')
 ]);
 assert.match(bootstrap,/function commitNamingFeedback\(/);
 assert.match(bootstrap,/localStorage\.setItem\(MAIN,JSON\.stringify\(update\)\)/);
 assert.match(desk,/manager\.commitNamingFeedback/);
 assert.match(desk,/rankNamingCandidates/);
 assert.match(ui,/select\[data-naming-field\]/);
 assert.doesNotMatch(desk,/localStorage|indexedDB|\/api\/naming\/preview|REGISTER_GAME_HORSE/);
});
