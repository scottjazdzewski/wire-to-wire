# 1999 Wire to Wire player-selected track retirements
Date: 2026-11-13

This is a **gameplay and UI exclusion**, not a historical-source deletion.

| Canonical Track_ID | Venue | 1999 playable | UI track directory |
|---|---|---|---|
| T-0042 | Atlantic City Race Course | No | Hidden |
| T-0115 | Aurora Downs | No | Hidden |
| T-0112 | Bainbridge Park | No | Hidden |

All three immutable IDs remain in the authoritative track registry and source history, including the verified 1999 Atlantic City schedule; no past race results, owners, runners, horses, or geographically linked historical data are changed.

Implementation: the 1999 program sets `trackOperating=HISTORICAL_ONLY`, `playableIn1999=false`; all `trackMeetOpen1999` calls return false for these courses, so alternate modeled stakes and condition-book races are suppressed. The current 1999 interface excludes these IDs from its track directory/calendar list while retaining archival records in the underlying source.

118 total canonical North American IDs; 115 player-operational 1999 North American courses, plus the separately maintained 16 international registry venues.
