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

The current Control_Dashboard reports 2 verified-date blockers, 118 calendar/field holds, 20 high reviews, 393 mixed-date reviews, and 1 era/context pass. These are current master control totals, separate from the still-stale v3.37 D1 import.

## Nov 9 read-only recheck of the prior queues

- **Date queue:** all 54 edition IDs are present in the current master and their Race_Date values still match the saved v3.67 comparison snapshot. Fifty-three remain INTERNAL with PASS_RESOLVER_INTERNAL_SCHEDULE_ONLY status; one record, HSE-1936-0009 (1936 Santa Anita Derby), remains undated with BLOCK_EXACT_DATE_PENDING_SANTA_ANITA and appears in Undated_Race_Queue. None of these 54 dates is reclassified as exact.
- **Placing queue:** all 616 edition IDs are present, and every changed placing value still matches the saved v3.67 comparison snapshot. This confirms that the values are current against that snapshot; it does not establish the source evidence needed to close result review.
- No D1 refresh or master-row change was made. The 54-date and 616-result files remain comparison artifacts; use their verified current values as review targets while preserving the source and certification caveats.

## Delta triage

- 917 changed date values were found in the initial v3.37-to-v3.67 comparison. Their earlier pass/hold classification is not a current certification statement.
- 863 date-changing editions matched a source URL in the prior Evidence_Queue snapshot; 54 did not. The present workbook no longer has that tab, so those queue counts are historical triage only.
- 616 changed editions include at least one winner, second-place, or third-place horse ID/name difference. The saved result queue is a comparison artifact, not evidence that each result remains unresolved today.
- One v3.37-only edition remains for review: HSE-1995-0012-D2, Risen Star Stakes, 1995-02-28, winner “Elly’s String.” Keep the source row available until its status is reconciled; do not delete automatically.

The row-level comparison remains in [the JSON delta](data/history-audit/2026-11-08/v337-to-v367-diff.json). The prior 54-date queue is in [the date evidence gap snapshot](data/history-audit/2026-11-08/date-evidence-gaps-54.json), and the prior 616-edition queue is in [the result-change snapshot](data/history-audit/2026-11-08/result-change-review-616.json). These files should be preserved as historical audit artifacts and refreshed from the current workbook before source promotion.