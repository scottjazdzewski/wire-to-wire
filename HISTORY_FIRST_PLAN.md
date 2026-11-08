# WIRE TO WIRE — History-First Delivery Plan

**As of:** 2026-11-08  
**Order:** historical source quality → compact history screens → site approval → management systems.

The management loop stays out of development until the historical archive is reconciled and the site layout is approved.

## Current audit findings

- The private Cloudflare D1 database contains the Nov 7 H/S/E/P/B import. Its row-count, manifest-hash and integrity checks passed, but those checks verify the import against its staged files; they do not establish historical truth.
- The imported stakes export is labeled v3.37 and has 5,370 editions. The current Drive master is v3.67, marked “QA Verified — Promotion Pending,” with 5,369 editions.
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

- The main Race History list and each selected year’s race list now sort by year, then date, then race name. Entries without a recorded date sort after dated races. The change is on the main branch in commit e4e0728c89af4d767f98773b2bda4415df257e35; the repository check completed successfully.
- The delta audit now reports the correct 3,819 unchanged shared editions and separates the 917 internal-date changes from result changes needing review.
- A first fictional-name candidate batch is being screened only against the 3,856 names in the current archive. Fictional candidates stay out of historical records and D1 until separately accepted; the current batch is provisional and has not been checked against external horse registries.
