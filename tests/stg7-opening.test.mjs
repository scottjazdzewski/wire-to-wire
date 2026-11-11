import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prepareJan1999Assessments,evaluate1999Entry} from '../src/runtime/stg7-opening.mjs';

// Verified 2026-11-11 against the nine Jan1 TRG-0025 records in the existing
// 1999_Opening_Event_Queue. TEST FIXTURES ONLY; not a second game-state ledger.
const assigned=[
  ['H-1996-008006','Bell On Tuesday','P-000069','O-006336','T-0014'],
  ['H-1996-008011','Monahan Lantern','P-000044','O-006889','T-0017'],
  ['H-1996-008010','McRae Lantern','P-000051','O-006875','T-0022'],
  ['H-1996-008009','Write Mabel','P-000048','O-006337','T-0028'],
  ['H-1996-008001','Take Rita','P-000041','O-000036','T-0001'],
  ['H-1996-008005','Apron Later','P-000043','O-000017','T-0014'],
  ['H-1996-008007','Ask Later','P-000042','O-000013','T-0015'],
  ['H-1996-008012','Pike Curtain','P-000041','O-000021','T-0001'],
  ['H-1996-008008','Mind Bessie','P-000069','O-006889','T-0014']
];
const horseStates=assigned.map(([horseId,name,trainerId,ownerId,trackId])=>
  ({horseId,name,trainerId,ownerId,trackId,foalYear:1996,ageJan1999:3,
    sex:'MARE',latestRecordedStart:'1998-12-12'}));
const queuedEvents=assigned.map(([subjectId,,trainerId,ownerId,trackId],i)=>({
  eventId:'EVQ-1999-'+String(i+30).padStart(4,'0'),
  scheduledAt:'1999-01-01T08:00:00',
  eventType:'JAN1_HISTORICAL_CARRYOVER_CONDITION_ASSESSMENT',
  triggerId:'TRG-0025',subjectId,ownerId,trainerId,trackId
}));
const h=horseStates[0];
const race={raceId:'1999-TEST-ONLY',date:'1999-02-27',trackId:h.trackId,minAge:3,
  allowedSexes:['MARE'],surface:'DIRT',distanceF:8.5,
  surfaceEvidenceConfirmed:true,distanceEvidenceConfirmed:true};
const observations={soundness:'PASS',fitness:'PASS',workouts:'PASS',
  recovery:'PASS',trainerDecision:'ELIGIBLE_CONDITION'};
const rider={horseId:h.horseId,date:race.date,status:'AVAILABLE'};
const finance={status:'AUTHORIZED',availableBalance:5000,requiredCommitment:1000};
const evaluate=(over={})=>evaluate1999Entry({
  horse:h,race,observations,rider,finance,currentEntries:[],...over
});

test('9 canonical juvenile IDs yield observation requests, never invented health or races',()=>{
  const before=JSON.stringify({horseStates,queuedEvents});
  const events=prepareJan1999Assessments({horseStates,queuedEvents});
  assert.equal(events.length,9);
  assert.equal(new Set(events.map(e=>e.horseId)).size,9);
  for(const e of events){
    assert.equal(e.outcome,null);assert.equal(e.observedHealth,null);
    assert.equal(e.raceEntryId,null);assert.equal(e.status,'AWAITING_OBSERVATIONS');
  }
  assert.equal(before,JSON.stringify({horseStates,queuedEvents}));
  assert.equal(prepareJan1999Assessments({
    horseStates,queuedEvents,persistedEvents:events
  }).length,0);
});
test('duplicate, missing, or false owner/trainer/barn joins reject',()=>{
  assert.throws(()=>prepareJan1999Assessments({
    horseStates,queuedEvents:[...queuedEvents,queuedEvents[0]]
  }),/Duplicate/);
  assert.throws(()=>prepareJan1999Assessments({
    horseStates:horseStates.slice(1),queuedEvents
  }),/not registered/);
  const altered=queuedEvents.map(e=>({...e}));
  altered[0].trainerId='P-FALSE';
  assert.throws(()=>prepareJan1999Assessments({
    horseStates,queuedEvents:altered
  }),/join failed/);
});
test('no declarations before observed fitness, soundness, workouts and recovery',()=>{
  assert.ok(evaluate({observations:null}).reasons.includes(
    'CONDITION_ASSESSMENT_INCOMPLETE_OR_FAIL'
  ));
  assert.ok(evaluate({observations:{...observations,recovery:'PENDING'}}).reasons.includes(
    'CONDITION_ASSESSMENT_INCOMPLETE_OR_FAIL'
  ));
});
test('no same-day double entry, teleporting, unfunded entry or fake rider',()=>{
  assert.ok(evaluate({currentEntries:[{
    horseId:h.horseId,date:race.date,status:'ENTERED'
  }]}).reasons.includes('SAME_DAY_ENTRY_CONFLICT'));
  assert.ok(evaluate({race:{...race,trackId:'T-OTHER'}}).reasons.includes(
    'SHIPPING_ARRIVAL_UNCONFIRMED'
  ));
  assert.ok(evaluate({rider:null}).reasons.includes('RIDER_NOT_CONFIRMED'));
  assert.ok(evaluate({finance:{...finance,availableBalance:0}}).reasons.includes(
    'FINANCE_UNAVAILABLE'
  ));
});
test('AI and human player share the same eligibility gate',()=>{
  assert.deepEqual(evaluate({controller:'AI'}).reasons,
    evaluate({controller:'PLAYER'}).reasons);
  assert.equal(evaluate({controller:'PLAYER'}).status,
    'ELIGIBLE_TO_CONSIDER_DECLARATION');
  assert.equal(evaluate({controller:'AI'}).createsEntry,false);
});
test('reject wrong age, sex, surface fit, and late arrival',()=>{
  assert.ok(evaluate({race:{...race,minAge:4}}).reasons.includes('AGE_INELIGIBLE'));
  assert.ok(evaluate({race:{...race,allowedSexes:['STALLION']}}).reasons.includes(
    'SEX_INELIGIBLE'
  ));
  assert.ok(evaluate({race:{...race,surfaceEvidenceConfirmed:false}}).reasons.includes(
    'SURFACE_FIT_NOT_EVALUATED'
  ));
  assert.ok(evaluate({race:{...race,trackId:'T-NEW'},shipment:{
    originTrackId:h.trackId,destinationTrackId:'T-NEW',
    arrivalDate:'1999-02-28',status:'CONFIRMED'
  }}).reasons.includes('SHIPPING_ARRIVAL_UNCONFIRMED'));
});
