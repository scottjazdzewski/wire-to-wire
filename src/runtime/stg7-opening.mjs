/**
 * WIRE TO WIRE — STG7 opening assessment / entry-feasibility core.
 * Pure, deterministic and side-effect free. No race, health, workout, shipping,
 * financial or rider facts are manufactured. No writes to historical canon.
 *
 * Integration contract: caller must persist returned events atomically, then
 * supply persisted events on replay. This is not a race simulator.
 */
const DAY = 86400000;
const ASSESSMENT = 'JAN1_HISTORICAL_CARRYOVER_CONDITION_ASSESSMENT';
const REQUIRED_OBSERVATIONS = Object.freeze([
  'soundness', 'fitness', 'workouts', 'recovery', 'trainerDecision'
]);
function requireNonblank(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(label + ' is required');
  return value;
}
function dateOnly(raw) {
  const value = requireNonblank(raw, 'date');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value + 'T00:00:00Z')))
    throw new Error('Invalid ISO date ' + value);
  return value;
}
function daysBetween(a,b) {
  return (Date.parse(dateOnly(b) + 'T00:00:00Z') - Date.parse(dateOnly(a) + 'T00:00:00Z')) / DAY;
}
function uniqueValues(items, key, label) {
  const seen = new Set();
  for (const item of items) {
    const id = requireNonblank(item[key], label + '.' + key);
    if (seen.has(id)) throw new Error('Duplicate ' + label + '.' + key + ': ' + id);
    seen.add(id);
  }
}
/**
 * Convert queued Jan1 TRG-0025 events into assessment requests only.
 * Does not claim a horse is sound, fit, rested or ready.
 * horseStates contain Jan1 game-world assignments, not 1998 historical actors.
 */
export function prepareJan1999Assessments({horseStates, queuedEvents, persistedEvents=[]}) {
  if (!Array.isArray(horseStates) || !Array.isArray(queuedEvents) || !Array.isArray(persistedEvents))
    throw new TypeError('horseStates, queuedEvents and persistedEvents must be arrays');
  uniqueValues(horseStates,'horseId','horseStates');
  uniqueValues(queuedEvents,'eventId','queuedEvents');
  uniqueValues(persistedEvents,'eventId','persistedEvents');
  const horses = new Map(horseStates.map(h=>[h.horseId,h]));
  const already = new Set(persistedEvents.map(e=>e.eventId));
  const subjects = new Set();
  const output = [];
  for (const event of [...queuedEvents].sort((a,b)=>a.eventId.localeCompare(b.eventId))) {
    if (event.eventType !== ASSESSMENT || event.triggerId !== 'TRG-0025')
      throw new Error('Incorrect STG7 event/trigger: '+event.eventId);
    if (event.scheduledAt !== '1999-01-01T08:00:00')
      throw new Error('Wrong opening event time: '+event.eventId);
    if (subjects.has(event.subjectId)) throw new Error('Duplicate horse opening assessment: '+event.subjectId);
    subjects.add(event.subjectId);
    const horse=horses.get(event.subjectId);
    if (!horse) throw new Error('Opening horse is not registered: '+event.subjectId);
    for (const field of ['horseId','name','ownerId','trainerId','trackId'])
      requireNonblank(horse[field],horse.horseId+'.'+field);
    if (horse.foalYear!==1996 || horse.ageJan1999!==3)
      throw new Error('Wrong carryover identity/age: '+horse.horseId);
    if (horse.ownerId!==event.ownerId || horse.trainerId!==event.trainerId || horse.trackId!==event.trackId)
      throw new Error('Opening owner/trainer/barn join failed: '+horse.horseId);
    if (horse.latestRecordedStart && dateOnly(horse.latestRecordedStart)>'1998-12-31')
      throw new Error('Future starting history in opening snapshot: '+horse.horseId);
    const outId='STG7-ASSESS-'+event.eventId;
    if (already.has(outId)) continue;
    output.push({
      eventId:outId,sourceEventId:event.eventId,horseId:horse.horseId,
      actorId:horse.trainerId,ownerId:horse.ownerId,trackId:horse.trackId,
      effectiveAt:event.scheduledAt,eventType:'CONDITION_ASSESSMENT_REQUESTED',
      status:'AWAITING_OBSERVATIONS',requiredObservations:[...REQUIRED_OBSERVATIONS],
      raceEntryId:null,outcome:null,observedHealth:null,
      provenance:'WTW_JAN1999_IN_WORLD_ASSIGNMENT_NOT_HISTORICAL_1998_ACTOR'
    });
  }
  return output;
}
/**
 * One eligibility gate for human and AI. PASS permits considering declaration;
 * it is NOT a committed entry. There is no fixed rest formula: recovery
 * clearance requires an externally supplied condition/observation decision.
 */
