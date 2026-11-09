# WIRE TO WIRE — History-First Delivery Plan

**As of:** 2026-11-08  
**Order:** historical source quality → compact history screens → site approval → management systems.

The management loop stays out of development until the historical archive is reconciled and the site layout is approved.

## Geographic foundation — Nov 9, 2026

- Required coverage: city and state/province/country for every track, farm and race barn; birthplace and dated working bases for every jockey, trainer and owner; foaling location for every horse. Owners may be people or organizations, so do not invent a human birthplace for an organization.
- Keep birthplace, working base, current physical barn, and horse foaling location as separate relationships. Bases may change over time; record their effective years when known. A breeder is not automatically the foaling farm, and a trainer's base is not proof of a horse's exact barn. Preserve fictional identities and mark fictional world-building explicitly; do not invent historical source claims.
- Track staging lists all 40 distinct track IDs in the v3.67 stakes calendar: 39 have city-level source citations and Bainbridge Park remains regional/provisional pending a municipality check. The broader 1999 working registry has 118 domestic plus 16 international track entries; 78 domestic and all 16 international entries are outside that 40-track stakes subset and still need this location research. City labels describe present-day geography, with facilities and original race-edition assignments requiring separate historical checks. Older Greenwood and newer Woodbine remain separate track IDs despite both being in Toronto.
- In the additional 94 track entries, 38 now have sourced city-level locations; 56 still need city-level research or fictional-world assignment. Current addresses are not automatically valid for earlier eras: in particular, check relocations such as Evangeline Downs before linking historic campaigns.
- The 1999 working registry contains 154 people and 106 organizations. Of 2,991 horse entries, 2,970 already have a foaling country recorded; those values are useful existing fictional-world data but are not city-level foaling locations, and the source remains a working reconciliation. People and organization registry columns do not include birthplace or base fields.
- Prepared `migrations/0004_geography.sql` and `data/geography/track-locations-staging.json`; neither is loaded into D1. They do not populate farm, barn, people, or foaling locations. Unknowns remain unassigned rather than being generated silently.
- Future travel review should use actual facility-to-facility distance where available, transport mode and historical era, consecutive-race intervals, recovery, seasonal bases and confidence of both dates and locations. Flag suspect routes without automatically rewriting results; do not assume all horses traveled from a base before every race. The campaign script currently uses broad circuits only, and gameplay travel enforcement is not implemented.

## Calendar standard and campaign review — Nov 9, 2026

- Before 1973, establish the year each stakes was run. Preserve previously sourced exact dates. Use a plausible seasonal window and a clearly labeled provisional calendar date to order game history; do not present that placeholder as a verified historical day.
- From 1973 onward, seek sourced actual dates for all recorded stakes editions. Scheduled, internal and WTW-fixed dates do not meet the exact-date target. Keep existing provisional values until reliable evidence supports a change.
- Check each horse's recorded campaign for timing, recovery, track and geographic plausibility. A same-day cross-track pairing, an unusually short interval between circuits, or a dense campaign spanning multiple circuits is a review lead, not automatic proof of error. Consider era and exceptional real campaigns; do not silently change results or invent a universal recovery rule. The current review uses only the archived top-three placings, not complete starts.
- A Nov 9 master snapshot has 2,219 active editions from 1973 onward: 734 with the workbook's EXACT classification, 1,467 INTERNAL and 18 WTW_FIXED. These are master counts, not the older D1 import, and EXACT is a source-status count rather than an independent re-verification.
- Initial route review of 2,908 horses with dated active top-three links found 47 same-day different-track pairs, 629 adjacent pairs within seven days across different workbook circuits, and one horse with at least six recorded races across three circuits in 49 days. These counts are overlapping leads and are not confirmed errors or a complete-start audit. Run `python scripts/campaign_review.py Master_Stakes_Calendar.csv --output campaign_findings.json` against an up-to-date export to reproduce and investigate. No race or horse data is changed by the script.
- Neither the review tool nor this policy implements or enforces game travel/recovery logic yet. Build it only after the user approves the history and site.


## Current audit findings

- The private Cloudflare D1 database contains the Nov 7 H/S/E/P/B import. Its row-count, manifest-hash and integrity checks passed, but those checks verify the import against its staged files; they do not establish historical truth.
- The imported stakes export is labeled v3.37 and has 5,370 editions. The current Drive master is v3.67 with 5,369 editions. Its Control_Dashboard title says “QA Closed — Canon,” while the Master_Stakes_Calendar header says “QA Verified — Promotion Pending”; treat the release status as unresolved until the workbook labels are reconciled.
- Comparing the 5,369 shared edition IDs found 1,550 records changed in one or more audited core fields and one old imported ID absent from the current master. Field-change counts overlap: 917 date values; 96 winner IDs; 208 second-place IDs; 178 third-place IDs.
- The v3.67 dashboard lists 5,223 active editions: 1,304 exact-date, 3,883 internal-date, and 36 governed WTW-fixed. Eight active records have no day recorded and are included in the internal-date category. Of 135 years, 43 are route-clean, 92 calendar-open, and zero fully exact-certified.
- The horse master has 3,856 records: 617 existing canon, 3,115 historical stakes backfill, and 124 generated pedigree-support records. Backfill/support names are not a verified real-horse name corpus. One normalized duplicate name is flagged for review, not deletion.

