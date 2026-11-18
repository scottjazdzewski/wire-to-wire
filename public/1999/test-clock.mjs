// The 1999 TEST UNIVERSE clock is isolated from the old Office demo and its saves.
// All newly generated/seeded worlds open on Jan 1, 1999, 00:00 local game time.
export const WTW_TEST_START_DATE='1999-01-01';
export const WTW_TEST_SAVE_NAMESPACE='wtw:1999:test-world:v1';
export const WTW_TEST_CLOCK_SCHEMA='WTW_1999_TEST_CLOCK_V1';
const DAY=86400000;
const dateMs=date=>{
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Bad ISO game date');
 const time=Date.parse(date+'T00:00:00.000Z');
 if(!Number.isFinite(time)||new Date(time).toISOString().slice(0,10)!==date)throw Error('Invalid game date');
 return time;
};
export function createClean1999Clock(seed=19990101){
 if(!Number.isSafeInteger(seed)||seed<1)throw Error('Invalid deterministic world seed');
 return {schema:WTW_TEST_CLOCK_SCHEMA,worldStartDate:WTW_TEST_START_DATE,
  currentDate:WTW_TEST_START_DATE,day:0,seed,revision:0,mode:'TEST_ONLY',
  historyImmutable:true,activeEntries:[],committedResults:[]};
}
export function validate1999Clock(clock){
 if(!clock||clock.schema!==WTW_TEST_CLOCK_SCHEMA||clock.worldStartDate!==WTW_TEST_START_DATE)throw Error('World clock schema mismatch');
 const elapsed=(dateMs(clock.currentDate)-dateMs(WTW_TEST_START_DATE))/DAY;
 if(!Number.isSafeInteger(elapsed)||elapsed<0||clock.day!==elapsed)throw Error('Inconsistent game date');
 if(!Number.isInteger(clock.revision)||clock.revision<0||!Number.isSafeInteger(clock.seed)||clock.seed<1)throw Error('Invalid clock state');
 if(!Array.isArray(clock.activeEntries)||!Array.isArray(clock.committedResults))throw Error('Invalid test ledgers');
 return clock;
}
export function advance1999Clock(clock,days=1){
 validate1999Clock(clock);
 if(!Number.isInteger(days)||days<1||days>31)throw Error('Advance must be 1–31 days');
 const date=new Date(dateMs(clock.currentDate)+days*DAY).toISOString().slice(0,10);
 return validate1999Clock({...clock,currentDate:date,day:clock.day+days,revision:clock.revision+1});
}
export function reset1999Clock(clock){
 if(clock!==undefined)validate1999Clock(clock);
 return createClean1999Clock(clock?.seed??19990101);
}