export function evaluate1999Entry({horse,race,observations,currentEntries=[],shipment=null,rider=null,finance=null,controller='AI'}) {
  if (!['AI','PLAYER'].includes(controller)) throw new Error('Invalid controller');
  if (!horse || !race) throw new TypeError('horse and race are required');
  if (!Array.isArray(currentEntries)) throw new TypeError('currentEntries must be an array');
  const reasons=[];
  const horseId=requireNonblank(horse.horseId,'horse.horseId');
  const raceDate=dateOnly(race.date);
  if (!horse.ownerId||!horse.trainerId||!horse.trackId) reasons.push('OPENING_IDENTITY_OR_PHYSICAL_BARN_MISSING');
  if (horse.foalYear && (+raceDate.slice(0,4)-horse.foalYear)<race.minAge) reasons.push('AGE_INELIGIBLE');
  if (race.allowedSexes && !race.allowedSexes.includes(horse.sex)) reasons.push('SEX_INELIGIBLE');
  if (race.surface && !race.surfaceEvidenceConfirmed) reasons.push('SURFACE_FIT_NOT_EVALUATED');
  if (race.distanceF && !race.distanceEvidenceConfirmed) reasons.push('DISTANCE_FIT_NOT_EVALUATED');
  if (!observations || observations.soundness!=='PASS' || observations.fitness!=='PASS' ||
      observations.workouts!=='PASS' || observations.recovery!=='PASS' ||
      observations.trainerDecision!=='ELIGIBLE_CONDITION')
    reasons.push('CONDITION_ASSESSMENT_INCOMPLETE_OR_FAIL');
  if (horse.latestRecordedStart && daysBetween(horse.latestRecordedStart,raceDate)<0)
    reasons.push('RACE_BEFORE_PRIOR_START');
  if (currentEntries.some(e=>e.horseId===horseId && e.date===raceDate && e.status!=='SCRATCHED'))
    reasons.push('SAME_DAY_ENTRY_CONFLICT');
  if (horse.trackId!==race.trackId && (!shipment || shipment.originTrackId!==horse.trackId ||
      shipment.destinationTrackId!==race.trackId || shipment.arrivalDate>raceDate ||
      shipment.status!=='CONFIRMED')) reasons.push('SHIPPING_ARRIVAL_UNCONFIRMED');
  if (!rider||rider.status!=='AVAILABLE'||rider.date!==raceDate||rider.horseId!==horseId)
    reasons.push('RIDER_NOT_CONFIRMED');
  if (!finance||finance.status!=='AUTHORIZED'||finance.availableBalance<finance.requiredCommitment)
    reasons.push('FINANCE_UNAVAILABLE');
  return Object.freeze({
    horseId,raceId:requireNonblank(race.raceId,'race.raceId'),
    status:reasons.length?'NOT_ELIGIBLE_TO_DECLARE':'ELIGIBLE_TO_CONSIDER_DECLARATION',
    reasons,controllerAffectsEligibility:false,createsEntry:false
  });
}