## Work sequence

### 1. Reconcile the current calendar source
Build a durable edition-ID diff between v3.37 and v3.67, then resolve or explicitly hold changed dates, placings, divisions, distances, venues and status. Keep source version and evidence links on every row. Stage only a controlled incremental database update that preserves current name overrides and review decisions. Do not rerun the initial import.

**Gate:** the site calendar uses the latest approved source snapshot, and every difference is resolved or visibly marked as held.

### 2. Certify horse identity and names
Separate confirmed historical identities from backfills and generated pedigree support. Check names against authoritative records, keep true name reuse distinct from accidental duplicate IDs, and record the source for each match. Do not seed fictional-name generation from reconstructed names.

**Gate:** each horse shown as historical has a source class and identity status the user can inspect.

### 3. Make the stakes calendar readable
Use chronological year/month groupings where dates are available. Show exact sourced dates, internal schedule dates, governed WTW dates, unverified dates, held/unresolved dates, unrecorded days and verified non-runs separately. Unknown days stay in an undated/held section. Keep the source citation and date confidence visible when a race is opened.

**Gate:** no date appears exact unless its source basis supports that label; open years and not-run records remain distinct.

### 4. Compact horse, person and farm history
Keep the first screen focused on identity, sire/dam, career summary, finishes and notable achievements. The present import has top-three stakes results, not all finishers, complete lifetime starts or earnings. Show those fields as unavailable until authoritative values are imported. Keep owner/trainer/jockey links labeled as season-level when race-day evidence is absent.

**Gate:** a horse’s known history is visible at a glance without presenting top-three records as lifetime starts or zero earnings as fact.

### 5. Build a separate fictional-name pipeline
Seed styles only from reviewed real names. Generate diverse batches across naming traditions and phrase structures; enforce whole-game uniqueness, downweight overused words and bigrams, and flag near-duplicates. Store each generated horse as fictional, separate from historical canon, and learn from owner keep/reject feedback.

**Gate:** a reviewed batch has broad variety without the repeated word clusters that triggered the current concern.

### 6. Review the site, then start game systems
Review the archive dashboard, calendar, horse file, people/farm cards and source labels. Only after historical quality and layout are accepted should we design the trainer/owner/farm-manager loop and selectable involvement depth.

## Started this turn

The calendar-source comparison and horse source-class audit are complete. The site now displays the v3.37 → v3.67 reconciliation issue, date-evidence labels, and horse source classes. The full field-level delta is saved at `data/history-audit/2026-11-08/v337-to-v367-diff.json`; next is issue-by-issue resolution before any D1 refresh.

## Progress update — 2026-11-08

- The Race Calendar is now a real Sunday-first month grid with month navigation and a full monthly agenda. Full dated schedule entries appear on the grid with confidence markers; held, undated/partial-day, and not-run records stay outside it. The page-by-page design pass is documented in UI_PAGE_AUDIT_2026-11-08.md.
- The delta audit now reports the correct 3,819 unchanged shared editions and separates the 917 internal-date changes from result changes needing review.
- A first fictional-name candidate batch is being screened only against the 3,856 names in the current archive. Fictional candidates stay out of historical records and D1 until separately accepted; the current batch is provisional and has not been checked against external horse registries.

- Focused queues are now saved: 54 changed dates with no matching Evidence_Queue row, and 616 editions whose placing IDs or names changed. These remain review queues, not approved corrections.

- Horse cards now put sire/dam, recorded top-three placings, first/second/third counts, notable stakes wins, and unavailable lifetime starts/earnings in a more compact first-view layout. The live site could not be visually reviewed in this session because Cloudflare Access stopped at its email-code login page.

- The supplied v0.18 single-file game screen is a separate future gameplay reference (Office, Inbox, World, Race, Calendar, News, Results, Diagnostics and Profiles). Keep its management loop paused until the historical archive and archive UI are accepted.


## Progress update — 2026-11-09

- The current v3.67 dashboard reports 2 verified-date blockers, 118 calendar/field holds, 20 high reviews, 393 mixed-date reviews, 1 era/context pass, 8 active races with no day, 43 route-clean years and 92 calendar-open years. Zero years are fully exact-certified.
- The current workbook has conflicting release labels: Control_Dashboard says “QA Closed — Canon,” while the master tab says “QA Verified — Promotion Pending.” The site now shows the conflict and keeps the D1 import marked stale; no promotion or D1 refresh was made.
- Continued the page audit: the calendar’s “+ more” now jumps to the full monthly race card; the horse-profile asynchronous detail path is guarded against cross-profile results; active navigation now exposes its current-page state.
- The 54-date and 616-result queues were rechecked against the current v3.67 master on Nov 9: 54/54 dates and 616/616 changed placing values still match the saved comparison snapshot. Fifty-three date rows remain INTERNAL/PASS; HSE-1936-0009 remains undated/BLOCK. These are value rechecks, not exact-date or result-source certification.
- Browser visual review remains unavailable because Cloudflare Access presents an email-code screen; the source audit is documented without claiming live-page verification.
- The v0.18 game screen remains a future reference only. Simulation remains paused until the history and archive layout are accepted.