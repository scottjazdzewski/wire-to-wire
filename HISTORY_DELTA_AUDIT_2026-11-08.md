# Stakes Calendar Source Delta Audit — 2026-11-08

Compared the imported Nov 7 stakes export (v3.37) with the current Drive Master Stakes Calendar (v3.67, “QA Verified — Promotion Pending”) by race-edition ID.

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

The current master adds Macro_Circuit, Date_Confidence, Active, and Sort_Date fields that were not present in the imported export. Date confidence distribution in v3.67: INTERNAL 4,028; EXACT 1,305; WTW_FIXED 36. Active state: YES 5,223; NO 146.

## Review triage

- All 917 changed race dates are labeled INTERNAL in v3.67; 916 are marked PASS and one PENDING. None of these date changes qualifies as an exact date.
- 863 of the 917 date-changing editions have a matching Evidence_Queue row with a source URL; 54 have no matching queue row. A URL alone does not change the INTERNAL classification.
- 616 changed editions include at least one winner, second-place, or third-place horse ID/name difference and need result evidence review.
- 27 changed editions are explicitly held, under review, pending, or unresolved: 14 EXACT/HOLD, 4 EXACT/REVIEW, 8 INTERNAL/PENDING, and 1 INTERNAL/UNRESOLVED.
- One v3.37-only edition remains unresolved: HSE-1995-0012-D2, Risen Star Stakes, 1995-02-28, winner “Elly’s String.” Preserve it for review; do not delete it automatically.

The row-level imported/current values are in [the JSON delta](data/history-audit/2026-11-08/v337-to-v367-diff.json). The 54 date changes without an Evidence_Queue row are isolated in [the date evidence gap queue](data/history-audit/2026-11-08/date-evidence-gaps-54.json). The 616 editions with changed placing IDs or names are isolated in [the result review queue](data/history-audit/2026-11-08/result-change-review-616.json). The latest master remains promotion-pending. Review evidence for every material change before any D1 refresh. Preserve name overrides and review decisions, and do not rerun the initial import.
