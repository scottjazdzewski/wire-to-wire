# Stakes Calendar Source Delta Audit — 2026-11-09

Compared the imported Nov 7 stakes export (v3.37) with the current Drive Master Stakes Calendar (v3.67) by race-edition ID.

| Measure | Result |
|---|---:|
| v3.37 imported editions | 5,370 |
| v3.67 master editions | 5,369 |
| Shared edition IDs | 5,369 |
| Shared rows with one or more compared field changes | 1,550 |
| Shared rows unchanged | 3,819 |
| Older imported IDs absent from v3.67 | 1 |
| New IDs in v3.67 | 0 |

Changed field counts overlap by race: Second_Horse_ID 208; Second_Name 316; Third_Horse_ID 178; Third_Name 284; Winner_Horse_ID 96; Winner_Name 201; Canon_Status 87; Chronology_QA 1,180; Race_Date 917; Race_Date_Basis 1,078; Distance_F 206; Track_ID 59; Track_Name 65; Race_Name 38; Status 132; Division_Key 38; Field_Size 37; Surface 6.

The current master adds Macro_Circuit, Date_Confidence, Active, and Sort_Date fields that were not present in the imported export. The live Control_Dashboard reports 5,223 active editions: 1,304 exact-date, 3,883 internal-date, and 36 governed WTW-fixed. Eight active races have no day recorded. Across 135 years, 43 are route-clean, 92 calendar-open, and zero fully exact-certified.

## Current source status — verified Nov 9, 2026

The workbook's release labels conflict. The spreadsheet title and Control_Dashboard title identify v3.67 as “QA Closed — Canon,” but the Master_Stakes_Calendar header says “QA Verified — Promotion Pending.” Do not treat either label alone as approval to promote v3.67 into D1; preserve the current imported source and resolve the status conflict first.

The updated Control_Dashboard reports 1,327 exact-date active races, 3,860 internal-date active races, 7 active races without a day, 2 verified-date blockers, 118 calendar/field holds, 20 high reviews, 373 mixed-date reviews, and 1 era/context pass. These current master totals are separate from the still-stale v3.37 D1 import.

## Nov 9 recheck of the prior queues (pre-correction baseline)

- **Date queue:** all 54 edition IDs are present in the current master and their Race_Date values still match the saved v3.67 comparison snapshot. Fifty-three remain INTERNAL with PASS_RESOLVER_INTERNAL_SCHEDULE_ONLY status; one record, HSE-1936-0009 (1936 Santa Anita Derby), remains undated with BLOCK_EXACT_DATE_PENDING_SANTA_ANITA and appears in Undated_Race_Queue. None of these 54 dates is reclassified as exact.
- **Placing queue:** all 616 edition IDs are present, and every changed placing value still matches the saved v3.67 comparison snapshot. This confirms that the values are current against that snapshot; it does not establish the source evidence needed to close result review.
- At that recheck baseline, no D1 refresh or master-row change had been made. The 54-date and 616-result files are historical comparison artifacts; the 54-row date snapshot is superseded in part by the single correction below.

## Nov 9 single-record date correction

`HSE-1936-0009` (1936 Santa Anita Derby) is now dated **1936-02-15** in `Master_Stakes_Calendar`. Its `Race_Date_Basis` is `HISTORICAL_EXACT_DATE_VERIFIED_CONTEMPORARY_SCHEDULE_AND_PRESS`; `Chronology_QA` is `PASS_EXACT_DATE_VERIFIED_CONTEMPORARY_SCHEDULE_AND_PRESS`; formula fields now resolve to `Date_Confidence=EXACT` and `Sort_Date=1936-02-15`. The record no longer appears in `Undated_Race_Queue`. The Race_Date cell note stores the source links.

