# Stakes Calendar Source Delta Audit — 2026-11-08

Compared the imported Nov 7 stakes export (v3.37) with the current Drive Master Stakes Calendar (v3.67, “QA Verified — Promotion Pending”) by race-edition ID.

| Measure | Result |
|---|---:|
| v3.37 imported editions | 5,370 |
| v3.67 master editions | 5,369 |
| Shared edition IDs | 5,369 |
| Shared rows with one or more compared field changes | 1,550 |
| Shared rows unchanged | NaN |
| Older imported IDs absent from v3.67 | 1 |
| New IDs in v3.67 | 0 |

Changed field counts overlap by race: Second_Horse_ID 208; Second_Name 316; Third_Horse_ID 178; Third_Name 284; Winner_Horse_ID 96; Winner_Name 201; Canon_Status 87; Chronology_QA 1,180; Race_Date 917; Race_Date_Basis 1,078; Distance_F 206; Track_ID 59; Track_Name 65; Race_Name 38; Status 132; Division_Key 38; Field_Size 37; Surface 6.

The current master adds Macro_Circuit, Date_Confidence, Active, Sort_Date fields that were not present in the imported export. Date confidence distribution in v3.67: INTERNAL 4,028; EXACT 1,305; WTW_FIXED 36. Active state: YES 5,223; NO 146.

The row-level imported/current values are in [the JSON delta](data/history-audit/2026-11-08/v337-to-v367-diff.json). This is a reconciliation aid; the latest master is still promotion-pending. Review the evidence for every material change before any D1 refresh. Preserve name overrides and review decisions, and do not rerun the initial import.
