/** 1999 race-date evidence overlay for the playable WTW game.
 * Historical source records and their immutable IDs are NEVER modified.
 * Revised dates are applied only to modeled 1999 scheduling projections.
 * Remaining source-only dates are not automatically certified by this map.
 */
export const VERIFIED_1999_STAKES_DATES=Object.freeze({
  "STK-0004": {
    "date": "1999-02-20",
    "sourceUrl": "https://www.sportsbetting3.com/horse-races/1999-grade-all-races"
  },
  "STK-0005": {
    "date": "1999-03-13",
    "sourceUrl": "https://www.sportsbetting3.com/horse-races/1999-grade-all-races"
  },
  "STK-0008": {
    "date": "1999-03-13",
    "sourceUrl": "https://www.sportsbetting3.com/horse-races/1999-grade-all-races"
  },
  "STK-0013": {
    "date": "1999-03-14",
    "sourceUrl": "https://www.racingpost.com/results/742/fair-grounds/1999-03-14/266995/"
  },
  "STK-0015": {
    "date": "1999-04-18",
    "sourceUrl": "https://www.kentuckyderby.com/wp-content/uploads/sites/2/2025/03/Stakes-Histories-Lexington-2025.pdf"
  },
  "STK-0023": {
    "date": "1999-08-01",
    "sourceUrl": "https://www.sportsbetting3.com/horse-races/1999-grade-all-races"
  },
  "STK-0024": {
    "date": "1999-05-29",
    "sourceUrl": "https://www.sportsbetting3.com/horse-races/1999-grade-all-races"
  },
  "STK-0025": {
    "date": "1999-10-10",
    "sourceUrl": "https://www.sportsbetting3.com/horse-races/1999-grade-all-races"
  },
  "STK-0027": {
    "date": "1999-06-27",
    "sourceUrl": "https://www.latimes.com/archives/la-xpm-1999-jun-28-sp-50979-story.html"
  },
  "STK-0039": {
    "date": "1999-10-09",
    "sourceUrl": "https://www.sportsbetting3.com/horse-races/1999-grade-all-races"
  },
  "STK-0045": {
    "date": "1999-07-31",
    "sourceUrl": "https://www.sportsbetting3.com/horse-races/1999-grade-all-races"
  },
  "STK-0046": {
    "date": "1999-08-25",
    "sourceUrl": "https://www.sportsbetting3.com/horse-races/1999-grade-all-races"
  },
  "STK-0047": {
    "date": "1999-05-29",
    "sourceUrl": "https://www.latimes.com/archives/la-xpm-1999-may-29-sp-42290-story.html"
  },
  "STK-0048": {
    "date": "1999-05-29",
    "sourceUrl": "https://www.sportsbetting3.com/horse-races/1999-grade-all-races"
  },
  "STK-0052": {
    "date": "1999-03-06",
    "sourceUrl": "https://www.sportsbetting3.com/horse-races/1999-grade-all-races"
  },
  "STK-0054": {
    "date": "1999-06-26",
    "sourceUrl": "https://matchseries.com/wp-content/uploads/2018/04/MATCH-1999.pdf"
  },
  "STK-0056": {
    "date": "1999-10-10",
    "sourceUrl": "https://www.sportsbetting3.com/horse-races/1999-grade-all-races"
  },
  "STK-0058": {
    "date": "1999-02-27",
    "sourceUrl": "https://www.sportsbetting3.com/horse-races/1999-grade-all-races"
  },
  "STK-0067": {
    "date": "1999-02-20",
    "sourceUrl": "https://www.sportsbetting3.com/horse-races/1999-grade-all-races"
  },
  "STK-0072": {
    "date": "1999-10-15",
    "sourceUrl": "https://www.sportsbetting3.com/horse-races/1999-grade-all-races"
  },
  "STK-0074": {
    "date": "1999-10-02",
    "sourceUrl": "https://www.sportsbetting3.com/horse-races/1999-grade-all-races"
  },
  "STK-0080": {
    "date": "1999-10-09",
    "sourceUrl": "https://www.sportsbetting3.com/horse-races/1999-grade-all-races"
  },
  "STK-0081": {
    "date": "1999-04-11",
    "sourceUrl": "https://www.sportsbetting3.com/horse-races/1999-grade-all-races"
  },
  "STK-0082": {
    "date": "1999-02-27",
    "sourceUrl": "https://www.sportsbetting3.com/horse-races/1999-grade-all-races"
  }
});
export function applyVerifiedStakeDay1999(stake){
 const fix=VERIFIED_1999_STAKES_DATES[stake?.id];
 if(!fix)return stake;
 return {...stake,sourceCalendarDate1999:stake.localDate,localDate:fix.date,date:fix.date,
  dateEvidenceBasis:'RESEARCHED_1999_STAKES_DATE',dateEvidenceUrl:fix.sourceUrl};
}