The date is supported by the Oct. 1935 *California Arts & Architecture* Santa Anita stakes schedule, which lists the Derby for Feb. 15, and a Feb. 18, 1936 *Pampa Daily News* report stating that He Did raced in the Derby the prior week. A contemporaneous *Daily Racing Form* archive report identifies He Did, Valiant Fox and Gold Seeker as the first three. Sources: [1935 stakes schedule](https://www.usmodernist.org/AA/CAA-1935-10.pdf), [Feb. 18 post-race report](https://collections2.swco.ttu.edu/bitstream/handle/20.500.12255/162616/Pampa_Daily_News_1936_02_18.pdf?isAllowed=y&sequence=1), [Daily Racing Form archive](https://drf.uky.edu/catalog/1930s/drf1936041801/0397_3.pdf).

Dashboard totals changed from 1,304 to 1,305 exact-date active races, 3,883 to 3,882 internal-date active races, and 8 to 7 active races without a recorded day. The separate `verified-date blockers` metric remains 2. The live site D1 archive remains v3.37, so the correction is not yet reflected in the loaded site database.

**Separate result/identity hold:** The same master row still names Larkin String, Rosalie’s Button and Bellamy String as the top three, while the archived result record identifies He Did, Valiant Fox and Gold Seeker. The result names and linked horse IDs need their own correction; the date update did not close that issue.

## Four source leads saved in the master

The Race_Date cell notes now hold sources for four remaining undated editions:

- HSE-1935-0009, Santa Anita Derby: [contemporary schedule](https://www.usmodernist.org/AA/CAA-1935-02.pdf) lists February 16, 1935 as the planned day. A dated race result is still needed to establish the actual day.
- HSE-1945-0004, Fountain of Youth: [Gulfstream Park](https://www.gulfstreampark.com/news/a-look-back-at-g2-fountain-of-youth/) identifies December 1945; exact day open.
- HSE-1947-0004, Fountain of Youth: the same Gulfstream source identifies March 1947 for the three-year-old running; exact day open.
- HSE-1950-0008, San Felipe: [a January 1950 race column](https://www.newyorker.com/magazine/1950/01/28/under-way-at-hialeah) identifies January; exact day open.

These are partial leads: no day was entered and no additional race was closed. Historical result references and game identities require separate provenance and identity matching.

## Kentucky Jockey Club date batch

The Churchill Downs [stakes history](https://www.kentuckyderby.com/wp-content/uploads/sites/2/2023/10/Kentucky-Jockey-Club.pdf) supplied exact dates for 22 editions, 1920–1938 and 1946–1948. These include 21 records from the earlier 54-row date gap snapshot; 1923 was also sourced and already had the same date. Every updated date cell retains its previous WTW value and source in a note.

| Year | Previous WTW date | Sourced date |
| --- | --- | --- |
| 1920 | 1920-11-20 | 1920-11-06 |
| 1921 | 1921-11-19 | 1921-10-15 |
| 1922 | 1922-11-18 | 1922-09-09 |
| 1923 | 1923-11-17 | 1923-11-17 |
| 1924 | 1924-11-15 | 1924-11-01 |
| 1925 | 1925-11-21 | 1925-10-31 |
| 1926 | 1926-11-20 | 1926-10-02 |
| 1927 | 1927-11-19 | 1927-10-08 |
| 1928 | 1928-11-17 | 1928-12-01 |
| 1929 | 1929-11-16 | 1929-10-05 |
| 1930 | 1930-11-15 | 1930-10-16 |
| 1931 | 1931-11-21 | 1931-10-17 |
| 1932 | 1932-11-19 | 1932-10-29 |
| 1933 | 1933-11-18 | 1933-10-28 |
| 1934 | 1934-11-17 | 1934-10-27 |
| 1935 | 1935-11-16 | 1935-10-19 |
| 1936 | 1936-11-21 | 1936-11-07 |
| 1937 | 1937-11-20 | 1937-10-30 |
| 1938 | 1938-11-19 | 1938-11-05 |
| 1946 | 1946-11-16 | 1946-11-02 |
| 1947 | 1947-11-15 | 1947-11-01 |
| 1948 | 1948-11-20 | 1948-10-30 |

The source states the race was run at Latonia in 1931–1933, while those master rows identify Churchill Downs. It lists one mile for these historical editions; the current master rows list 8.5 furlongs. All 22 retain an explicit review flag for distance and campaign chronology, with the Latonia mismatch also flagged for 1931–1933. The dates alone do not verify the linked horse identities. The live site database remains on v3.37 and does not yet include this batch.

## Delta triage

- 917 changed date values were found in the initial v3.37-to-v3.67 comparison. Their earlier pass/hold classification is not a current certification statement.
- 863 date-changing editions matched a source URL in the prior Evidence_Queue snapshot; 54 did not. The present workbook no longer has that tab, so those queue counts are historical triage only.
- 616 changed editions include at least one winner, second-place, or third-place horse ID/name difference. The saved result queue is a comparison artifact, not evidence that each result remains unresolved today.
- One v3.37-only edition remains for review: HSE-1995-0012-D2, Risen Star Stakes, 1995-02-28, winner “Elly’s String.” Keep the source row available until its status is reconciled; do not delete automatically.

The row-level comparison remains in [the JSON delta](data/history-audit/2026-11-08/v337-to-v367-diff.json). The prior 54-date queue is in [the date evidence gap snapshot](data/history-audit/2026-11-08/date-evidence-gaps-54.json), and the prior 616-edition queue is in [the result-change snapshot](data/history-audit/2026-11-08/result-change-review-616.json). These files should be preserved as historical audit artifacts and refreshed from the current workbook before source promotion.