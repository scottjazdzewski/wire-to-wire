# WTW 1999 — Existing calendar reinforcement (November 12, 2026)

The already-integrated `public/next/1999-track-program.mjs` remains the **single authoritative game-calendar overlay** for all 134 ID-keyed tracks, and its derived 1999 browser/server condition books remain connected. No second calendar was activated and no visual UI files were changed.

**1999 sourced date corrections**
- Saratoga (T-0003) July 28–September 6. The 36-day NYRA proposal was reported August 13, 1998 in [TDN](https://www.thoroughbreddailynews.com/pdf/tdn/1998/tdn980813.pdf).
- Churchill Downs (T-0013) April 24–June 27 and October 31–November 27; 71 actual live days in the [1999 Churchill Downs annual report](https://financialfilings.com/filings/churchill-downs-inc/annual-report/2000/10492900/).
- Ellis Park (T-0016) June 28–September 6; 61 actual live days in that same annual report. Its exact individual weekdays remain game-model approximations rather than certified dates.
- The previously integrated California Racing Board and New Jersey Racing Commission source dates were not modified.

**Fictional stakes expansion**
- Eight fiction-only tracks T-0094 through T-0101 each have 12 planned WTW feature stakes (96 total), including the preexisting -01 ID and date for continuity and 11 new regional events.
- Original 93 sourced 1999 stakes IDs/dates stay locked and are not overwritten. All 96 fantasy stakes have `canonical:false`, explicit WTW calendar basis, no entries or completed results.
- Newly scheduled features only run on dates their home track actually hosts racing, and dirt-only tracks cannot schedule turf stakes.

**Separate historical reality:** WTW has an existing alternate-history rule under which certain real tracks that closed before 1999 survive into the test world. These are game continuations, not claims of real 1999 racing. This patch does not change those existing rules.

**Testing:** `tests/1999-track-program-integrity.test.mjs` protects the 134 IDs, correct real dates, source boundaries, fictional event days, and surface constraints.
